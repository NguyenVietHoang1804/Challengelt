import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { client, databases, Query,DATABASE_ID,NOTIFICATIONS_ID } from '~/appwrite/config';
import { UserContext } from '~/contexts/UserContext';

const useNotifications = () => {
    const { userId } = useContext(UserContext);
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                NOTIFICATIONS_ID,
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
            `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_ID}.documents`,
            (response) => {
                if (response.events.includes(`databases.*.collections.${NOTIFICATIONS_ID}.documents.*.create`)) {
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
