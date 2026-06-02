const jwt = require("jsonwebtoken");
const LoginLog = require("../model/loginLogModel");
const ActivityLog = require("../model/activityLogModel");

const trackActivity = async (req, action, details) => {
  try {
    let userId = req.user?.id;

    // Fallback if authMiddleware was not run on this route
    if (!userId && req.cookies?.token) {
      try {
        const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Token invalid or expired
      }
    }

    if (!userId) {
      return;
    }

    // Find the latest login log session for this user
    const activeLog = await LoginLog.findOne({ user_id: userId }).sort({ login_time: -1 });
    if (!activeLog) {
      return;
    }

    await ActivityLog.create({
      user_id: userId,
      login_log_id: activeLog._id,
      action,
      details,
    });
  } catch (error) {
    console.error("Failed to track activity:", error);
  }
};

module.exports = trackActivity;
