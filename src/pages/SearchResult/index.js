import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { databases, Query } from '~/appwrite/config';
import SearchItem from '~/components/SearchItem';
import AccountItem from '~/components/AccountItem';
import Skeleton from 'react-loading-skeleton';

function SearchResult() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query');
    const [activeTab, setActiveTab] = useState('challenge'); // Mặc định chọn "Thử thách"
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true); // Bật loading khi vào trang

    const fetchResults = useCallback(
        async (type) => {
            if (!query) return;
            setLoading(true);

            try {
                let response;
                let formattedResults = [];

                switch (type) {
                    case 'challenge':
                        response = await databases.listDocuments('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', [
                            Query.contains('nameChallenge', query),
                        ]);
                        formattedResults = response.documents.map((doc) => ({
                            id: `challenge-${doc.$id}`,
                            type: 'challenge',
                            data: doc,
                        }));
                        break;

                    case 'account':
                        response = await databases.listDocuments('678a0e0000363ac81b93', '678a207f00308710b3b2', [
                            Query.contains('displayName', query),
                        ]);
                        formattedResults = response.documents.map((doc) => ({
                            id: `account-${doc.$id}`,
                            type: 'account',
                            data: doc,
                        }));
                        break;

                    case 'video':
                        response = await databases.listDocuments('678a0e0000363ac81b93', '679c498f001b467ed632', [
                            Query.contains('describe', query),
                        ]);

                        // 🔹 Lấy thông tin thử thách và người dùng song song
                        const challengeMap = new Map();
                        const userMap = new Map();

                        await Promise.all(
                            response.documents.map(async (video) => {
                                if (!challengeMap.has(video.challengeId)) {
                                    challengeMap.set(
                                        video.challengeId,
                                        databases.getDocument(
                                            '678a0e0000363ac81b93',
                                            '678a0fc8000ab9bb90be',
                                            video.challengeId,
                                        ),
                                    );
                                }
                                if (!userMap.has(video.idUserJoined)) {
                                    userMap.set(
                                        video.idUserJoined,
                                        databases.getDocument(
                                            '678a0e0000363ac81b93',
                                            '678a207f00308710b3b2',
                                            video.idUserJoined,
                                        ),
                                    );
                                }
                            }),
                        );

                        // 🔹 Chờ tất cả các promise hoàn tất
                        const [challengeResults, userResults] = await Promise.all([
                            Promise.all([...challengeMap.values()]),
                            Promise.all([...userMap.values()]),
                        ]);

                        // 🔹 Cập nhật Map với dữ liệu thực tế
                        challengeResults.forEach((challenge) => challengeMap.set(challenge.$id, challenge));
                        userResults.forEach((user) => userMap.set(user.$id, user));

                        formattedResults = response.documents.map((video) => ({
                            id: `video-${video.$id}`,
                            type: 'video',
                            data: {
                                ...video,
                                challengeName: challengeMap.get(video.challengeId)?.nameChallenge || 'Không xác định',
                                userImg: userMap.get(video.idUserJoined)?.imgUser || '',
                            },
                        }));
                        break;

                    default:
                        console.warn('Loại tìm kiếm không hợp lệ:', type);
                        return;
                }

                setSearchResults(formattedResults);
            } catch (error) {
                console.error('Lỗi khi tìm kiếm:', error);
            } finally {
                setLoading(false);
            }
        },
        [query],
    );

    useEffect(() => {
        if (query) {
            fetchResults('challenge');
        }
    }, [query, fetchResults]);

    return (
        <div className="container mx-auto mt-8 mb-32 p-6 bg-white rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-6">Kết quả tìm kiếm cho: "{query}"</h1>

            {/* Menu Điều Hướng */}
            <div className="flex space-x-4 mb-6">
                <button
                    className={`px-4 py-2 rounded ${
                        activeTab === 'challenge' ? 'bg-[#f86666] text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => {
                        setActiveTab('challenge');
                        fetchResults('challenge');
                    }}
                >
                    Thử thách
                </button>
                <button
                    className={`px-4 py-2 rounded ${
                        activeTab === 'account' ? 'bg-[#f86666] text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => {
                        setActiveTab('account');
                        fetchResults('account');
                    }}
                >
                    Người dùng
                </button>
                <button
                    className={`px-4 py-2 rounded ${activeTab === 'video' ? 'bg-[#f86666] text-white' : 'bg-gray-200'}`}
                    onClick={() => {
                        setActiveTab('video');
                        fetchResults('video');
                    }}
                >
                    Video
                </button>
            </div>

            {/* Hiển thị kết quả theo tab đã chọn */}
            {activeTab === 'challenge' && (
                <div>
                    <h2 className="text-xl font-semibold">Thử thách</h2>
                    {loading ? (
                        <Skeleton count={9} height={50}></Skeleton>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((result) => <SearchItem key={result.id} data={result.data} />)
                    ) : (
                        <p>Không có thử thách nào.</p>
                    )}
                </div>
            )}

            {activeTab === 'account' && (
                <div>
                    <h2 className="text-xl font-semibold">Người dùng</h2>
                    {loading ? (
                        <Skeleton count={9} height={50}></Skeleton>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((result) => <AccountItem key={result.id} data={result.data} />)
                    ) : (
                        <p>Không có tài khoản nào.</p>
                    )}
                </div>
            )}

            {activeTab === 'video' && (
                <div>
                    <h2 className="text-xl font-semibold">Video</h2>
                    {loading ? (
                        <div className="grid grid-cols-3 gap-4 mt-3 mb-4">
                            {[...Array(3)].map((_, index) => (
                                <div key={index}>
                                    <Skeleton className="mb-2" width={135} height={24} />
                                    <Skeleton height={175} />
                                    <Skeleton className="mt-2 mb-3" width={250} height={13} />
                                    <Skeleton className="mt-2 mb-3" width={200} height={13} />
                                    <div className="flex">
                                        <Skeleton className="w-12 h-12 rounded-full" />
                                        <Skeleton className="ml-2" width={120} height={30} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4">
                            {searchResults.map((result) => (
                                <div key={result.id} className="p-4 bg-gray-100 rounded-lg shadow">
                                    <Link to={`/challenge/${result.data.challengeId}`}>
                                        <p className="text-blue-600 font-semibold mb-2">
                                            {result.data.challengeName || 'Không có dữ liệu'}
                                        </p>
                                    </Link>
                                    <video
                                        src={result.data.videoURL}
                                        controls
                                        className="w-full h-[175px] rounded-lg"
                                    ></video>
                                    <p className="font-semibold mt-2">Mô tả: {result.data.describe}</p>
                                    <Link
                                        to={`/profile/${result.data.idUserJoined}`}
                                        className="flex items-center mt-2"
                                    >
                                        <img
                                            src={
                                                result.data.userImg ||
                                                'https://cloud.appwrite.io/v1/storage/buckets/678a12cf00133f89ab15/files/679f7b6c00277c0c36bd/view?project=678a0a09003d4f41cb57&mode=admin'
                                            }
                                            alt="User Avatar"
                                            className="w-12 h-12 rounded-full"
                                        />
                                        <p className="font-bold ml-2">{result.data.userName}</p>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Không có video nào.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchResult;
