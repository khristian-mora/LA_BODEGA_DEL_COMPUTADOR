import React, { useEffect, useState } from 'react';
import { Bell, X, Check, Trash2, CheckCheck } from 'lucide-react';
import { API_CONFIG } from '../config/config';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/notifications/unread-count`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to mark as read');
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/notifications/mark-all-read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to mark all as read');
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (!response.ok) throw new Error('Failed to delete');
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            'info': '💡',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'ticket': '🔧',
            'appointment': '📅',
            'customer': '👤',
            'inventory': '📦'
        };
        return icons[type] || '🔔';
    };

    const getNotificationColor = (type) => {
        const colors = {
            'info': 'bg-blue-50 border-blue-200',
            'success': 'bg-green-50 border-green-200',
            'warning': 'bg-yellow-50 border-yellow-200',
            'error': 'bg-red-50 border-red-200',
            'ticket': 'bg-orange-50 border-orange-200',
            'appointment': 'bg-purple-50 border-purple-200',
            'customer': 'bg-indigo-50 border-indigo-200',
            'inventory': 'bg-teal-50 border-teal-200'
        };
        return colors[type] || 'bg-gray-50 border-gray-200';
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => { setShowPanel(!showPanel); if (!showPanel) fetchNotifications(); }}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {showPanel && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowPanel(false)}></div>

                    {/* Panel */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Notificaciones
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </h3>
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={loading}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                                        title="Marcar todas como leídas"
                                    >
                                        <CheckCheck className="w-3 h-3" />
                                    </button>
                                )}
                                <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">No hay notificaciones</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="text-2xl flex-shrink-0">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={`text-sm font-bold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.isRead && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(notification.createdAt).toLocaleString('es-ES', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            {!notification.isRead && (
                                                                <button
                                                                    onClick={() => markAsRead(notification.id)}
                                                                    className="text-blue-600 hover:text-blue-800"
                                                                    title="Marcar como leída"
                                                                >
                                                                    <Check className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => deleteNotification(notification.id)}
                                                                className="text-red-600 hover:text-red-800"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {notification.link && (
                                                        <a
                                                            href={notification.link}
                                                            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                                                            onClick={() => setShowPanel(false)}
                                                        >
                                                            Ver detalles →
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationCenter;
