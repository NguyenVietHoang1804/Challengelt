'use client';
import React, { useEffect, useState } from 'react';
import { databases, Query } from '~/appwrite/config';
import { Link } from 'react-router-dom';

function Explore() {
    const [popularChallenges, setPopularChallenges] = useState([]);
    const [newestChallenges, setNewestChallenges] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [allChallenges, setAllChallenges] = useState([]);
    const [filteredChallenges, setFilteredChallenges] = useState([]);
    const [visibleChallenges, setVisibleChallenges] = useState(5); // Số thử thách hiển thị ban đầu
    const [allVideos, setAllVideos] = useState([]);
    const [filteredVideos, setFilteredVideos] = useState([]);
    const [visibleVideos, setVisibleVideos] = useState(6); // Số video hiển thị ban đầu
    const [selectedField, setSelectedField] = useState('Tất cả');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const popularResponse = await databases.listDocuments('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', [
                    Query.orderDesc('participants'),
                    Query.limit(3),
                ]);
                setPopularChallenges(popularResponse.documents);

                const newestResponse = await databases.listDocuments('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', [
                    Query.orderDesc('$createdAt'),
                    Query.limit(3),
                ]);
                setNewestChallenges(newestResponse.documents);

                const usersResponse = await databases.listDocuments('678a0e0000363ac81b93', '678a207f00308710b3b2');
                const challengesResponse = await databases.listDocuments(
                    '678a0e0000363ac81b93',
                    '678a0fc8000ab9bb90be',
                );
                const videosResponse = await databases.listDocuments('678a0e0000363ac81b93', '679c498f001b467ed632');

                const userChallengeCount = {};
                challengesResponse.documents.forEach((challenge) => {
                    const userId = challenge.idUserCreated;
                    userChallengeCount[userId] = (userChallengeCount[userId] || 0) + 1;
                });

                const sortedUsers = usersResponse.documents
                    .map((user) => ({ ...user, challengeCount: userChallengeCount[user.$id] || 0 }))
                    .sort((a, b) => b.challengeCount - a.challengeCount)
                    .slice(0, 3);
                setTopUsers(sortedUsers);

                setAllChallenges(challengesResponse.documents);
                setFilteredChallenges(challengesResponse.documents);

                const videoList = videosResponse.documents.map((video) => {
                    const challenge = challengesResponse.documents.find((c) => c.$id === video.challengeId);
                    return {
                        ...video,
                        challengeName: challenge ? challenge.nameChallenge : 'Không xác định',
                        field: challenge ? challenge.field : 'Không xác định',
                        uploaderName: video.userName || 'Không xác định',
                    };
                });

                setAllVideos(videoList);
                setFilteredVideos(videoList);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu:', error);
            }
        };

        fetchData();
    }, []);

    const handleFilter = (field) => {
        setSelectedField(field);
        setVisibleChallenges(5); // Reset số thử thách hiển thị
        setVisibleVideos(6); // Reset số video hiển thị

        if (field === 'Tất cả') {
            setFilteredChallenges(allChallenges);
            setFilteredVideos(allVideos);
        } else {
            const filteredChallenges = allChallenges.filter((c) => c.field === field);
            const filteredVideos = allVideos.filter((v) => v.field === field);
            setFilteredChallenges(filteredChallenges);
            setFilteredVideos(filteredVideos);
        }
    };

    return (
        <div className="mb-32 mt-4 bg-gray-100 min-h-screen">
            <div className="flex">
                {/* Sidebar */}
                <div className="w-1/5 p-6 bg-white shadow-lg rounded-lg">
                    <div>
                        <h3 className="text-lg font-bold">Thử thách phổ biến</h3>
                        <ul className="mt-2">
                            {popularChallenges.length > 0 ? (
                                popularChallenges.map((challenge) => (
                                    <Link to={`/challenge/${challenge.$id}`}>
                                        <li
                                            className="py-2 hover:bg-gray-200 w-full cursor-pointer text-blue-500 "
                                            key={challenge.$id}
                                        >
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
                            {newestChallenges.length > 0 ? (
                                newestChallenges.map((challenge) => (
                                    <Link to={`/challenge/${challenge.$id}`}>
                                        <li
                                            className="py-2 hover:bg-gray-200 w-full cursor-pointer text-blue-500 "
                                            key={challenge.$id}
                                        >
                                            {challenge.nameChallenge}
                                        </li>
                                    </Link>
                                ))
                            ) : (
                                <p>Không có thử thách mới</p>
                            )}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold border-t pt-2">Tài khoản nổi bật</h3>
                        <ul className="mt-2">
                            {topUsers.length > 0 ? (
                                topUsers.map((user) => (
                                    <Link to={`/profile/${user.$id}`}>
                                        <li key={user.$id} className="py-2 hover:bg-gray-200">
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
                        {filteredChallenges.length > 0 ? (
                            <>
                                <ul>
                                    {filteredChallenges.slice(0, visibleChallenges).map((challenge) => (
                                        <Link to={`/challenge/${challenge.$id}`}>
                                            <li
                                                className="py-2 hover:bg-gray-200 w-full cursor-pointer border-b"
                                                key={challenge.$id}
                                            >
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
                            <p>Không có thử thách tương ứng</p>
                        )}
                    </div>

                    {/* Danh sách Video */}
                    <div className="bg-white p-4 shadow-lg rounded-lg">
                        <h3 className="text-4xl font-bold mb-4">Video</h3>
                        {filteredVideos.length > 0 ? (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    {filteredVideos.slice(0, visibleVideos).map((video) => (
                                        <Link to={`/challenge/${video.challengeId}`}>
                                            <div key={video.$id} className="p-2 border rounded-lg shadow-md">
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
                            <p>Không có video tương ứng</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Explore;
