/**
 * Notifications controller (stub implementation).
 * Provides basic endpoints so the UI can function without Firestore logic.
 */

async function showNotificationsPage(req, res, next) {
  try {
    const user = res.locals.user || null;
    const notifications = [];

    return res.render('notifications', {
      title: 'Notifications',
      user,
      notifications,
    });
  } catch (err) {
    return next(err);
  }
}

async function markAsRead(req, res) {
  return res.json({ success: true });
}

async function markAllAsRead(req, res) {
  return res.json({ success: true });
}

async function fetchNotifications(req, res) {
  return res.json({ success: true, notifications: [] });
}

module.exports = {
  showNotificationsPage,
  markAsRead,
  markAllAsRead,
  fetchNotifications,
};


