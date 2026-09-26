# Express.js Authentication App for AWS Lambda (JWT Login & Register)

A production-ready Express.js web application with JWT authentication (Login, Registration, Protected Routes, Token Inspector), pre-configured for deployment on **AWS Lambda** and **AWS API Gateway** using `serverless-http`.

---

## 🚀 Features

- **Express.js Backend**: Complete REST API with modular architecture (`routes`, `middleware`, `db`).
- **AWS Lambda Ready**: Uses `serverless-http` to seamlessly wrap Express into an AWS Lambda handler (`lambda.js`).
- **JWT Authentication**:
  - `POST /api/register`: Hashes passwords with `bcryptjs` & generates signed JWT.
  - `POST /api/login`: Validates credentials & returns JWT bearer token.
  - `GET /api/me`: Protected route requiring valid `Authorization: Bearer <token>`.
  - `POST /api/verify`: Utility endpoint to verify and inspect JWT tokens.
- **Visual Frontend UI**: Glassmorphic dashboard with Login/Register forms, instant demo login, JWT token decoding, and live API request/response console.
- **Deployment Configs Included**: Ready-to-use configurations for **Serverless Framework** (`serverless.yml`) and **AWS SAM** (`template.yaml`).

---

## 📂 Project Structure

```
AWS Auth/
├── src/
│   ├── app.js               # Core Express app setup (CORS, static UI, routes, error handlers)
│   ├── config.js            # Environment configuration module
│   ├── db/
│   │   └── users.js         # User storage module with bcryptjs hashing
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification middleware
│   └── routes/
│       └── authRoutes.js    # Auth endpoints (register, login, me, verify)
├── public/                  # Frontend single page web app
│   ├── index.html           # UI layout
│   ├── style.css            # Modern glassmorphic styling system
│   └── app.js               # Client-side API interactions & state management
├── server.js                # Local standalone Node server launcher
├── lambda.js                # AWS Lambda handler entrypoint
├── serverless.yml           # Serverless Framework deployment config
├── template.yaml            # AWS SAM deployment config
├── .env.example             # Environment template file
├── package.json             # NPM dependencies and scripts
└── README.md                # Documentation
```

---

## 🛠️ Local Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` contents:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_change_in_production_12345!
JWT_EXPIRES_IN=24h
```

### 3. Run Server Locally
```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

Open your browser at **`http://localhost:3000`**.

> 💡 **Quick Demo Account**: Click the **"Quick Test: Click to autofill Demo Account"** banner on the login screen to sign in instantly with pre-seeded demo user: `demo@example.com` / `password123`.

---

## ☁️ Deploying to AWS Lambda

### Option 1: Deploy using Serverless Framework (Recommended)

1. Install Serverless CLI globally (if not already installed):
   ```bash
   npm install -g serverless
   ```
2. Configure AWS credentials:
   ```bash
   aws configure
   ```
3. Deploy to AWS:
   ```bash
   serverless deploy
   ```
4. Output will provide your live AWS API Gateway endpoint URL:
   ```text
   endpoint: https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com
   ```

---

### Option 2: Deploy using AWS SAM (Serverless Application Model)

1. Build SAM artifacts:
   ```bash
   sam build
   ```
2. Deploy guided wizard:
   ```bash
   sam deploy --guided
   ```

---

### Option 3: Manual Deployment via AWS Console

1. Create a zip archive of the project folder (excluding `node_modules` optional if building in AWS, or including Linux `node_modules`):
2. In AWS Console:
   - Create a **Node.js 20.x** Lambda function.
   - Set the handler to: **`lambda.handler`**.
   - Add environment variables `JWT_SECRET` and `NODE_ENV=production`.
   - Attach an **API Gateway (HTTP API or REST API)** trigger with proxy integration `/{proxy+}`.

---

## 📋 API Reference

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | No | Health check status & environment info |
| `/api/register` | `POST` | No | Register new user, returns JWT token |
| `/api/login` | `POST` | No | Authenticate user, returns JWT token |
| `/api/me` | `GET` | **Yes (Bearer)** | Returns current user profile & token payload |
| `/api/verify` | `POST` | No | Verifies JWT token string |

### Example Authorized Request:
```bash
curl -X GET http://localhost:3000/api/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
