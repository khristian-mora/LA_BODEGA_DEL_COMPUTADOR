// Notification Management Endpoints
import { db } from './db.js';

// Get notifications for a user
export const getNotifications = (req, res) => {
    const userId = req.user.id;
    const limit = req.query.limit || 50;

    const sql = `
        SELECT * FROM notifications 
        WHERE userId = ? 
        ORDER BY createdAt DESC 
        LIMIT ?
    `;

    db.all(sql, [userId, limit], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

// Get unread count
export const getUnreadCount = (req, res) => {
    try {
        const userId = req.user.id;

        const sql = 'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0';

        db.get(sql, [userId], (err, row) => {
            if (err) {
                console.error('[NOTIFICATIONS] getUnreadCount SQL Error:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({ count: row?.count || 0 });
        });
    } catch (error) {
        console.error('[NOTIFICATIONS] getUnreadCount Exception:', error);
        res.status(500).json({ error: error.message });
    }
};

// Mark notification as read
export const markAsRead = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const sql = 'UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?';

    db.run(sql, [id, userId], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
};

// Mark all as read
export const markAllAsRead = (req, res) => {
    const userId = req.user.id;

    const sql = 'UPDATE notifications SET isRead = 1 WHERE userId = ? AND isRead = 0';

    db.run(sql, [userId], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true, updated: this.changes });
    });
};

// Create notification (internal use)
export const createNotification = (userId, type, title, message, link = null) => {
    const sql = 'INSERT INTO notifications (userId, type, title, message, link, createdAt) VALUES (?, ?, ?, ?, ?, ?)';
    const now = new Date().toISOString();

    db.run(sql, [userId, type, title, message, link, now], function (err) {
        if (err) {
            console.error('Error creating notification:', err);
        }
    });
};

// Delete notification
export const deleteNotification = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const sql = 'DELETE FROM notifications WHERE id = ? AND userId = ?';

    db.run(sql, [id, userId], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
};

// Broadcast notification to all users with specific role
export const broadcastNotification = (role, type, title, message, link = null) => {
    try {
        const sql = 'SELECT id FROM users WHERE role = ? AND status = ?';

        db.all(sql, [role, 'active'], (err, users) => {
            if (err) {
                console.error('[NOTIFICATION] broadcastNotification SQL Error:', err.message);
                return;
            }

            if (!users || users.length === 0) {
                console.log('[NOTIFICATION] broadcastNotification: No users found with role:', role);
                return;
            }

            console.log('[NOTIFICATION] Broadcasting to', users.length, 'users with role:', role);
            users.forEach(user => {
                createNotification(user.id, type, title, message, link);
            });
        });
    } catch (error) {
        console.error('[NOTIFICATION] broadcastNotification Exception:', error);
    }
};
