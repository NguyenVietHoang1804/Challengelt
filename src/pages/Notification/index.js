'use client';
import React, { useEffect, useState, useContext } from 'react';
import { client, databases,Query } from '~/appwrite/config';
import { UserContext } from '~/contexts/UserContext';

function Notifications() {
    const { userId } = useContext(UserContext);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!userId) return;

        // 🟢 Lấy danh sách thông báo ban đầu
        const fetchNotifications = async () => {
            try {
                const response = await databases.listDocuments(
                    '678a0e0000363ac81b93',
                    'notifications',
                    [Query.equal('userId', userId), Query.orderDesc('createdAt')]
                );
                setNotifications(response.documents);
            } catch (error) {
                console.error('Lỗi khi lấy thông báo:', error);
            }
        };

        fetchNotifications();

        // 🔴 Đăng ký Realtime để cập nhật thông báo mới
        const unsubscribe = client.subscribe(
            'databases.678a0e0000363ac81b93.collections.notifications.documents',
            (response) => {
                if (response.events.includes('databases.*.collections.notifications.documents.*.create')) {
                    const newNotification = response.payload;
                    if (newNotification.userId === userId) {
                        setNotifications((prev) => [newNotification, ...prev]); // Cập nhật danh sách thông báo
                    }
                }
            }
        );

        return () => {
            unsubscribe(); // Hủy đăng ký khi component bị unmount
        };
    }, [userId]);

    return (
        <div className="container mb-32 mx-auto p-6 bg-white rounded-lg shadow mt-8">
            <h1 className="text-3xl font-bold mb-4">Thông báo</h1>
            {notifications.length > 0 ? (
                <ul className="space-y-4">
                    {notifications.map((notification) => (
                        <li key={notification.$id} className="bg-gray-100 p-4 rounded-lg shadow">
                            <p>{notification.message}</p>
                            <small className="text-gray-500">{new Date(notification.createdAt).toLocaleString()}</small>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">Không có thông báo nào.</p>
            )}
        </div>
    );
}

export default Notifications;
