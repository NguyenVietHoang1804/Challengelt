import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { client, databases, Query } from '~/appwrite/config';
import { UserContext } from '~/contexts/UserContext';

const useNotifications = () => {
    const { userId } = useContext(UserContext);
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
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
    }, [userId]);

    useEffect(() => {
        fetchNotifications();

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

        return () => unsubscribe();
    }, [fetchNotifications, userId]);

    const memoizedNotifications = useMemo(() => notifications, [notifications]);

    return { notifications: memoizedNotifications };
};

export default useNotifications;
