'use client';
import React, { useEffect, useState, useContext } from 'react';
import { client, databases, Query } from '~/appwrite/config';
import { UserContext } from '~/contexts/UserContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function Notifications() {
    const { userId } = useContext(UserContext);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const notificationsPerPage = 7;
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (!userId) return;

        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const countResponse = await databases.listDocuments('678a0e0000363ac81b93', 'notifications', [
                    Query.equal('userId', userId),
                ]);
                setTotalPages(Math.ceil(countResponse.total / notificationsPerPage));

                const response = await databases.listDocuments('678a0e0000363ac81b93', 'notifications', [
                    Query.equal('userId', userId),
                    Query.orderDesc('createdAt'),
                    Query.limit(notificationsPerPage),
                    Query.offset((currentPage - 1) * notificationsPerPage),
                ]);
                setNotifications(response.documents);
            } catch (error) {
                console.error('Lỗi khi lấy thông báo:', error);
            } finally {
                setLoading(false);
            }
        };

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
            },
        );

        return () => {
            unsubscribe();
        };
    }, [userId, currentPage]);

    return (
        <div className="container mb-32 mx-auto p-6 bg-white rounded-lg shadow mt-8">
            <h1 className="text-3xl font-bold mb-4">Thông báo</h1>
            {loading ? (
                <Skeleton className="pt-[9px] mb-[3px]" height={78} count={notificationsPerPage} />
            ) : notifications.length > 0 ? (
                <>
                    <ul className="space-y-4">
                        {notifications.map((notification) => (
                            <li key={notification.$id} className="bg-gray-100 p-4 rounded-lg shadow">
                                <p>{notification.message}</p>
                                <small className="text-gray-500">
                                    {new Date(notification.createdAt).toLocaleString()}
                                </small>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-center mt-4 space-x-2">
                        <button
                            className={`px-4 py-2 rounded ${
                                currentPage === 1 ? 'bg-gray-300' : 'bg-[#f86666] text-white'
                            }`}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Trước
                        </button>
                        <span className="px-4 py-2">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
                            className={`px-4 py-2 rounded ${
                                currentPage === totalPages ? 'bg-gray-300' : 'bg-[#f86666] text-white'
                            }`}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Sau
                        </button>
                    </div>
                </>
            ) : (
                <p className="text-gray-500">Không có thông báo nào.</p>
            )}
        </div>
    );
}

export default Notifications;
