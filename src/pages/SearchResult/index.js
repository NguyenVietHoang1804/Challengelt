import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { databases, Query } from '~/appwrite/config';
import SearchItem from '~/components/SearchItem';
import AccountItem from '~/components/AccountItem';

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
                if (type === 'challenge') {
                    const challengeResponse = await databases.listDocuments(
                        '678a0e0000363ac81b93',
                        '678a0fc8000ab9bb90be',
                        [Query.contains('nameChallenge', query)],
                    );

                    setSearchResults(
                        challengeResponse.documents.map((doc) => ({
                            id: `challenge-${doc.$id}`,
                            type: 'challenge',
                            data: doc,
                        })),
                    );
                } else if (type === 'account') {
                    const accountResponse = await databases.listDocuments(
                        '678a0e0000363ac81b93',
                        '678a207f00308710b3b2',
                        [Query.contains('displayName', query)],
                    );

                    setSearchResults(
                        accountResponse.documents.map((doc) => ({
                            id: `account-${doc.$id}`,
                            type: 'account',
                            data: doc,
                        })),
                    );
                } else if (type === 'video') {
                    const videoResponse = await databases.listDocuments(
                        '678a0e0000363ac81b93',
                        '679c498f001b467ed632',
                        [Query.contains('describe', query)],
                    );

                    const videoData = await Promise.all(
                        videoResponse.documents.map(async (video) => {
                            try {
                                // Lấy thông tin thử thách
                                const challenge = await databases.getDocument(
                                    '678a0e0000363ac81b93',
                                    '678a0fc8000ab9bb90be',
                                    video.challengeId,
                                );

                                // Lấy thông tin người dùng
                                const user = await databases.getDocument(
                                    '678a0e0000363ac81b93',
                                    '678a207f00308710b3b2',
                                    video.idUserJoined,
                                );

                                return {
                                    ...video,
                                    challengeName: challenge?.nameChallenge || 'Không xác định',
                                    userImg: user?.imgUser || '',
                                };
                            } catch (error) {
                                console.error('Lỗi khi lấy dữ liệu bổ sung:', error);
                                return { ...video, challengeName: 'Lỗi tải', userImg: '' };
                            }
                        }),
                    );

                    setSearchResults(
                        videoData.map((doc) => ({
                            id: `video-${doc.$id}`,
                            type: 'video',
                            data: doc,
                        })),
                    );
                }
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

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

            {loading && <p className="text-center">Đang tải dữ liệu...</p>}

            {/* Hiển thị kết quả theo tab đã chọn */}
            {activeTab === 'challenge' && (
                <div>
                    <h2 className="text-xl font-semibold">Thử thách</h2>
                    {searchResults.length > 0 ? (
                        searchResults.map((result) => <SearchItem key={result.id} data={result.data} />)
                    ) : (
                        <p>Không có thử thách nào.</p>
                    )}
                </div>
            )}

            {activeTab === 'account' && (
                <div>
                    <h2 className="text-xl font-semibold">Người dùng</h2>
                    {searchResults.length > 0 ? (
                        searchResults.map((result) => <AccountItem key={result.id} data={result.data} />)
                    ) : (
                        <p>Không có tài khoản nào.</p>
                    )}
                </div>
            )}

            {activeTab === 'video' && (
                <div>
                    <h2 className="text-xl font-semibold">Video</h2>
                    {searchResults.length > 0 ? (
                        searchResults.map((result) => (
                            <div key={result.id} className="mt-3 mb-4 grid grid-cols-4">
                                <div>
                                    <Link to={`/challenge/${result.data.challengeId}`}><p className="text-blue-600 mb-2">{result.data.challengeName || 'Không có dữ liệu'}</p></Link>
                                    <video
                                        src={result.data.videoURL}
                                        controls
                                        className=" w-full h-[175px] rounded-lg"
                                    ></video>
                                    <p className="font-semibold mt-2 ml-4 mb-3">Mô tả: {result.data.describe}</p>
                                    <Link to={`/profile/${result.data.idUserJoined}`} className='flex ml-4'>
                                        <img
                                            src={result.data.userImg || 'https://cloud.appwrite.io/v1/storage/buckets/678a12cf00133f89ab15/files/679f7b6c00277c0c36bd/view?project=678a0a09003d4f41cb57&mode=admin'}
                                            alt="User Avatar"
                                            className="w-12 h-12 rounded-full"
                                        />
                                        <p className="font-bold">{result.data.userName}</p>
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Không có video nào.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchResult;
