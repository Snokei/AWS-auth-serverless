const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const config = require('../config');

// Initialize AWS DynamoDB Client
const client = new DynamoDBClient({ region: config.awsRegion });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = config.usersTable;
const IS_AWS_LAMBDA = !!process.env.AWS_EXECUTION_ENV;

// In-Memory Fallback Store (Used ONLY during local dev if DynamoDB is unreachable)
const inMemoryUsers = [];

// Seed demo user into memory fallback
(async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  inMemoryUsers.push({
    id: 'user_demo_001',
    name: 'Alex Morgan',
    email: 'demo@example.com',
    password: hashedPassword,
    createdAt: new Date().toISOString()
  });
})();

/**
 * Find user by email from DynamoDB (Supports table key named 'express-jwt-users', 'email', or 'id')
 */
async function findUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { email: normalizedEmail }
    });
    const response = await docClient.send(command);
    if (response.Item) return response.Item;
  } catch (err) {
    console.warn(`[DynamoDB Warning] Find user by email failed: ${err.message}`);
    if (IS_AWS_LAMBDA) {
      throw new Error(`DynamoDB Error: ${err.message}`);
    }
  }

  // Fallback to in-memory store for local dev
  return inMemoryUsers.find(u => u.email.toLowerCase() === normalizedEmail) || null;
}


/**
 * Create a new user in DynamoDB
 */
async function createUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Check if user exists
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const newUser = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: newUser
    });
    await docClient.send(command);
    console.log(`[DynamoDB Success] Created user in table ${TABLE_NAME}: ${normalizedEmail}`);
  } catch (err) {
    console.error(`[DynamoDB Error] Put user failed: ${err.message}`);
    if (IS_AWS_LAMBDA) {
      throw new Error(`DynamoDB Save Error: ${err.message}`);
    }
    inMemoryUsers.push(newUser);
  }

  // Return user object without password
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Validate password against hashed password
 */
async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  findUserByEmail,
  createUser,
  validatePassword
};
