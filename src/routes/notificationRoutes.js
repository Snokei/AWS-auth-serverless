const express = require("express");
const router = express.Router();

// In-memory store for active notification streams when running locally
const activeNotifications = [];

/**
 * GET /api/notifications
 * Retrieves recent broadcast notifications
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    count: activeNotifications.length,
    notifications: activeNotifications.slice(-20).reverse()
  });
});

/**
 * POST /api/notifications/publish
 * Trigger a real-time event notification broadcast
 */
router.post("/publish", (req, res) => {
  const { topic, message, payload } = req.body;

  if (!topic || (!message && !payload)) {
    return res.status(400).json({
      success: false,
      error: "Both 'topic' and 'message' or 'payload' are required."
    });
  }

  const newNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    topic,
    payload: payload || { message },
    timestamp: new Date().toISOString()
  };

  activeNotifications.push(newNotification);

  return res.status(200).json({
    success: true,
    message: `Notification broadcasted to topic: ${topic}`,
    notification: newNotification
  });
});

module.exports = router;
