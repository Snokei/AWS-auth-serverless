require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3005,
  jwtSecret: process.env.JWT_SECRET || 'fallback_jwt_secret_key_123456789_aws_lambda',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  nodeEnv: process.env.NODE_ENV || 'development',
  usersTable: process.env.USERS_TABLE || 'express-jwt-users',
  awsRegion: process.env.AWS_REGION || 'us-east-1'
};
