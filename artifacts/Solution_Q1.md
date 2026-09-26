# Q1: Serverless Auth

### Architecture Approach

I used a single AWS Lambda function with an Express app wrapped using `serverless-http`, instead of creating a separate Lambda for each API. API Gateway forwards the requests to Lambda, and Express handles the routing.

**Flow:**
`Client → API Gateway → Lambda → Express → DynamoDB`

### DynamoDB & Security

I created a DynamoDB table with `email` as the partition key because email is unique and is mainly used during login.

Passwords are never stored directly. Before saving a user, I hash the password using `bcryptjs`. AWS DynamoDB also provides encryption at rest. The Lambda function accesses DynamoDB through IAM permissions.

### Registration & Login

- **POST `/register`** – Validates the input, checks whether the email already exists, hashes the password, saves the user in DynamoDB, and returns a JWT.
- **POST `/login`** – Finds the user by email, compares the entered password with the stored bcrypt hash, and generates a JWT if the credentials are correct.

### Authorization

For protected APIs, I created an `authMiddleware.js`. It reads the JWT from the `Authorization: Bearer <token>` header and verifies it using `jsonwebtoken`.

If the token is valid, I attach the decoded user information to the request and allow it to continue. If the token is missing, invalid, or expired, the API returns `401 Unauthorized`.

- **GET `/profile`** – A protected route that uses this middleware to ensure only users with a valid JWT can access it. It pulls the verified email from the request and fetches the user's latest details from DynamoDB.

I also keep the JWT secret in an environment variable rather than hard-coding it in the code.

### Code Snippets

**Lambda Entry Point (`lambda.js`):**

```javascript
const serverless = require("serverless-http");
const app = require("./src/app");

module.exports.handler = serverless(app);
```

**Authentication Routes (`src/routes/authRoutes.js`):**

```javascript
const express = require("express");
const jwt = require("jsonwebtoken");
const userDb = require("../db/users");
const verifyToken = require("../middleware/authMiddleware");
const config = require("../config");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing required fields" });
    if (password.length < 6)
      return res.status(400).json({ error: "Password too short" });

    const existingUser = await userDb.findUserByEmail(email);
    if (existingUser)
      return res.status(409).json({ error: "Email already in use" });

    const user = await userDb.createUser({ name, email, password });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn },
    );
    return res.status(201).json({ user, token });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await userDb.findUserByEmail(email);
    if (!user || !(await userDb.validatePassword(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn },
    );
    const { password: _, ...safeUser } = user;
    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await userDb.findUserByEmail(req.user.email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password, ...safeUser } = user;
    return res.status(200).json({ user: safeUser });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
```

**Authorization Middleware (`src/middleware/authMiddleware.js`):**

```javascript
const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing or invalid token format" });
    }

    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, config.jwtSecret);

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ error: "Token expired" });
    return res.status(403).json({ error: "Invalid token" });
  }
};
```

**Database & Security Logic (`src/db/users.js`):**

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const config = require('../config');

const client = new DynamoDBClient({ region: config.awsRegion });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = config.usersTable;

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
    console.warn(`[DynamoDB] Find user by email failed: ${err.message}`);
  }
  return null;
}

async function createUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  // Securely hash the password before saving
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
  } catch (err) {
    throw new Error(`DynamoDB Save Error: ${err.message}`);
  }

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  findUserByEmail,
  createUser,
  validatePassword
};
```

**Serverless Infrastructure Configuration (`serverless.yml`):**

*(This shows exactly how the DynamoDB table is securely provisioned and how the Lambda IAM roles are scoped down.)*

```yaml
service: express-jwt-auth

provider:
  name: aws
  runtime: nodejs20.x
  environment:
    USERS_TABLE: express-jwt-users
    JWT_SECRET: ${env:JWT_SECRET}
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:GetItem
            - dynamodb:PutItem
          Resource:
            - !GetAtt UsersTable.Arn

functions:
  api:
    handler: lambda.handler
    events:
      - httpApi: '*'

resources:
  Resources:
    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: express-jwt-users
        AttributeDefinitions:
          - AttributeName: email
            AttributeType: S
        KeySchema:
          - AttributeName: email
            KeyType: HASH
        BillingMode: PAY_PER_REQUEST
```
