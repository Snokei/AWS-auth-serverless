const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.CONNECTIONS_TABLE || "SubscriptionsTable";

/**
 * Minimal & Effective AWS Lambda WebSocket Notification Handler
 */
exports.handler = async (event) => {
  const route = event.requestContext?.routeKey || "$default";
  const connectionId = event.requestContext?.connectionId;
  const body = JSON.parse(event.body || "{}");

  try {
    // 1. WebSocket Connect
    if (route === "$connect") {
      return { statusCode: 200, body: "connected" };
    }

    // 2. WebSocket Disconnect (Clean up connection record)
    if (route === "$disconnect") {
      await db.send(new DeleteCommand({ TableName: TABLE, Key: { connectionId } }));
      return { statusCode: 200, body: "disconnected" };
    }

    // 3. Subscribe to Topic
    if (route === "subscribe" || body.action === "subscribe") {
      await db.send(new PutCommand({
        TableName: TABLE,
        Item: {
          connectionId,
          topic: body.topic || "DEFAULT",
          ttl: Math.floor(Date.now() / 1000) + 86400
        }
      }));
      return { statusCode: 200, body: "subscribed" };
    }

    // 4. Publish Event Notification to Subscribers
    if (route === "publish" || body.action === "publish") {
      const { topic, payload, message } = body;
      const domain = event.requestContext.domainName;
      const stage = event.requestContext.stage;

      const apigw = new ApiGatewayManagementApiClient({
        endpoint: `https://${domain}/${stage}`
      });

      // Find subscribers for topic via GSI
      const result = await db.send(new QueryCommand({
        TableName: TABLE,
        IndexName: "topic-index",
        KeyConditionExpression: "topic = :t",
        ExpressionAttributeValues: { ":t": topic }
      }));

      // Broadcast message to active WebSocket connections
      for (const item of result.Items || []) {
        try {
          await apigw.send(new PostToConnectionCommand({
            ConnectionId: item.connectionId,
            Data: Buffer.from(JSON.stringify({
              topic,
              payload: payload || { message },
              timestamp: new Date().toISOString()
            }))
          }));
        } catch (err) {
          // Auto-clean stale connection if client disconnected (410 Gone)
          if (err.name === "GoneException" || err.$metadata?.httpStatusCode === 410) {
            await db.send(new DeleteCommand({ TableName: TABLE, Key: { connectionId: item.connectionId } }));
          }
        }
      }

      return { statusCode: 200, body: "published" };
    }

    return { statusCode: 400, body: "unknown route" };

  } catch (error) {
    console.error("WebSocket Handler Error:", error);
    return { statusCode: 500, body: error.message };
  }
};
