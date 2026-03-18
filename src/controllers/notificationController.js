import Notification from "../models/notification.js";

async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find().populate("user").sort({ message: 1 });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

async function getNotificationById(req, res, next) {
  try {
    const id = req.params.id;
    const notification = await Notification.findById(id).populate("user");
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    next(error);
  }
}

async function getNotificationByUser(req, res, next) {
  try {
    const userId = req.params.userId;
    const notifications = await Notification.find({ user: userId })
      .populate("user")
      .sort({ message: 1 });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

async function createNotification(req, res, next) {
  try {
    const { user, message } = req.body;

    const newNotification = await Notification.create({
      user,
      message,
      isRead: false,
    });

    await newNotification.populate("user");
    res.status(201).json(newNotification);
  } catch (error) {
    next(error);
  }
}

async function updateNotification(req, res, next) {
  try {
    const { id } = req.params;
    const { message, isRead } = req.body;

    // Validar que al menos un campo sea proporcionado
    if (message === undefined && isRead === undefined) {
      return res.status(400).json({
        message: "At least one field (message or isRead) must be provided for update",
      });
    }

    // Construir objeto de actualización con campos proporcionados
    const updateData = {};
    if (message !== undefined) updateData.message = message;
    if (isRead !== undefined) updateData.isRead = isRead;

    const updatedNotification = await Notification.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("user");

    if (updatedNotification) {
      return res.status(200).json(updatedNotification);
    } else {
      return res.status(404).json({ message: "Notification not found" });
    }
  } catch (error) {
    next(error);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    const deletedNotification = await Notification.findByIdAndDelete(id);

    if (deletedNotification) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ message: "Notification not found" });
    }
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    ).populate("user");

    if (notification) {
      return res.status(200).json(notification);
    } else {
      return res.status(404).json({ message: "Notification not found" });
    }
  } catch (error) {
    next(error);
  }
}

async function markAllAsReadByUser(req, res, next) {
  try {
    const { userId } = req.params;
    const result = await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

    res.status(200).json({
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
}

async function getUnreadNotificationsByUser(req, res, next) {
  try {
    const userId = req.params.userId;
    const notifications = await Notification.find({
      user: userId,
      isRead: false,
    })
      .populate("user")
      .sort({ message: 1 });

    res.json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
}

export {
  createNotification,
  deleteNotification,
  getNotificationById,
  getNotificationByUser,
  getNotifications,
  getUnreadNotificationsByUser,
  markAllAsReadByUser,
  markAsRead,
  updateNotification,
};
