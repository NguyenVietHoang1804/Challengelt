'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { databases, storage, account, Query,ID } from '~/appwrite/config';
import { Link, useNavigate } from 'react-router-dom';
import { useDebounce } from '~/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import styles from './Admin.module.scss';

const cx = classNames.bind(styles);

function Admin() {
    const [activeTab, setActiveTab] = useState(''); // Theo dõi tab nào đang chọn
    const [users, setUsers] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editChallenge, setEditChallenge] = useState(null);
    const [previewImage, setPreviewImage] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [searchUser, setSearchUser] = useState('');
    const [searchChallenge, setSearchChallenge] = useState('');
    const [searchVideo, setSearchVideo] = useState('');
    const debouncedSearchUser = useDebounce(searchUser, 700);
    const debouncedSearchChallenge = useDebounce(searchChallenge, 700);
    const debouncedSearchVideo = useDebounce(searchVideo, 700);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const user = await account.get();
                if (user.labels && user.labels.includes('admin')) {
                    setIsAdmin(true);
                } else {
                    navigate('/'); // Nếu không phải admin, chuyển hướng về trang chủ
                }
            } catch {
                navigate('/');
            }
        };

        checkAdmin();
    }, [navigate]);

    // Lấy danh sách thử thách
    const fetchChallenges = useCallback(async () => {
        setLoading(true);
        try {
            const queries = debouncedSearchChallenge ? [Query.contains('nameChallenge', debouncedSearchChallenge)] : [];
            const response = await databases.listDocuments('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', queries);
            setChallenges(response.documents);
        } catch (error) {
            console.error('Lỗi khi lấy thử thách:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchChallenge]);

    // Lấy danh sách người dùng
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const queries = debouncedSearchUser ? [Query.contains('displayName', debouncedSearchUser)] : [];
            const response = await databases.listDocuments('678a0e0000363ac81b93', '678a207f00308710b3b2', queries);
            setUsers(response.documents);
        } catch (error) {
            console.error('Lỗi khi lấy người dùng:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchUser]);

    // Lấy danh sách video
    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            const queries = debouncedSearchVideo ? [Query.contains('describe', debouncedSearchVideo)] : [];
            const response = await databases.listDocuments('678a0e0000363ac81b93', '679c498f001b467ed632', queries);

            // Fetch tất cả thử thách để ánh xạ với video
            const challengesResponse = await databases.listDocuments('678a0e0000363ac81b93', '678a0fc8000ab9bb90be');
            const challengesMap = challengesResponse.documents.reduce((map, challenge) => {
                map[challenge.$id] = { name: challenge.nameChallenge, field: challenge.field };
                return map;
            }, {});

            // Gắn thông tin thử thách vào mỗi video
            const videosWithChallenges = response.documents.map((video) => ({
                ...video,
                challengeName: challengesMap[video.challengeId]?.name || 'Không xác định',
                challengeField: challengesMap[video.challengeId]?.field || 'Không xác định',
            }));

            setVideos(videosWithChallenges);
        } catch (error) {
            console.error('Lỗi khi lấy video:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchVideo]);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab, debouncedSearchUser, fetchUsers]);

    useEffect(() => {
        if (activeTab === 'challenges') {
            fetchChallenges();
        }
    }, [activeTab, debouncedSearchChallenge, fetchChallenges]);

    useEffect(() => {
        if (activeTab === 'videos') {
            fetchVideos();
        }
    }, [activeTab, debouncedSearchVideo, fetchVideos]);

    // Xử lý chuyển trang
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Tính toán dữ liệu phân trang
    const getPaginatedData = (data) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    };

    const getPaginationButtons = (totalItems) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    };

    // Xóa người dùng
    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
        try {
            await databases.deleteDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', userId);
            setUsers((prev) => prev.filter((user) => user.$id !== userId));
            alert('Xóa người dùng thành công.');
        } catch (error) {
            console.error('Lỗi khi xóa người dùng:', error);
        }
    };

    // Xóa thử thách và toàn bộ dữ liệu liên quan
    const handleDeleteChallenge = async (challenge) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa thử thách này và toàn bộ dữ liệu liên quan?')) return;

        try {
            if (!challenge.$id) {
                console.error('Lỗi: Challenge ID không hợp lệ.');
                return;
            }

            // 🔹 1. Xóa hình ảnh thử thách trong Storage nếu có
            if (challenge.fileImgId) {
                await storage.deleteFile('678a12cf00133f89ab15', challenge.fileImgId);
            }

            // 🔹 2. Kiểm tra và lấy danh sách người tham gia thử thách từ "joinedChallenges"
            const joinedResponse = await databases.listDocuments('678a0e0000363ac81b93', '679c498f001b467ed632', [
                Query.equal('challengeId', challenge.$id),
            ]);

            if (joinedResponse && joinedResponse.documents.length > 0) {
                // 🔹 3. Xóa tất cả video của người tham gia
                await Promise.all(
                    joinedResponse.documents.map(async (entry) => {
                        if (entry.fileId) {
                            await storage.deleteFile('678a12cf00133f89ab15', entry.fileId); // Xóa video trong Storage
                        }
                        await databases.deleteDocument('678a0e0000363ac81b93', '679c498f001b467ed632', entry.$id); // Xóa dữ liệu tham gia
                    }),
                );
            }

            // 🔹 4. Xóa thử thách trong collection "challenges"
            await databases.deleteDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', challenge.$id);

            // 🔹 5. Cập nhật UI: Loại bỏ thử thách khỏi danh sách hiển thị
            setChallenges((prev) => prev.filter((c) => c.$id !== challenge.$id));

            alert('Xóa thử thách và tất cả dữ liệu liên quan thành công.');
        } catch (error) {
            console.error('Lỗi khi xóa thử thách:', error);
        }
    };

    // Sửa thông tin thử thách
    const handleEditChallenge = (challenge) => {
        setEditChallenge(challenge);
        setPreviewImage(challenge.imgChallenge);
    };

    const handleSaveEditChallenge = async () => {
        if (!editChallenge) return;
        setLoading(true);
        try {
            let imageUrl = editChallenge.imgChallenge;
            if (editChallenge.newImage) {
                const uploadResponse = await storage.createFile(
                    '678a12cf00133f89ab15',
                    editChallenge.fileImgId || 'unique()',
                    editChallenge.newImage,
                );
                imageUrl = storage.getFileView('678a12cf00133f89ab15', uploadResponse.$id);
            }

            await databases.updateDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', editChallenge.$id, {
                nameChallenge: editChallenge.nameChallenge,
                describe: editChallenge.describe,
                field: editChallenge.field,
                imgChallenge: imageUrl,
            });

            setChallenges((prev) =>
                prev.map((c) => (c.$id === editChallenge.$id ? { ...editChallenge, imgChallenge: imageUrl } : c)),
            );
            setEditChallenge(null);
            alert('Cập nhật thử thách thành công!');
        } catch (error) {
            console.error('Lỗi khi cập nhật thử thách:', error);
        } finally {
            setLoading(false);
        }
    };

    // Xóa video
    const handleDeleteVideo = async (video) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa video này?')) return;
    
        try {
            // 1. Xóa video khỏi Storage
            if (video.fileId) {
                await storage.deleteFile('678a12cf00133f89ab15', video.fileId);
            }
    
            // 2. Xóa dữ liệu tham gia thử thách trong collection "joinedChallenges"
            await databases.deleteDocument('678a0e0000363ac81b93', '679c498f001b467ed632', video.$id);
    
            // 3. Giảm số lượng người tham gia trong collection "challenges"
            const challengeData = await databases.getDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', video.challengeId);
            const updatedParticipants = Math.max((challengeData.participants || 1) - 1, 0);
    
            await databases.updateDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', video.challengeId, {
                participants: updatedParticipants,
            });
    
            // 4. Trừ điểm của người tham gia và chủ thử thách
            const userJoined = await databases.getDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', video.idUserJoined);
            const challengeOwner = await databases.getDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', challengeData.idUserCreated);
    
            await databases.updateDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', video.idUserJoined, {
                points: Math.max((userJoined.points || 5) - 5, 0),
            });
    
            await databases.updateDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', challengeData.idUserCreated, {
                points: Math.max((challengeOwner.points || 5) - 5, 0),
            });
    
            // 5. Gửi thông báo đến chủ thử thách
            await databases.createDocument('678a0e0000363ac81b93', 'notifications', ID.unique(), {
                userId: challengeData.idUserCreated,
                message: `${video.userName} đã rời khỏi thử thách: ${challengeData.nameChallenge}. Bạn bị trừ 5 điểm!`,
                challengeId: video.challengeId,
                createdAt: new Date().toISOString(),
            });
    
            // 6. Cập nhật UI sau khi xóa video
            setVideos((prev) => prev.filter((v) => v.$id !== video.$id));
            alert('Xóa video thành công và cập nhật thử thách.');
        } catch (error) {
            console.error('Lỗi khi xóa video:', error);
            alert('Xóa video thất bại. Vui lòng thử lại.');
        }
    };
    

    const handleClear = () => {
        setSearchUser('');
        setSearchChallenge('');
        setSearchVideo('');
        inputRef.current.focus();
    };

    if (!isAdmin) {
        return <p className="text-center text-red-500">Bạn không có quyền truy cập trang này.</p>;
    }

    return (
        <div className="container mt-6 mb-32 mx-auto p-6 bg-white rounded-lg shadow">
            <h1 className="text-4xl font-bold text-center mb-6">Admin Dashboard</h1>

            {/* Menu Điều Hướng */}
            <div className="flex space-x-4 mb-6">
                <button
                    className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-[#f86666] text-white' : 'bg-gray-200'}`}
                    onClick={() => {
                        setActiveTab('users');
                        fetchUsers();
                        setCurrentPage(1);
                    }}
                >
                    Quản lý Người Dùng
                </button>
                <button
                    className={`px-4 py-2 rounded ${
                        activeTab === 'challenges' ? 'bg-[#f86666] text-white' : 'bg-gray-200'
                    }`}
                    onClick={() => {
                        setActiveTab('challenges');
                        fetchChallenges();
                        setCurrentPage(1);
                    }}
                >
                    Quản lý Thử Thách
                </button>
                <button
                    className={`px-4 py-2 rounded ${activeTab === 'videos' ? 'bg-[#f86666] text-white' : 'bg-gray-200'}`}
                    onClick={() => {
                        setActiveTab('videos');
                        fetchVideos();
                        setCurrentPage(1);
                    }}
                >
                    Quản lý Video
                </button>
            </div>

            {loading && <p className="text-center">Đang tải dữ liệu...</p>}

            {/* Quản lý Người Dùng */}
            {activeTab === 'users' && (
                <div>
                    <h2 className="text-2xl font-semibold">Quản lý người dùng</h2>
                    <div className="flex justify-between mt-6">
                        <label className="text-xl leading-[35px] w-[150px]">Tìm kiếm người dùng: </label>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Tìm kiếm người dùng"
                            value={searchUser}
                            onChange={(e) => {
                                setSearchUser(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full p-2 border rounded mb-4 "
                        />
                        {!!searchUser && !loading && (
                            <button onClick={handleClear}>
                                <FontAwesomeIcon className={cx('clear')} icon={faCircleXmark} />
                            </button>
                        )}
                    </div>
                    <ul className="space-y-4 mt-2">
                        {getPaginatedData(users).map((user) => (
                            <li key={user.$id} className="flex justify-between bg-gray-100 p-4 rounded-lg shadow">
                                <div>
                                    <p className="font-bold">{user.displayName}</p>
                                    <p className="text-xl">{user.gmail}</p>
                                </div>
                                <div>
                                    <Link to={`/profile/${user.$id}`}>
                                        <button className="bg-blue-500 text-white mr-2 px-4 py-2 rounded">Xem</button>
                                    </Link>
                                    <button
                                        className="bg-red-500 text-white px-4 py-2 rounded"
                                        onClick={() => handleDeleteUser(user.$id)}
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-center mt-4">
                        {getPaginationButtons(users.length).map((page) => (
                            <button
                                key={page}
                                className={`px-3 py-1 mx-1 rounded ${
                                    currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                }`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quản lý Thử Thách */}
            {activeTab === 'challenges' && (
                <div>
                    <h2 className="text-2xl font-semibold">Quản lý thử thách</h2>
                    {editChallenge ? (
                        <div className="mt-6 p-6 bg-white rounded-lg shadow">
                            <h2 className="text-2xl font-semibold">Chỉnh sửa thử thách</h2>
                            <div className="mt-4 space-y-4">
                                <input
                                    type="text"
                                    value={editChallenge.nameChallenge}
                                    onChange={(e) =>
                                        setEditChallenge({ ...editChallenge, nameChallenge: e.target.value })
                                    }
                                    className="w-full p-2 border rounded"
                                    placeholder="Tên thử thách"
                                />
                                <textarea
                                    value={editChallenge.describe}
                                    onChange={(e) => setEditChallenge({ ...editChallenge, describe: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="Mô tả thử thách"
                                ></textarea>
                                <select
                                    value={editChallenge.field}
                                    onChange={(e) => setEditChallenge({ ...editChallenge, field: e.target.value })}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="Thể thao">Thể thao</option>
                                    <option value="Đời sống">Đời sống</option>
                                    <option value="Học tập">Học tập</option>
                                    <option value="Nấu ăn">Nấu ăn</option>
                                    <option value="Sáng tạo">Sáng tạo</option>
                                    <option value="Nghệ thuật">Nghệ thuật</option>
                                </select>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        setEditChallenge({ ...editChallenge, newImage: e.target.files[0] });
                                        setPreviewImage(URL.createObjectURL(e.target.files[0]));
                                    }}
                                    className="w-full p-2"
                                />
                                {previewImage && (
                                    <img src={previewImage} alt="Preview" className="w-48 h-32 mt-2 rounded" />
                                )}
                                <button
                                    className="bg-green-500 text-white px-4 py-2 rounded"
                                    onClick={handleSaveEditChallenge}
                                >
                                    Lưu
                                </button>
                                <button
                                    className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
                                    onClick={() => setEditChallenge(null)}
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between mt-6">
                                <label className="text-xl leading-[35px] w-[130px]">Tìm kiếm thử thách: </label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Tìm kiếm thử thách"
                                    value={searchChallenge}
                                    onChange={(e) => {
                                        setSearchChallenge(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full p-2 border rounded mb-4 "
                                />
                                {!!searchChallenge && !loading && (
                                    <button onClick={handleClear}>
                                        <FontAwesomeIcon className={cx('clear')} icon={faCircleXmark} />
                                    </button>
                                )}
                            </div>
                            <ul lassName="space-y-4 mt-2">
                                {getPaginatedData(challenges).map((challenge) => (
                                    <li key={challenge.$id} className="flex relative bg-gray-100 p-4 rounded-lg shadow">
                                        <img
                                            src={challenge.imgChallenge || 'https://via.placeholder.com/100'}
                                            alt="Thử thách"
                                            className="mr-5 w-[200px] h-[95px] object-cover rounded"
                                        />
                                        <div>
                                            <p className="font-bold">
                                                <span className="font-semibold">Tên thử thách:</span>{' '}
                                                {challenge.nameChallenge}
                                            </p>
                                            <p className="text-xl">
                                                <span className="font-semibold">Mô tả:</span> {challenge.describe}
                                            </p>
                                            <p className="text-xl">
                                                <span className="font-semibold">Lĩnh vực:</span> {challenge.field}
                                            </p>
                                            <p className="text-xl">
                                                <span className="font-semibold">Số người tham gia:</span>{' '}
                                                {challenge.participants}
                                            </p>
                                            <p className="text-xl">
                                                <span className="font-semibold">Tác giả:</span> {challenge.createdBy}
                                            </p>
                                        </div>
                                        <div className="absolute top-16 right-3">
                                            <Link to={`/challenge/${challenge.$id}`}>
                                                <button className="bg-blue-500 text-white mr-2 px-4 py-2 rounded">
                                                    Xem
                                                </button>
                                            </Link>
                                            <button
                                                className="bg-yellow-500 text-white mr-2 px-4 py-2 rounded"
                                                onClick={() => handleEditChallenge(challenge)}
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                className="bg-red-500 text-white px-4 py-2 rounded"
                                                onClick={() => handleDeleteChallenge(challenge)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex justify-center mt-4">
                                {getPaginationButtons(challenges.length).map((page) => (
                                    <button
                                        key={page}
                                        className={`px-3 py-1 mx-1 rounded ${
                                            currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                        }`}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quản lý Video */}
            {activeTab === 'videos' && (
                <div>
                    <h2 className="text-2xl font-semibold">Quản lý video</h2>
                    <div className="flex justify-between mt-6">
                        <label className="text-xl leading-[35px] w-[100px]">Tìm kiếm video: </label>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Tìm kiếm video"
                            value={searchVideo}
                            onChange={(e) => {
                                setSearchVideo(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full p-2 border rounded mb-4 "
                        />
                        {!!searchVideo && !loading && (
                            <button onClick={handleClear}>
                                <FontAwesomeIcon className={cx('clear')} icon={faCircleXmark} />
                            </button>
                        )}
                    </div>
                    <ul className="space-y-4 mt-2">
                        {getPaginatedData(videos).map((video) => (
                            <li key={video.$id} className="flex relative bg-gray-100 p-4 rounded-lg shadow">
                                <div>
                                    <div>
                                        <p className="font-bold">
                                            <span className="text-xl font-semibold">Tên thử thách:</span>{' '}
                                            {video.challengeName}
                                        </p>
                                        <p className="font-bold">
                                            <span className="text-xl font-semibold">Lĩnh vực:</span>{' '}
                                            {video.challengeField}
                                        </p>
                                    </div>
                                    <div className="flex">
                                        <video
                                            src={video.videoURL}
                                            controls
                                            className="w-[250px] h-[150px] mr-3 mt-2"
                                        ></video>
                                        <div className="mt-2">
                                            <p className="font-bold">
                                                <span className="font-semibold">Người đăng:</span> {video.userName}
                                            </p>
                                            <p className="text-xl">
                                                <span className="font-semibold">Mô tả:</span> {video.describe}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="absolute top-12 right-3 bg-red-500 text-white px-4 py-2 rounded"
                                    onClick={() => handleDeleteVideo(video)}
                                >
                                    Xóa
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-center mt-4">
                        {getPaginationButtons(videos.length).map((page) => (
                            <button
                                key={page}
                                className={`px-3 py-1 mx-1 rounded ${
                                    currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200'
                                }`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;
