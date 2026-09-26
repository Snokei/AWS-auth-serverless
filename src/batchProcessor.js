const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

// Reuse clients across warm invocations (helps cold start / init cost)
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.ITEMS_TABLE || "express-jwt-items";
const PAGE_SIZE = 100;
const PARALLEL_CHUNK = 25;

/**
 * Process one item — demo work: stamp processedAt
 */
async function processItem(item) {
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { id: item.id },
      UpdateExpression: "SET processedAt = :ts, #s = :status",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":ts": new Date().toISOString(),
        ":status": "processed",
      },
    }),
  );
}

/**
 * Run async work over items in parallel chunks (DynamoDB-friendly size)
 */
async function processInParallel(items) {
  let processed = 0;
  for (let i = 0; i < items.length; i += PARALLEL_CHUNK) {
    const chunk = items.slice(i, i + PARALLEL_CHUNK);
    await Promise.all(chunk.map((item) => processItem(item)));
    processed += chunk.length;
  }
  return processed;
}

/**
 * Q5: Batch Processing Microservice
 * Paginates DynamoDB and processes records in parallel chunks.
 */
exports.handler = async (event) => {
  const started = Date.now();
  const body =
    typeof event?.body === "string"
      ? JSON.parse(event.body || "{}")
      : event?.body || event || {};

  // Optional cap for demos (default: process until table end or maxPages)
  const maxPages = Math.min(Number(body.maxPages) || 10, 50);

  let lastKey;
  let pages = 0;
  let processed = 0;

  try {
    do {
      const result = await db.send(
        new ScanCommand({
          TableName: TABLE,
          Limit: PAGE_SIZE,
          ExclusiveStartKey: lastKey,
          ProjectionExpression: "id, #n, description",
          ExpressionAttributeNames: { "#n": "name" },
        }),
      );

      const items = result.Items || [];
      if (items.length > 0) {
        processed += await processInParallel(items);
      }

      lastKey = result.LastEvaluatedKey;
      pages += 1;
    } while (lastKey && pages < maxPages);

    const response = {
      success: true,
      processed,
      pages,
      hasMore: Boolean(lastKey),
      durationMs: Date.now() - started,
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Batch Processor Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
