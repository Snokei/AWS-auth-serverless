# Q2: React.js Frontend with Lambda Backend

### Architecture Approach

I built the application with a React.js frontend and a Node.js/Express backend running on AWS Lambda. API Gateway connects the frontend with Lambda, and DynamoDB is used to store the items.

**Flow:**
`React → API Gateway → Lambda (Express) → DynamoDB`

The UI supports listing, adding, editing, and deleting items.

### Backend

I created REST APIs for the CRUD operations:

- `GET /api/list` – Fetches all items
- `POST /api/list` – Creates an item
- `PUT /api/list/:id` – Updates an item
- `DELETE /api/list/:id` – Deletes an item

DynamoDB uses `id` as the partition key and `PAY_PER_REQUEST` billing, so there is no need to manage capacity manually.

### React Frontend

I kept the frontend modular with separate components for the item list and form. The main `App.tsx` handles the API calls and application state. During API operations, I disable the relevant buttons and show loading states to avoid duplicate requests.

### Rate Limiting & Throttling Strategy

- **Frontend (React.js):** Disables input fields and submit/action buttons (`disabled={submitting}`) while showing loading spinners (`Loader2`) during API requests to prevent double-clicking and duplicate requests.
- **API Gateway (AWS):** Configured in `serverless.yml` with a **50 requests/second rate limit and 100-request burst limit**, automatically returning `429 Too Many Requests` if limits are exceeded.

> [!NOTE]
> AWS API Gateway handles default rate limiting automatically out-of-the-box (10,000 req/sec regional limit). In my setup, I explicitly defined custom lower limits in `serverless.yml` to protect DynamoDB from spikes. Additionally, rate limiting can also be handled directly inside Node.js/Lambda using `express-rate-limit` middleware (with Redis) for per-user or per-JWT granular throttling.

### Error Handling

I handle errors on both sides. The Lambda APIs use `try/catch` and return consistent error responses with appropriate status codes such as `400`, `404`, `429`, and `500`. On the React side, API failures are caught and displayed to the user through error messages/banners.

### Code Snippets

**Backend Routes (`src/routes/listRoutes.js`):**

```javascript
const express = require('express');
const itemsDb = require('../db/items');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const items = await itemsDb.getAllItems();
    return res.status(200).json({ success: true, count: items.length, items });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch items', message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, error: 'Name and description required' });
    }
    const newItem = await itemsDb.createItem({ name, description });
    return res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to create item', message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updatedItem = await itemsDb.updateItem(id, { name, description });
    if (!updatedItem) return res.status(404).json({ success: false, error: 'Item not found' });
    return res.status(200).json({ success: true, item: updatedItem });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to update item', message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await itemsDb.deleteItem(id);
    return res.status(200).json({ success: true, id });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete item', message: err.message });
  }
});

module.exports = router;
```

**DynamoDB Operations (`src/db/items.js`):**

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const config = require('../config');

const client = new DynamoDBClient({ region: config.awsRegion });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = config.itemsTable;

async function getAllItems() {
  const command = new ScanCommand({ TableName: TABLE_NAME });
  const response = await docClient.send(command);
  return response.Items || [];
}

async function createItem({ name, description }) {
  const newItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: name.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString()
  };
  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: newItem }));
  return newItem;
}

async function updateItem(id, { name, description }) {
  const response = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: "set #n = :name, #d = :description, #u = :updatedAt",
    ExpressionAttributeNames: { "#n": "name", "#d": "description", "#u": "updatedAt" },
    ExpressionAttributeValues: { ":name": name.trim(), ":description": description.trim(), ":updatedAt": new Date().toISOString() },
    ReturnValues: "ALL_NEW"
  }));
  return response.Attributes || null;
}

async function deleteItem(id) {
  await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
  return true;
}

module.exports = { getAllItems, createItem, updateItem, deleteItem };
```

**React Frontend Component (`frontend/src/App.tsx`):**

```tsx
import React, { useState, useEffect } from 'react';
import ItemList from './components/ItemList';
import ItemForm from './components/ItemForm';
import { getApiUrl } from './config';
import type { Item, FormData } from './types';

export function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetch(getApiUrl('list'));
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
    } catch (err) {
      setError('Network error fetching items');
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e: React.FormEvent, form: FormData) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? getApiUrl(`list/${editingId}`) : getApiUrl('list');
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) fetchItems();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(getApiUrl(`list/${id}`), { method: 'DELETE' });
      if (res.ok) setItems(prev => prev.filter(item => item.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded">{error}</div>}
      <ItemForm onSubmit={handleSubmit} editingId={editingId} submitting={submitting} />
      <ItemList items={items} editingId={editingId} deletingId={deletingId} onDelete={handleDelete} />
    </div>
  );
}
```

**Infrastructure & Throttling Config (`serverless.yml`):**

```yaml
service: express-jwt-auth

frameworkVersion: '>=3.0.0'

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  
  # API Gateway Rate Limiting & Throttling
  httpApi:
    cors: true
    throttling:
      rateLimit: 50        # 50 requests per second
      burstLimit: 100      # 100 max burst

functions:
  api:
    handler: lambda.handler
    events:
      - httpApi: '*'
```
