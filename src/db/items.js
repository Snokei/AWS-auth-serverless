const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} = require('@aws-sdk/lib-dynamodb');
const config = require('../config');

// Initialize AWS DynamoDB Client
const client = new DynamoDBClient({ region: config.awsRegion });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = config.itemsTable;
const IS_AWS_LAMBDA = !!process.env.AWS_EXECUTION_ENV;

// In-Memory Fallback Store for Local Development
const inMemoryItems = [
  {
    id: "item_001",
    name: "Serverless Auth Module",
    description: "Lambda function for JWT authentication & DynamoDB",
    createdAt: new Date().toISOString()
  },
  {
    id: "item_002",
    name: "DynamoDB Table Sync",
    description: "Event-driven sync between user tables",
    createdAt: new Date().toISOString()
  },
  {
    id: "item_003",
    name: "React Frontend Integration",
    description: "Frontend interface for managing items",
    createdAt: new Date().toISOString()
  }
];

/**
 * Fetch all items
 */
async function getAllItems() {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME
    });
    const response = await docClient.send(command);
    if (response.Items) {
      return response.Items;
    }
  } catch (err) {
    console.warn(`[DynamoDB Warning] Scan items failed: ${err.message}`);
    if (IS_AWS_LAMBDA) {
      throw new Error(`DynamoDB Scan Error: ${err.message}`);
    }
  }

  // Fallback to in-memory items
  return inMemoryItems;
}

/**
 * Fetch item by ID
 */
async function getItemById(id) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id }
    });
    const response = await docClient.send(command);
    if (response.Item) return response.Item;
  } catch (err) {
    console.warn(`[DynamoDB Warning] Get item by ID failed: ${err.message}`);
    if (IS_AWS_LAMBDA) {
      throw new Error(`DynamoDB Get Error: ${err.message}`);
    }
  }

  return inMemoryItems.find(item => item.id === id) || null;
}

/**
 * Create a new item
 */
async function createItem({ name, description }) {
  const newItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: name.trim(),
    description: description.trim(),
    createdAt: new Date().toISOString()
  };

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: newItem
    });
    await docClient.send(command);
    console.log(`[DynamoDB Success] Created item in table ${TABLE_NAME}: ${newItem.id}`);
  } catch (err) {
    console.error(`[DynamoDB Error] Put item failed: ${err.message}`);
    if (IS_AWS_LAMBDA) {
      throw new Error(`DynamoDB Put Error: ${err.message}`);
    }
    inMemoryItems.unshift(newItem);
  }

  return newItem;
}

/**
 * Update an existing item by ID
 */
async function updateItem(id, { name, description }) {
  const updatedFields = {
    name: name.trim(),
    description: description.trim(),
    updatedAt: new Date().toISOString()
  };

  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: "set #n = :name, #d = :description, #u = :updatedAt",
      ExpressionAttributeNames: {
        "#n": "name",
        "#d": "description",
        "#u": "updatedAt"
      },
      ExpressionAttributeValues: {
        ":name": updatedFields.name,
        ":description": updatedFields.description,
        ":updatedAt": updatedFields.updatedAt
      },
      ReturnValues: "ALL_NEW"
    });

    const response = await docClient.send(command);
    if (response.Attributes) {
      return response.Attributes;
    }
  } catch (err) {
    console.warn(`[DynamoDB Warning] Update item failed: ${err.message}`);
    if (IS_AWS_LAMBDA) {
      throw new Error(`DynamoDB Update Error: ${err.message}`);
    }
  }

  // Fallback update in-memory
  const index = inMemoryItems.findIndex(item => item.id === id);
  if (index !== -1) {
    inMemoryItems[index] = {
      ...inMemoryItems[index],
      ...updatedFields
    };
    return inMemoryItems[index];
  }

  return null;
}

/**
 * Delete item by ID
 */
async function deleteItem(id) {
  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id }
    });
    await docClient.send(command);
    console.log(`[DynamoDB Success] Deleted item ${id}`);
  } catch (err) {
    console.warn(`[DynamoDB Warning] Delete item failed: ${err.message}`);
    if (IS_AWS_LAMBDA) {
      throw new Error(`DynamoDB Delete Error: ${err.message}`);
    }
  }

  const index = inMemoryItems.findIndex(item => item.id === id);
  if (index !== -1) {
    const [deleted] = inMemoryItems.splice(index, 1);
    return deleted;
  }

  return true;
}

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};
