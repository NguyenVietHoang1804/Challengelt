'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { databases, Query } from '~/appwrite/config';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function Explore() {
    const [popularChallenges, setPopularChallenges] = useState([]);
    const [newestChallenges, setNewestChallenges] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [allChallenges, setAllChallenges] = useState([]);
    const [filteredChallenges, setFilteredChallenges] = useState([]);
    const [visibleChallenges, setVisibleChallenges] = useState(5);
    const [allVideos, setAllVideos] = useState([]);
    const [filteredVideos, setFilteredVideos] = useState([]);
    const [visibleVideos, setVisibleVideos] = useState(6);
    const [selectedField, setSelectedField] = useState('Tất cả');
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [
                popularResponse,
                newestResponse,
                usersResponse,
                challengesResponse,
                videosResponse
            ] = await Promise.all([
                databases.listDocuments('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', [
                    Query.orderDesc('participants'),
                    Query.limit(3),
                ]),
                databases.listDocuments('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', [
                    Query.orderDesc('$createdAt'),
                    Query.limit(3),
                ]),
                databases.listDocuments('678a0e0000363ac81b93', '678a207f00308710b3b2'),
                databases.listDocuments('678a0e0000363ac81b93', '678a0fc8000ab9bb90be'),
                databases.listDocuments('678a0e0000363ac81b93', '679c498f001b467ed632'),
            ]);
    
            setPopularChallenges(popularResponse.documents);
            setNewestChallenges(newestResponse.documents);
    
            // 🔹 Tạo Map để truy xuất thử thách nhanh hơn
            const challengeMap = new Map(
                challengesResponse.documents.map(challenge => [challenge.$id, challenge])
            );
    
            // 🔹 Đếm số lượng thử thách của từng người dùng
            const userChallengeCount = usersResponse.documents.reduce((acc, user) => {
                acc[user.$id] = challengesResponse.documents.filter(c => c.idUserCreated === user.$id).length;
                return acc;
            }, {});
    
            // 🔹 Sắp xếp tài khoản theo số thử thách đã tạo
            const sortedUsers = usersResponse.documents
                .map(user => ({
                    ...user,
                    challengeCount: userChallengeCount[user.$id] || 0,
                }))
                .sort((a, b) => b.challengeCount - a.challengeCount)
                .slice(0, 3);
    
            setTopUsers(sortedUsers);
            setAllChallenges(challengesResponse.documents);
            setFilteredChallenges(challengesResponse.documents);
    
            // 🔹 Gán thông tin thử thách vào video
            const videoList = videosResponse.documents.map(video => {
                const challenge = challengeMap.get(video.challengeId);
                return {
                    ...video,
                    challengeName: challenge?.nameChallenge || 'Không xác định',
                    field: challenge?.field || 'Không xác định',
                    uploaderName: video.userName || 'Không xác định',
                };
            });
    
            setAllVideos(videoList);
            setFilteredVideos(videoList);
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
        } finally {
            setLoading(false);
        }
    }, []);
    

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilter = useCallback(
        (field) => {
            setSelectedField(field);
            setVisibleChallenges(5);
            setVisibleVideos(6);

            if (field === 'Tất cả') {
                setFilteredChallenges(allChallenges);
                setFilteredVideos(allVideos);
            } else {
                const filteredChallenges = allChallenges.filter((c) => c.field === field);
                const filteredVideos = allVideos.filter((v) => v.field === field);
                setFilteredChallenges(filteredChallenges);
                setFilteredVideos(filteredVideos);
            }
        },
        [allChallenges, allVideos],
    );

    return (
        <div className="mb-32 mt-4 bg-gray-100 min-h-screen">
            <div className="flex">
                {/* Sidebar */}
                <div className="w-1/5 p-6 bg-white shadow-lg rounded-lg">
                    <div>
                        <h3 className="text-lg font-bold">Thử thách phổ biến</h3>
                        <ul className="mt-2">
                            {loading ? (
                                <Skeleton className="pt-[9px] mb-[3px]" height={34} count={3} />
                            ) : popularChallenges.length > 0 ? (
                                popularChallenges.map((challenge) => (
                                    <Link to={`/challenge/${challenge.$id}`} key={challenge.$id}>
                                        <li className="py-2 hover:bg-gray-200 w-full cursor-pointer text-blue-500">
                                            {challenge.nameChallenge}
                                        </li>
                                    </Link>
                                ))
                            ) : (
                                <p>Không có thử thách phổ biến</p>
                            )}
                        </ul>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-bold border-t pt-2">Thử thách mới nhất</h3>
                        <ul className="mt-2">
                            {loading ? (
                                <Skeleton className="pt-[9px] mb-[3px]" height={34} count={3} />
                            ) : newestChallenges.length > 0 ? (
                                newestChallenges.map((challenge) => (
                                    <Link to={`/challenge/${challenge.$id}`} key={challenge.$id}>
                                        <li className="py-2 hover:bg-gray-200 w-full cursor-pointer text-blue-500">
                                            {challenge.nameChallenge}
                                        </li>
                                    </Link>
                                ))
                            ) : (
                                <p>Không có thử thách nào mới</p>
                            )}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold border-t pt-2">Tài khoản nổi bật</h3>
                        <ul className="mt-2">
                            {loading ? (
                                <Skeleton className="pt-[9px] mb-[3px]" height={34} count={3} />
                            ) : topUsers.length > 0 ? (
                                topUsers.map((user) => (
                                    <Link to={`/profile/${user.$id}`} key={user.$id}>
                                        <li className="py-2 hover:bg-gray-200">
                                            {user.displayName} ({user.challengeCount} thử thách)
                                        </li>
                                    </Link>
                                ))
                            ) : (
                                <p>Không có tài khoản nổi bật</p>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Main Content */}
                <div className="w-4/5 p-6">
                    {/* Bộ lọc lĩnh vực */}
                    <div className="flex space-x-2 mb-4">
                        {[
                            'Tất cả',
                            'Thể thao',
                            'Đời sống',
                            'Học tập',
                            'Nấu ăn',
                            'Sáng tạo',
                            'Nghệ thuật',
                            'Kinh doanh',
                            'Khoa học',
                            'Văn hóa',
                        ].map((field) => (
                            <button
                                key={field}
                                className={`px-4 py-2 rounded ${
                                    selectedField === field ? 'bg-[#f86666] text-white' : 'bg-gray-200'
                                }`}
                                onClick={() => handleFilter(field)}
                            >
                                {field}
                            </button>
                        ))}
                    </div>

                    {/* Danh sách thử thách */}
                    <div className="bg-white p-4 shadow-lg rounded-lg mb-6">
                        <h3 className="text-4xl font-bold mb-4">Thử thách</h3>
                        {loading ? (
                            <Skeleton className="pt-[9px] mb-[3px]" height={39} count={5} />
                        ) : filteredChallenges.length > 0 ? (
                            <>
                                <ul>
                                    {filteredChallenges.slice(0, visibleChallenges).map((challenge) => (
                                        <Link to={`/challenge/${challenge.$id}`} key={challenge.$id}>
                                            <li className="py-2 hover:bg-gray-200 w-full cursor-pointer border-b">
                                                {challenge.nameChallenge}
                                            </li>
                                        </Link>
                                    ))}
                                </ul>
                                <div className="flex space-x-2 mt-2">
                                    {visibleChallenges < filteredChallenges.length && (
                                        <button
                                            className="bg-gray-300 px-3 py-1 rounded"
                                            onClick={() => setVisibleChallenges(visibleChallenges + 5)}
                                        >
                                            Xem thêm
                                        </button>
                                    )}
                                    {visibleChallenges > 5 && (
                                        <button
                                            className="bg-gray-300 px-3 py-1 rounded"
                                            onClick={() => setVisibleChallenges(5)}
                                        >
                                            Ẩn bớt
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p>Không có thử thách phù hợp</p>
                        )}
                    </div>

                    {/* Danh sách Video */}
                    <div className="bg-white p-4 shadow-lg rounded-lg">
                        <h3 className="text-4xl font-bold mb-4">Video</h3>
                        {loading ? (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-2 border rounded-lg shadow-md">
                                    <Skeleton width={190} height={24} className='ml-[50px]'></Skeleton>
                                    <Skeleton className="ml-[20px] rounded-lg mb-2" width={250} height={141}></Skeleton>
                                    <Skeleton className='ml-[20px]' width={250}></Skeleton>
                                    <Skeleton className='ml-[20px]' width={250}></Skeleton>
                                    <Skeleton className='ml-[20px]' width={250}></Skeleton>
                                </div>
                                <div className="p-2 border rounded-lg shadow-md">
                                    <Skeleton width={190} height={24} className='ml-[50px]'></Skeleton>
                                    <Skeleton className="ml-[20px] rounded-lg mb-2" width={250} height={141}></Skeleton>
                                    <Skeleton className='ml-[20px]' width={250}></Skeleton>
                                    <Skeleton className='ml-[20px]' width={250}></Skeleton>
                                    <Skeleton className='ml-[20px]' width={250}></Skeleton>
                                </div>
                                <div className="p-2 border rounded-lg shadow-md">
                                    <Skeleton width={190} height={24} className='ml-[50px]'></Skeleton>
                                    <Skeleton className="ml-[20px] rounded-lg mb-2" width={250} height={141}></Skeleton>
                                    <Skeleton className='ml-[20px]' width={250}></Skeleton>
                                    <Skeleton className='ml-[20px]' width={250}></Skeleton>
                                    <Skeleton className='ml-[20px]' width={250}></Skeleton>
                                </div>
                            </div>
                        ) : filteredVideos.length > 0 ? (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    {filteredVideos.slice(0, visibleVideos).map((video) => (
                                        <Link to={`/challenge/${video.challengeId}`} key={video.$id}>
                                            <div className="p-2 border rounded-lg shadow-md">
                                                <p className="font-bold text-center">
                                                    Người đăng: {video.uploaderName}
                                                </p>
                                                <video
                                                    width={250}
                                                    height={350}
                                                    src={video.videoURL}
                                                    controls
                                                    className="rounded-lg mb-2 mx-auto"
                                                    loading="lazy"
                                                ></video>
                                                <p className="text-gray-700 ">Thử thách: {video.challengeName}</p>
                                                <p className="text-xl text-gray-700">Lĩnh vực: {video.field}</p>
                                                <p className="text-xl text-gray-700">Mô tả: {video.describe}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <div className="flex space-x-2 mt-2">
                                    {visibleVideos < filteredVideos.length && (
                                        <button
                                            className="bg-gray-300 px-3 py-1 rounded"
                                            onClick={() => setVisibleVideos(visibleVideos + 6)}
                                        >
                                            Xem thêm
                                        </button>
                                    )}
                                    {visibleVideos > 6 && (
                                        <button
                                            className="bg-gray-300 px-3 py-1 rounded"
                                            onClick={() => setVisibleVideos(6)}
                                        >
                                            Ẩn bớt
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p>Không có video phù hợp</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Explore;
