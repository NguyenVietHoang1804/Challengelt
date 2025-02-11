import { useState, useEffect, useContext } from 'react';
import { client, databases, Query } from '~/appwrite/config';
import { UserContext } from '~/contexts/UserContext';

const useNotifications = () => {
    const { userId } = useContext(UserContext);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!userId) return;

        // 🟢 Lấy danh sách thông báo từ database
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

        // 🔴 Đăng ký realtime để lắng nghe thông báo mới
        const unsubscribe = client.subscribe(
            'databases.678a0e0000363ac81b93.collections.notifications.documents',
            (response) => {
                if (response.events.includes('databases.*.collections.notifications.documents.*.create')) {
                    const newNotification = response.payload;
                    if (newNotification.userId === userId) {
                        setNotifications((prev) => [newNotification, ...prev]);
                    }
                }
            }
        );

        return () => {
            unsubscribe(); // Hủy đăng ký khi component bị unmount
        };
    }, [userId]);

    return { notifications };
};

export default useNotifications;
