import Notification from "../models/AuditNotification.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listMyNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, limit = 50 } = req.query;
  
  let query = { patient: req.user.id };
  if (unreadOnly === 'true') query.isRead = false;
  
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
  
  const unreadCount = await Notification.countDocuments({ 
    patient: req.user.id, 
    isRead: false 
  });
  
  res.json({ notifications, unreadCount });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const notification = await Notification.findOne({ 
    _id: id, 
    patient: req.user.id 
  });
  
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }
  
  res.json(notification);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { patient: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  
  res.json({ 
    message: "All notifications marked as read",
    modifiedCount: result.modifiedCount 
  });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const notification = await Notification.findOneAndDelete({ 
    _id: id, 
    patient: req.user.id 
  });
  
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  res.json({ message: "Notification deleted" });
});