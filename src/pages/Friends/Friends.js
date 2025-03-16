'use client';
import React, { useCallback, useEffect, useState, useContext, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { databases, Query, ID, client } from '~/appwrite/config';
import { UserContext } from '~/contexts/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUserFriends, faUsers } from '@fortawesome/free-solid-svg-icons';

const getUsersMap = (usersArray) =>
    usersArray.reduce((acc, user) => {
        acc[user.$id] = user;
        return acc;
    }, {});

function Friends() {
    const { userId } = useContext(UserContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');
    const [allUsers, setAllUsers] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [usersData, setUsersData] = useState({});
    const [loading, setLoading] = useState(false);
    const [friendStatusMap, setFriendStatusMap] = useState({});
    const [page, setPage] = useState({ home: 1, requests: 1, friends: 1 });
    const unsubscribeRef = useRef(null);
    const isFetching = useRef(false); // Thêm ref để theo dõi trạng thái fetching

    // Memoize common database queries
    const commonQueries = useMemo(
        () => ({
            databaseId: '678a0e0000363ac81b93',
            collections: {
                users: '678a207f00308710b3b2',
                friends: '679c4a01001b467ed634',
                requests: '679c4a00001b467ed633',
            },
        }),
        [],
    );

    const debounce = (fn, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    };

    const fetchData = useCallback(
        async (tab) => {
            if (!userId || isFetching.current) return; // Kiểm tra nếu đang fetch thì không làm gì
            isFetching.current = true; // Đặt cờ fetch thành true
            setLoading(true);
            try {
                const { databaseId, collections } = commonQueries;
                const pageSize = 10;
                const offset = (page[tab] - 1) * pageSize;

                switch (tab) {
                    case 'home': {
                        // Batch all requests using Promise.all
                        const [usersResponse, friendsList, requests] = await Promise.all([
                            databases.listDocuments(databaseId, collections.users, [
                                Query.limit(pageSize),
                                Query.offset(offset),
                                Query.notEqual('$id', userId),
                            ]),
                            databases.listDocuments(databaseId, collections.friends, [Query.equal('userId', userId)]),
                            databases.listDocuments(databaseId, collections.requests, [
                                Query.or([Query.equal('senderId', userId), Query.equal('receiverId', userId)]),
                                Query.equal('status', 'pending'),
                            ]),
                        ]);

                        const allUsersData = usersResponse.documents;
                        const friendIds = new Set(friendsList.documents.map((doc) => doc.friendId));
                        const pendingRequests = requests.documents.reduce(
                            (acc, req) => {
                                if (req.senderId === userId) acc.sent.add(req.receiverId);
                                if (req.receiverId === userId) acc.received.add(req.senderId);
                                return acc;
                            },
                            { sent: new Set(), received: new Set() },
                        );

                        // Use Set for faster lookups
                        const filteredUsers = allUsersData.filter((user) => !friendIds.has(user.$id));
                        const statusMap = {};

                        allUsersData.forEach((user) => {
                            if (friendIds.has(user.$id)) statusMap[user.$id] = 'accepted';
                            else if (pendingRequests.sent.has(user.$id)) statusMap[user.$id] = 'pending';
                            else if (pendingRequests.received.has(user.$id)) statusMap[user.$id] = 'received';
                            else statusMap[user.$id] = null;
                        });

                        setAllUsers(filteredUsers);
                        setUsersData((prev) => ({ ...prev, ...getUsersMap(allUsersData) }));
                        setFriendRequests(requests.documents.filter((req) => req.receiverId === userId));
                        setFriendStatusMap(statusMap);
                        break;
                    }
                    case 'requests': {
                        const requestsResponse = await databases.listDocuments(
                            '678a0e0000363ac81b93',
                            '679c4a00001b467ed633',
                            [
                                Query.equal('receiverId', userId),
                                Query.equal('status', 'pending'),
                                Query.limit(10),
                                Query.offset((page.requests - 1) * 10),
                            ],
                        );
                        const senderIds = requestsResponse.documents.map((req) => req.senderId);
                        const usersResponse = await databases.listDocuments(
                            '678a0e0000363ac81b93',
                            '678a207f00308710b3b2',
                            [Query.equal('$id', senderIds)],
                        );
                        setFriendRequests(requestsResponse.documents);
                        setUsersData((prev) => ({ ...prev, ...getUsersMap(usersResponse.documents) }));
                        break;
                    }
                    case 'friends': {
                        const friendsResponse = await databases.listDocuments(
                            '678a0e0000363ac81b93',
                            '679c4a01001b467ed634',
                            [Query.equal('userId', userId), Query.limit(10), Query.offset((page.friends - 1) * 10)],
                        );
                        const friendIds = friendsResponse.documents.map((doc) => doc.friendId);
                        const usersResponse = await databases.listDocuments(
                            '678a0e0000363ac81b93',
                            '678a207f00308710b3b2',
                            [Query.equal('$id', friendIds)],
                        );
                        setFriends(friendsResponse.documents);
                        setUsersData((prev) => ({ ...prev, ...getUsersMap(usersResponse.documents) }));
                        break;
                    }
                    default:
                        break;
                }
            } catch (error) {
                console.error(`Lỗi khi lấy dữ liệu cho tab ${tab}:`, error);
            } finally {
                setLoading(false);
                isFetching.current = false; // Đặt lại cờ fetch sau khi hoàn tất
            }
        },
        [userId, page, commonQueries], // Loại bỏ `loading` khỏi mảng phụ thuộc
    );

    // Memoized friend action handlers
    const handleAddFriend = useCallback(
        async (receiverId) => {
            try {
                const { databaseId, collections } = commonQueries;
                const requestData = {
                    senderId: userId,
                    receiverId,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                };

                await databases.createDocument(databaseId, collections.requests, ID.unique(), requestData);
                setFriendStatusMap((prev) => ({ ...prev, [receiverId]: 'pending' }));
                alert('Đã gửi lời mời kết bạn!');
            } catch (error) {
                console.error('Error adding friend:', error);
                alert('Failed to send friend request. Please try again.');
            }
        },
        [userId, commonQueries],
    );

    const handleCancelRequest = async (receiverId) => {
        try {
            const requestResponse = await databases.listDocuments('678a0e0000363ac81b93', '679c4a00001b467ed633', [
                Query.equal('senderId', userId),
                Query.equal('receiverId', receiverId),
                Query.equal('status', 'pending'),
            ]);
            if (requestResponse.documents.length === 0) throw new Error('Không tìm thấy yêu cầu kết bạn.');
            const requestId = requestResponse.documents[0].$id;
            await databases.deleteDocument('678a0e0000363ac81b93', '679c4a00001b467ed633', requestId);
            setFriendStatusMap((prev) => ({ ...prev, [receiverId]: null }));
            fetchData('home');
            alert('Đã hủy yêu cầu kết bạn.');
        } catch (error) {
            console.error('Lỗi khi hủy yêu cầu kết bạn:', error);
            alert('Không thể hủy yêu cầu. Vui lòng thử lại.');
        }
    };

    const handleAcceptFriend = async (requestId, senderId) => {
        try {
            await databases.deleteDocument('678a0e0000363ac81b93', '679c4a00001b467ed633', requestId);
            await Promise.all([
                databases.createDocument('678a0e0000363ac81b93', '679c4a01001b467ed634', ID.unique(), {
                    userId,
                    friendId: senderId,
                    createdAt: new Date().toISOString(),
                }),
                databases.createDocument('678a0e0000363ac81b93', '679c4a01001b467ed634', ID.unique(), {
                    userId: senderId,
                    friendId: userId,
                    createdAt: new Date().toISOString(),
                }),
            ]);
            setFriendRequests((prev) => prev.filter((req) => req.$id !== requestId));
            setFriends((prev) => [...prev, { friendId: senderId }]);
            setFriendStatusMap((prev) => ({ ...prev, [senderId]: 'accepted' }));
            fetchData('home');
            alert('Đã chấp nhận yêu cầu kết bạn!');
        } catch (error) {
            console.error('Lỗi khi chấp nhận yêu cầu:', error);
            alert('Không thể chấp nhận yêu cầu. Vui lòng thử lại.');
        }
    };

    const handleRejectFriend = async (requestId) => {
        try {
            await databases.deleteDocument('678a0e0000363ac81b93', '679c4a00001b467ed633', requestId);
            setFriendRequests((prev) => prev.filter((req) => req.$id !== requestId));
            fetchData('home');
            alert('Đã từ chối yêu cầu kết bạn.');
        } catch (error) {
            console.error('Lỗi khi từ chối yêu cầu:', error);
            alert('Không thể từ chối yêu cầu. Vui lòng thử lại.');
        }
    };

    const handleUnfriend = async (friendId) => {
        if (!window.confirm(`Bạn có chắc muốn hủy kết bạn với ${usersData[friendId]?.displayName || friendId}?`))
            return;
        try {
            const relations = await databases.listDocuments('678a0e0000363ac81b93', '679c4a01001b467ed634', [
                Query.or([
                    Query.and([Query.equal('userId', userId), Query.equal('friendId', friendId)]),
                    Query.and([Query.equal('userId', friendId), Query.equal('friendId', userId)]),
                ]),
            ]);
            await Promise.all(
                relations.documents.map((doc) =>
                    databases.deleteDocument('678a0e0000363ac81b93', '679c4a01001b467ed634', doc.$id),
                ),
            );
            setFriendStatusMap((prev) => ({ ...prev, [friendId]: null }));
            if (activeTab === 'home' && usersData[friendId]) {
                setAllUsers((prev) => [...prev, usersData[friendId]]);
            }
            setFriends((prev) => prev.filter((friend) => friend.friendId !== friendId));
            alert('Đã hủy kết bạn thành công!');
        } catch (error) {
            console.error('Lỗi khi hủy kết bạn:', error);
            alert('Không thể hủy kết bạn. Vui lòng thử lại.');
            fetchData(activeTab);
        }
    };

    const handleUserClick = (userId) => {
        navigate(`/profile/${userId}`);
    };

    const setupRealtime = useCallback(() => {
        if (unsubscribeRef.current) unsubscribeRef.current();
        const unsubscribe = client.subscribe(
            [
                `databases.678a0e0000363ac81b93.collections.679c4a00001b467ed633.documents`,
                `databases.678a0e0000363ac81b93.collections.679c4a01001b467ed634.documents`,
            ],
            (response) => {
                const { events } = response;
                if (events.includes('databases.*.collections.*.documents.*')) {
                    fetchData(activeTab);
                }
            },
        );
        unsubscribeRef.current = unsubscribe;
        return () => unsubscribe();
    }, [activeTab, fetchData]);

    // Debounced load more handler
    const handleLoadMore = useMemo(
        () =>
            debounce(() => {
                setPage((prev) => ({ ...prev, [activeTab]: prev[activeTab] + 1 }));
            }, 300),
        [activeTab],
    );

    useEffect(() => {
        if (userId) {
            fetchData(activeTab);
            setupRealtime();
        }
        return () => {
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, [activeTab, userId, fetchData, setupRealtime]);

    // Phần render giữ nguyên như mã gốc
    if (loading && !allUsers.length && !friendRequests.length && !friends.length) {
        return (
            <div className="container mx-auto mt-8 mb-[90px] p-6 bg-white rounded-lg shadow flex">
                <div className="w-1/4 bg-white p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold">Bạn bè</h1>
                    </div>
                    <ul>
                        <li className="flex items-center mb-4">
                            <FontAwesomeIcon icon={faHome} className="text-blue-500 mr-2" />
                            <span className="font-semibold">Trang chủ</span>
                        </li>
                        <li className="flex items-center mb-4">
                            <FontAwesomeIcon icon={faUserFriends} className="text-gray-600 mr-2" />
                            <span className="text-gray-600">Lời mời kết bạn</span>
                        </li>
                        <li className="flex items-center mb-4">
                            <FontAwesomeIcon icon={faUsers} className="text-gray-600 mr-2" />
                            <span className="text-gray-600">Tất cả bạn bè</span>
                        </li>
                    </ul>
                </div>
                <div className="w-3/4 p-4">
                    <h2 className="text-xl font-bold mb-4">Đang tải...</h2>
                    <div className="grid grid-cols-5 gap-4">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="bg-gray-100 p-4 rounded-lg">
                                <div className="w-24 h-24 bg-gray-300 rounded-lg mx-auto"></div>
                                <p className="mt-2 text-center text-gray-500">Đang tải...</p>
                                <button className="mt-2 w-full bg-gray-300 text-white py-2 rounded-lg">
                                    Đang tải...
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto mt-8 mb-[90px] p-6 bg-white rounded-lg shadow flex">
            <div className="w-1/4 bg-white p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold">Bạn bè</h1>
                </div>
                <ul>
                    <li
                        className={`flex items-center mb-4 cursor-pointer ${
                            activeTab === 'home' ? 'text-blue-500 font-semibold' : 'text-gray-600'
                        }`}
                        onClick={() => setActiveTab('home')}
                    >
                        <FontAwesomeIcon icon={faHome} className="mr-2" />
                        Trang chủ
                    </li>
                    <li
                        className={`flex items-center mb-4 cursor-pointer ${
                            activeTab === 'requests' ? 'text-blue-500 font-semibold' : 'text-gray-600'
                        }`}
                        onClick={() => setActiveTab('requests')}
                    >
                        <FontAwesomeIcon icon={faUserFriends} className="mr-2" />
                        Lời mời kết bạn
                        {friendRequests.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                {friendRequests.length}
                            </span>
                        )}
                    </li>
                    <li
                        className={`flex items-center mb-4 cursor-pointer ${
                            activeTab === 'friends' ? 'text-blue-500 font-semibold' : 'text-gray-600'
                        }`}
                        onClick={() => setActiveTab('friends')}
                    >
                        <FontAwesomeIcon icon={faUsers} className="mr-2" />
                        Tất cả bạn bè
                    </li>
                </ul>
            </div>

            <div className="w-3/4 p-4">
                {activeTab === 'home' && (
                    <>
                        <h2 className="text-xl font-bold mb-4">Những người bạn có thể biết</h2>
                        {allUsers.length === 0 ? (
                            <p className="text-gray-500 text-center">Không có người dùng nào để kết bạn.</p>
                        ) : (
                            <div className="grid grid-cols-5 gap-4">
                                {allUsers.map((user) => {
                                    const isReceivedRequest = friendRequests.some((req) => req.senderId === user.$id);
                                    return (
                                        <div
                                            key={user.$id}
                                            className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer"
                                        >
                                            <img
                                                src={
                                                    user.imgUser ||
                                                    'https://cloud.appwrite.io/v1/storage/buckets/678a12cf00133f89ab15/files/679f7b6c00277c0c36bd/view?project=678a0a09003d4f41cb57&mode=admin'
                                                }
                                                alt={user.displayName || 'Người dùng'}
                                                className="w-24 h-24 rounded-lg mx-auto object-cover"
                                                onClick={() => handleUserClick(user.$id)}
                                            />
                                            <p
                                                className="mt-2 font-semibold truncate"
                                                onClick={() => handleUserClick(user.$id)}
                                            >
                                                {user.displayName || user.$id}
                                            </p>
                                            {isReceivedRequest ? (
                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        className="w-1/2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                                                        onClick={() => {
                                                            const request = friendRequests.find(
                                                                (req) => req.senderId === user.$id,
                                                            );
                                                            handleAcceptFriend(request.$id, user.$id);
                                                        }}
                                                    >
                                                        Đồng ý
                                                    </button>
                                                    <button
                                                        className="w-1/2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                                                        onClick={() => {
                                                            const request = friendRequests.find(
                                                                (req) => req.senderId === user.$id,
                                                            );
                                                            handleRejectFriend(request.$id);
                                                        }}
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : friendStatusMap[user.$id] === 'pending' ? (
                                                <button
                                                    className="mt-2 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                                    onClick={() => handleCancelRequest(user.$id)}
                                                >
                                                    Hủy yêu cầu
                                                </button>
                                            ) : (
                                                <button
                                                    className={`mt-2 w-full py-2 rounded-lg transition-colors ${
                                                        friendStatusMap[user.$id] === 'accepted'
                                                            ? 'bg-green-500 text-white cursor-not-allowed'
                                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                                    }`}
                                                    onClick={() => handleAddFriend(user.$id)}
                                                    disabled={friendStatusMap[user.$id] === 'accepted'}
                                                >
                                                    {friendStatusMap[user.$id] === 'accepted'
                                                        ? 'Đã là bạn bè'
                                                        : 'Thêm bạn bè'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {allUsers.length === 10 && (
                            <button
                                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                                onClick={handleLoadMore}
                            >
                                Xem thêm
                            </button>
                        )}
                    </>
                )}

                {activeTab === 'requests' && (
                    <>
                        <h2 className="text-xl font-bold mb-4">Lời mời kết bạn</h2>
                        {friendRequests.length === 0 ? (
                            <p className="text-gray-500 text-center">Bạn chưa có lời mời kết bạn nào.</p>
                        ) : (
                            <div className="grid grid-cols-5 gap-4">
                                {friendRequests.map((request) => {
                                    const sender = usersData[request.senderId];
                                    return (
                                        <div
                                            key={request.$id}
                                            className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer"
                                        >
                                            <img
                                                src={
                                                    sender?.imgUser ||
                                                    'https://cloud.appwrite.io/v1/storage/buckets/678a12cf00133f89ab15/files/679f7b6c00277c0c36bd/view?project=678a0a09003d4f41cb57&mode=admin'
                                                }
                                                alt={sender?.displayName || 'Người dùng'}
                                                className="w-24 h-24 rounded-lg mx-auto object-cover"
                                                onClick={() => handleUserClick(request.senderId)}
                                            />
                                            <p
                                                className="mt-2 font-semibold truncate"
                                                onClick={() => handleUserClick(request.senderId)}
                                            >
                                                {sender?.displayName || request.senderId}
                                            </p>
                                            <div className="mt-2 flex gap-2">
                                                <button
                                                    className="w-1/2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                                                    onClick={() => handleAcceptFriend(request.$id, request.senderId)}
                                                >
                                                    Chấp nhận
                                                </button>
                                                <button
                                                    className="w-1/2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                                                    onClick={() => handleRejectFriend(request.$id)}
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {friendRequests.length === 10 && (
                            <button
                                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                                onClick={handleLoadMore}
                            >
                                Xem thêm
                            </button>
                        )}
                    </>
                )}

                {activeTab === 'friends' && (
                    <>
                        <h2 className="text-xl font-bold mb-4">Tất cả bạn bè</h2>
                        {friends.length === 0 ? (
                            <p className="text-gray-500 text-center">Bạn chưa có bạn bè nào.</p>
                        ) : (
                            <div className="grid grid-cols-5 gap-4">
                                {friends.map((friend) => {
                                    const friendData = usersData[friend.friendId];
                                    return (
                                        <div
                                            key={friend.$id}
                                            className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer"
                                        >
                                            <img
                                                src={
                                                    friendData?.imgUser ||
                                                    'https://cloud.appwrite.io/v1/storage/buckets/678a12cf00133f89ab15/files/679f7b6c00277c0c36bd/view?project=678a0a09003d4f41cb57&mode=admin'
                                                }
                                                alt={friendData?.displayName || 'Người dùng'}
                                                className="w-24 h-24 rounded-lg mx-auto object-cover"
                                                onClick={() => handleUserClick(friend.friendId)}
                                            />
                                            <p
                                                className="mt-2 font-semibold truncate"
                                                onClick={() => handleUserClick(friend.friendId)}
                                            >
                                                {friendData?.displayName || friend.friendId}
                                            </p>
                                            <button
                                                className="mt-2 w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                                onClick={() => handleUnfriend(friend.friendId)}
                                            >
                                                Hủy kết bạn
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Friends;
