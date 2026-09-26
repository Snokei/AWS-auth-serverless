# Q5: Batch Processing Microservice

### Architecture Approach

I built a small batch-processing Lambda that reads items from DynamoDB in pages and processes them in parallel. For a demo this runs as one worker; for millions of records I would fan the work out further (see below).

**Flow:**
`HTTP POST /batch/process → batchProcessor Lambda → DynamoDB (paginated Scan) → parallel chunk updates`

### How Batch + Parallel Works

1. **Pagination** – I scan/query with a `Limit` and follow `ExclusiveStartKey` so Lambda never loads the whole table into memory at once.
2. **Parallel chunks** – Each page is processed with `Promise.all` in groups of 25 (a DynamoDB-friendly batch size). Demo work stamps `processedAt` / `status` on each item.
3. **Clients outside the handler** – DynamoDB clients are created once at module scope so warm starts reuse them (same idea as Q3).

### Handling Millions of Records

One Lambda has a time limit, so it cannot finish millions of rows alone. For that scale I would:

- Split work with **SQS** (or **Step Functions**) so many worker Lambdas run in parallel
- Optionally use DynamoDB **Parallel Scan** (`Segment` / `TotalSegments`) so each worker owns a slice of the table

### DynamoDB & Lambda Config (Performance + Cost)

- **DynamoDB:** `PAY_PER_REQUEST` fits uneven batch jobs. Prefer Query + GSI over full-table Scan in production. Use `ProjectionExpression` so each page only fetches needed attributes. Prefer `BatchGetItem` / `BatchWriteItem` (max 25) when reading/writing many keys.
- **Lambda:** Give the worker more memory/timeout than the API (e.g. 512 MB / 60s), keep the package small, and avoid over-provisioning idle concurrency.

>
> **If building this for production:**
> The demo uses a single HTTP-triggered Lambda for simplicity. At real scale I would add:
> - **Amazon SQS** as a buffer between the reader and workers, so millions of records are split into manageable batches
> - **Controlled Lambda concurrency** so parallel workers don’t overwhelm DynamoDB and cause throttling
> - **BatchWriteItem / BatchGetItem** with retries for unprocessed items (exponential backoff)
> - **Idempotent** processing, retries, and a **Dead Letter Queue (DLQ)** for failed records
> - **CloudWatch** (and optionally X-Ray) to watch duration, errors, throttling, and throughput
> - Tune **Lambda memory** (more memory also means more CPU) and **SQS/Lambda batch size** based on record size and processing time
>
> That keeps the same ideas as this demo, but safer and more scalable in production.

### Code Snippets

**Batch helpers + paginate (`src/batchProcessor.js`):**

```javascript
async function processItem(item) {
  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id: item.id },
    UpdateExpression: "SET processedAt = :ts, #s = :status",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: {
      ":ts": new Date().toISOString(),
      ":status": "processed"
    }
  }));
}

async function processInParallel(items) {
  let processed = 0;
  for (let i = 0; i < items.length; i += PARALLEL_CHUNK) {
    const chunk = items.slice(i, i + PARALLEL_CHUNK);
    await Promise.all(chunk.map((item) => processItem(item)));
    processed += chunk.length;
  }
  return processed;
}

do {
  const result = await db.send(new ScanCommand({
    TableName: TABLE,
    Limit: PAGE_SIZE,
    ExclusiveStartKey: lastKey,
    ProjectionExpression: "id, #n, description",
    ExpressionAttributeNames: { "#n": "name" }
  }));

  const items = result.Items || [];
  if (items.length > 0) {
    processed += await processInParallel(items);
  }

  lastKey = result.LastEvaluatedKey;
  pages += 1;
} while (lastKey && pages < maxPages);
```

**Worker config (`serverless.yml`):**

```yaml
batchProcessor:
  handler: src/batchProcessor.handler
  memorySize: 512
  timeout: 60
  events:
    - httpApi:
        path: /batch/process
        method: POST
```
