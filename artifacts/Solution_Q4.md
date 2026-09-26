# Q4: Real-time Notifications

### Architecture Approach

I built a real-time notification demo with React.js, a Node.js Lambda WebSocket handler, API Gateway, and DynamoDB for topic subscriptions.

**Flow:**
`React (WebSocket) → API Gateway → Lambda → DynamoDB`

Users subscribe to topics (e.g. `#GENERAL`, `#SYSTEM_ALERTS`). When someone publishes on that topic, subscribed clients get the update in real time.

### DynamoDB Setup

`SubscriptionsTable` uses `connectionId` as the partition key. A GSI `topic-index` on `topic` lets me query subscribers quickly without scanning. TTL (24 hours) cleans up stale connection records.

### Backend & Frontend

The Lambda (`src/notificationHandler.js`) handles `$connect`, `$disconnect`, `subscribe`, and `publish`. Publish queries `topic-index`, then fans out with `Promise.all` + `PostToConnection`. Dead sockets (410 Gone) are deleted from DynamoDB.

On the React side, `useNotificationWebSocket` manages the socket and subscriptions, and `NotificationCenter` lets users pick channels and send messages. REST publish/list routes support local demo when WebSocket isn’t available.

### Scalability & Low Latency

1. **API Gateway** holds WebSocket connections — Lambda only runs on events.
2. **GSI query by topic** — faster than a table scan.
3. **`Promise.all` fan-out** — send to all subscribers in parallel.
4. **410 cleanup** — drop dead connections so retries don’t waste time.

For very large fan-out, I would batch connection IDs into **SQS** and use worker Lambdas.

>
> **If deploying to production:** I would use **CloudWatch** to monitor Lambda duration, errors, and throttling, with alarms (e.g. SNS) when metrics spike. **X-Ray** can help trace latency across API Gateway → Lambda → DynamoDB.

### Code Snippets

**Publish fan-out (`src/notificationHandler.js`):**

```javascript
const result = await db.send(new QueryCommand({
  TableName: TABLE,
  IndexName: "topic-index",
  KeyConditionExpression: "topic = :t",
  ExpressionAttributeValues: { ":t": topic }
}));

await Promise.all(
  (result.Items || []).map(async (item) => {
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
      if (err.name === "GoneException" || err.$metadata?.httpStatusCode === 410) {
        await db.send(new DeleteCommand({
          TableName: TABLE,
          Key: { connectionId: item.connectionId }
        }));
      }
    }
  })
);
```

**React subscribe (`frontend/src/hooks/useNotificationWebSocket.ts`):**

```typescript
ws.onopen = () => {
  setIsConnected(true);
  subscribedTopics.forEach((topic) =>
    ws.send(JSON.stringify({ action: "subscribe", topic }))
  );
};

ws.onmessage = (e) => {
  const item = JSON.parse(e.data);
  setNotifications((prev) => [item, ...prev]);
};
```

**Table config (`serverless.yml`):**

```yaml
SubscriptionsTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: SubscriptionsTable
    KeySchema:
      - AttributeName: connectionId
        KeyType: HASH
    GlobalSecondaryIndexes:
      - IndexName: topic-index
        KeySchema:
          - AttributeName: topic
            KeyType: HASH
        Projection:
          ProjectionType: ALL
    BillingMode: PAY_PER_REQUEST
    TimeToLiveSpecification:
      AttributeName: ttl
      Enabled: true
```
