'use client';
import React, { useState, useEffect } from 'react';
import { client } from '~/appwrite/config';
import { UserContext } from '~/contexts/UserContext';
import { useContext } from 'react';

const NotificationPopup = ({ onChatRedirect }) => {
    const { userId } = useContext(UserContext);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = client.subscribe(
            `databases.678a0e0000363ac81b93.collections.messages.documents`,
            (response) => {
                if (response.events[0].includes('create') && response.payload) {
                    const { senderId, receiverId, senderName, message } = response.payload;

                    // Kiểm tra kỹ: chỉ hiển thị nếu userId là receiverId và không phải senderId
                    if (senderId !== userId && receiverId === userId) {
                        setNotification({
                            sender: senderName || 'Người lạ',
                            message: message,
                            senderId: senderId,
                        });

                        setTimeout(() => setNotification(null), 5000);
                    } else {
                    }
                }
            },
        );

        return () => unsubscribe();
    }, [userId]);

    if (!notification) return null;

    return (
        <div
            className="fixed top-15 right-5 bg-white p-4 shadow-lg z-100000 rounded-lg cursor-pointer animate-slide-in"
            onClick={() => onChatRedirect(notification.senderId)}
        >
            <p><span className="font-bold">{notification.sender}</span> đã nhắn tin:</p>
            <p className="text-gray-600 truncate w-48">{notification.message}</p>
        </div>
    );
};

export default NotificationPopup;