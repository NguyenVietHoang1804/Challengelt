import React, { useEffect, useState, useContext, useCallback } from 'react';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParams, useNavigate } from 'react-router-dom';
import { databases, storage, ID, Query } from '~/appwrite/config';
import { UserContext } from '~/contexts/UserContext';

function JoinChallenge() {
    const { id } = useParams();
    const { userId, displayName } = useContext(UserContext);
    const navigate = useNavigate();

    const [challenge, setChallenge] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [describe, setDescribe] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [inputKey, setInputKey] = useState(Date.now());

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch challenge và check joined cùng lúc
                const [challengeResponse, joinedResponse] = await Promise.all([
                    databases.getDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', id),
                    userId
                        ? databases.listDocuments('678a0e0000363ac81b93', '679c498f001b467ed632', [
                              Query.equal('challengeId', id),
                              Query.equal('idUserJoined', userId),
                          ])
                        : Promise.resolve({ documents: [] }),
                ]);

                setChallenge(challengeResponse);
                setHasJoined(joinedResponse.documents.length > 0);
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu:', error);
                alert('Không thể tải thông tin thử thách. Vui lòng thử lại sau.');
            }
        };

        fetchData();
    }, [id, userId]);

    const handleDelete = useCallback(() => {
        setVideoFile(null);
        setVideoPreview(null);
        setDescribe('');
        setInputKey(Date.now());
    }, []);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    }, []);

    const addPoints = useCallback(async (targetUserId) => {
        try {
            const userData = await databases.getDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', targetUserId);
            const newPoints = (userData.points || 0) + 5;
            await databases.updateDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', targetUserId, {
                points: newPoints,
            });
        } catch (error) {
            throw new Error(`Không thể cộng điểm cho người dùng ${targetUserId}: ${error.message}`);
        }
    }, []);

    const handlePost = useCallback(async () => {
        if (!userId || !displayName) {
            alert('Bạn cần đăng nhập để tham gia thử thách.');
            return;
        }
        if (hasJoined) {
            alert('Bạn đã tham gia thử thách này rồi!');
            return;
        }
        if (!videoFile) {
            alert('Vui lòng chọn video để tải lên!');
            return;
        }
        if (!describe.trim()) {
            alert('Vui lòng nhập mô tả video!');
            return;
        }
        if (!window.confirm('Bạn có chắc chắn muốn tham gia thử thách này?')) {
            return;
        }

        setLoading(true);

        try {
            // Tải video lên Storage
            const uploadResponse = await storage.createFile('678a12cf00133f89ab15', ID.unique(), videoFile);
            const videoURL = storage.getFileView('678a12cf00133f89ab15', uploadResponse.$id);
            const fileId = uploadResponse.$id;

            // Lưu thông tin tham gia
            await databases.createDocument('678a0e0000363ac81b93', '679c498f001b467ed632', ID.unique(), {
                idUserJoined: userId,
                challengeId: id,
                userName: displayName,
                describe,
                videoURL,
                fileId,
            });

            // Cập nhật số người tham gia
            const updatedParticipants = (challenge.participants || 0) + 1;
            const challengeData = await databases.updateDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', id, {
                participants: updatedParticipants,
            });

            // Cộng điểm cho người tham gia và chủ thử thách
            await Promise.all([
                addPoints(userId),
                challengeData.idUserCreated && addPoints(challengeData.idUserCreated),
            ]);

            // Gửi thông báo cho chủ thử thách
            if (challengeData.idUserCreated) {
                await databases.createDocument('678a0e0000363ac81b93', 'notifications', ID.unique(), {
                    userId: challengeData.idUserCreated,
                    message: `${displayName} đã tham gia thử thách của bạn: ${challengeData.nameChallenge}. Bạn được cộng 5 điểm!`,
                    challengeId: id,
                    createdAt: new Date().toISOString(),
                });
            }

            alert('Tham gia thử thách thành công!');
            setHasJoined(true);
            navigate(`/challenge/${id}`);
        } catch (error) {
            console.error('Lỗi khi tham gia thử thách:', error);
            alert(`Tham gia thử thách thất bại: ${error.message}. Vui lòng thử lại.`);
        } finally {
            setLoading(false);
        }
    }, [userId, displayName, videoFile, describe, challenge, navigate, id, hasJoined, addPoints]);

    if (!challenge) {
        return <p className="text-center">Đang tải thông tin thử thách...</p>;
    }

    const isFormDisabled = loading || hasJoined;

    return (
        <div className="bg-gray-10 mt-6 mb-32 flex items-center justify-center min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-7xl">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    {`< Quay lại`}
                </button>
                <div>
                    <h1 className="text-6xl font-bold text-center mb-11">{challenge.nameChallenge}</h1>
                    <img
                        src={challenge.imgChallenge || 'https://via.placeholder.com/600x300'}
                        alt={challenge.nameChallenge}
                        className="mt-4 mb-4 object-cover rounded-lg w-[600px] h-[300px]"
                        loading="lazy"
                    />
                </div>

                <h1 className="text-2xl font-semibold mb-4">Tải video</h1>

                {hasJoined ? (
                    <p className="text-red-500 mb-6">Bạn đã tham gia thử thách này rồi!</p>
                ) : (
                    <p className="text-gray-600 mb-6">Tham gia thử thách này với 1 video!</p>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center w-full md:w-1/3">
                        {videoPreview ? (
                            <video src={videoPreview} controls className="w-full rounded-lg" />
                        ) : (
                            <>
                                <FontAwesomeIcon className="text-4xl text-gray-400 mb-4" icon={faCloudArrowUp} />
                                <p className="text-gray-600 mb-2">Chọn video để tham gia</p>
                                <p className="text-gray-400 mb-2">MP4</p>
                                <p className="text-gray-400 mb-2">Video lên đến 30 phút!</p>
                                <p className="text-gray-400 mb-4">Dung lượng nhỏ hơn 50MB</p>
                            </>
                        )}
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="video-upload"
                            key={inputKey}
                            disabled={isFormDisabled}
                        />
                        <label
                            htmlFor="video-upload"
                            className={`bg-pink-500 text-white mt-3 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                                isFormDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-600'
                            }`}
                        >
                            Chọn tệp
                        </label>
                    </div>
                    <div className="flex-1">
                        <div className="mb-4">
                            <label htmlFor="caption" className="block text-gray-600 mb-2">
                                Mô tả video
                            </label>
                            <textarea
                                id="caption"
                                value={describe}
                                onChange={(e) => setDescribe(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 disabled:bg-gray-100"
                                maxLength="200"
                                placeholder="Nhập mô tả video..."
                                disabled={isFormDisabled}
                            />
                            <p className="text-gray-400 text-sm text-right mt-1">{describe.length}/200</p>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleDelete}
                                className={`bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg transition-colors ${
                                    isFormDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                                }`}
                                disabled={isFormDisabled}
                            >
                                Xóa
                            </button>
                            <button
                                onClick={handlePost}
                                className={`bg-pink-500 text-white px-4 py-2 rounded-lg transition-colors ${
                                    isFormDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-pink-600'
                                }`}
                                disabled={isFormDisabled}
                            >
                                {loading ? 'Đang tải...' : 'Tải'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JoinChallenge;
