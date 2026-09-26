const express = require("express");
const router = express.Router();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.CONNECTIONS_TABLE || "SubscriptionsTable";

/**
 * GET /api/notifications
 * Retrieves recent broadcast notifications directly from DynamoDB
 */
router.get("/", async (req, res) => {
  try {
    const { topic } = req.query;

    let items = [];
    if (topic) {
      // Query by topic using GSI
      const data = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "topic-index",
        KeyConditionExpression: "topic = :t",
        ExpressionAttributeValues: { ":t": String(topic).toUpperCase() }
      }));
      items = data.Items || [];
    } else {
      // Scan table for recent items
      const data = await db.send(new ScanCommand({
        TableName: TABLE_NAME,
        Limit: 50
      }));
      items = data.Items || [];
    }

    return res.status(200).json({
      success: true,
      count: items.length,
      notifications: items.slice(-20).reverse()
    });
  } catch (error) {
    console.error("Error fetching notifications from DynamoDB:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch notifications from DynamoDB",
      details: error.message
    });
  }
});

/**
 * POST /api/notifications/publish
 * Save and broadcast a real-time event notification to DynamoDB
 */
router.post("/publish", async (req, res) => {
  const { topic, message, payload } = req.body;

  if (!topic || (!message && !payload)) {
    return res.status(400).json({
      success: false,
      error: "Both 'topic' and 'message' or 'payload' are required."
    });
  }

  const cleanTopic = String(topic).toUpperCase();
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  const newNotification = {
    connectionId: notificationId, // Primary Key
    topic: cleanTopic,
    payload: payload || { message },
    timestamp: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + 86400 // 24-hour expiration
  };

  try {
    // Store notification record into DynamoDB
    await db.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: newNotification
    }));

    return res.status(200).json({
      success: true,
      message: `Notification saved and broadcasted to DynamoDB for topic: ${cleanTopic}`,
      notification: newNotification
    });
  } catch (error) {
    console.error("Error publishing notification to DynamoDB:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to save notification to DynamoDB",
      details: error.message
    });
  }
});

module.exports = router;
