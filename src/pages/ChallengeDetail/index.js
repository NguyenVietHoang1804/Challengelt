'use client';
import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { databases, Query, storage, ID } from '~/appwrite/config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { UserContext } from '~/contexts/UserContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function ChallengeDetail() {
    const { id } = useParams();
    const { userId } = useContext(UserContext);
    const [challenge, setChallenge] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [hasJoined, setHasJoined] = useState(false);
    const [visibleParticipants, setVisibleParticipants] = useState(3);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChallenge = async () => {
            setLoading(true);
            try {
                const response = await databases.getDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', id);
                setChallenge(response);
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };
        const fetchParticipants = async () => {
            try {
                const response = await databases.listDocuments('678a0e0000363ac81b93', '679c498f001b467ed632', [
                    Query.equal('challengeId', id),
                ]);
                setParticipants(response.documents);
                const userJoined = response.documents.some((participant) => participant.idUserJoined === userId);
                setHasJoined(userJoined);
            } catch (error) {}
        };

        fetchChallenge();
        fetchParticipants();
    }, [id, userId]);

    const handleShowMoreParticipants = () => {
        setVisibleParticipants((prev) => prev + 3);
    };

    const handleShowLessParticipants = () => {
        setVisibleParticipants(3);
    };

    const handleLeaveChallenge = useCallback(async () => {
        if (!window.confirm('Bạn có chắc chắn muốn rời khỏi thử thách này?')) return;
        setLoading(true);

        try {
            // 🔹 1. Lấy thông tin của người tham gia
            const participant = participants.find((p) => p.idUserJoined === userId);
            if (!participant) {
                alert('Bạn chưa tham gia thử thách này!');
                return;
            }

            // 🔹 2. Xóa video trong Storage nếu có
            if (participant.fileId) {
                await storage.deleteFile('678a12cf00133f89ab15', participant.fileId);
            }

            // 🔹 3. Xóa dữ liệu tham gia trong "joinedChallenges"
            await databases.deleteDocument('678a0e0000363ac81b93', '679c498f001b467ed632', participant.$id);

            // 🔹 4. Lấy thông tin thử thách để trừ điểm
            const challengeData = await databases.getDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', id);
            if (!challengeData) {
                console.error('Thử thách không tồn tại!');
                return;
            }

            const updatedParticipants = Math.max((challengeData.participants || 1) - 1, 0);
            await databases.updateDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', id, {
                participants: updatedParticipants,
            });

            // 🔹 5. Lấy thông tin điểm của người tham gia và chủ thử thách
            const userDoc = await databases.getDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', userId);
            const ownerDoc = await databases.getDocument(
                '678a0e0000363ac81b93',
                '678a207f00308710b3b2',
                challengeData.idUserCreated,
            );

            const userPoints = userDoc?.points || 0;
            const ownerPoints = ownerDoc?.points || 0;

            // 🔹 6. Trừ điểm của người tham gia và chủ thử thách (tối thiểu là 0 điểm)
            await databases.updateDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', userId, {
                points: Math.max(userPoints - 5, 0),
            });

            await databases.updateDocument(
                '678a0e0000363ac81b93',
                '678a207f00308710b3b2',
                challengeData.idUserCreated,
                {
                    points: Math.max(ownerPoints - 5, 0),
                },
            );

            // 🔹 7. Gửi thông báo đến chủ thử thách
            await databases.createDocument('678a0e0000363ac81b93', 'notifications', ID.unique(), {
                userId: challengeData.idUserCreated,
                message: `${userDoc.displayName} đã rời khỏi thử thách của bạn: ${challengeData.nameChallenge}. Bạn bị trừ 5 điểm!`,
                challengeId: id,
                createdAt: new Date().toISOString(),
            });

            alert('Bạn đã rời khỏi thử thách.');
            setHasJoined(false);
            setParticipants((prev) => prev.filter((p) => p.$id !== participant.$id));
            setChallenge((prev) => ({ ...prev, participants: updatedParticipants }));
        } catch (error) {
            alert('Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [participants, userId, id]);

    const participantList = useMemo(
        () => participants.slice(0, visibleParticipants),
        [participants, visibleParticipants],
    );

    if (loading) {
        return (
            <div className="container mx-auto p-6 bg-white rounded-lg shadow mt-8 mb-32">
                <div>
                    <Skeleton width={400} height={38} className="ml-[420px] mb-[28px] mt-[58px]"></Skeleton>
                    <Skeleton width={600} height={300} className="mt-4 rounded-lg"></Skeleton>
                </div>
                <div className="mt-11 mb-11">
                    <Skeleton width={236} height={25}></Skeleton>
                    <Skeleton width={180} height={15}></Skeleton>
                    <Skeleton width={300} height={15}></Skeleton>
                    <Skeleton width={200} height={15}></Skeleton>
                    <Skeleton width={150} height={15}></Skeleton>
                </div>
            </div>
        );
    }
    return (
        <div className="container mx-auto p-6 bg-white rounded-lg shadow mt-8 mb-32">
            {/* Thông tin chi tiết thử thách */}
            <div className="flex justify-end">
                <Link to="/">
                    <FontAwesomeIcon icon={faXmark} className="text-5xl bg-slate-100 rounded-full p-2" />
                </Link>
            </div>
            <div>
                <div>
                    <h1 className="text-6xl font-bold text-center mb-11">
                        {challenge.nameChallenge || `Thử thách ${id}`}
                    </h1>
                    <img
                        src={challenge.imgChallenge || 'https://via.placeholder.com/600x300'}
                        alt={challenge.nameChallenge || `Thử thách ${id}`}
                        className="mt-4 object-cover rounded-lg w-[600px] h-[300px]"
                        loading="lazy"
                    />
                </div>
                <div className="mt-11 mb-11">
                    <h2 className="text-4xl font-semibold">Mô tả chi tiết thử thách</h2>
                    <p className="mt-2 text-gray-600">
                        <span className="text-gray-900">Lĩnh vực:</span> {challenge.field || 'Chưa xác định'}
                    </p>
                    <p className="mt-2 text-gray-600">
                        <span className="text-gray-900">Mô tả:</span> {challenge.describe || 'Không có mô tả.'}
                    </p>
                    <p className="mt-2 text-gray-600">
                        <span className="text-gray-900">Số người tham gia thử thách:</span> {challenge.participants}
                    </p>
                    <p className="mt-2 text-gray-600">
                        <span className="text-gray-900">Tác giả:</span> {challenge.createdBy || 'Chưa xác định'}
                    </p>
                    {hasJoined ? (
                        <button
                            onClick={handleLeaveChallenge}
                            className={`mt-4 bg-red-500 text-white font-semibold py-2 px-4 rounded ${
                                loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={loading}
                        >
                            {loading ? 'Đang rời khỏi thử thách...' : 'Rời khỏi thử thách'}
                        </button>
                    ) : (
                        <Link to={`/joinChallenge/${id}`}>
                            <button className="mt-4 bg-blue-500 text-white font-semibold py-2 px-4 rounded">
                                Tham gia ngay
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Danh sách người tham gia */}
            <section className="mt-8">
                <h2 className="text-xl font-bold mb-4">Danh sách người tham gia</h2>
                <div className="grid grid-cols-3 gap-4">
                    {participantList.length > 0 ? (
                        participantList.map((participant) => (
                            <div key={participant.$id} className="flex flex-col bg-gray-100 p-4 rounded-lg shadow">
                                <p className="font-bold">{participant.userName}</p>
                                <p className="text-gray-600">Mô tả: {participant.describe}</p>
                                <video
                                    src={participant.videoURL}
                                    loading="lazy"
                                    controls
                                    className="w-full mt-2 rounded-lg"
                                ></video>
                            </div>
                        ))
                    ) : (
                        <p>Chưa có ai tham gia thử thách này.</p>
                    )}
                </div>
                {visibleParticipants < participants.length ? (
                    <button
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={handleShowMoreParticipants}
                    >
                        Xem thêm
                    </button>
                ) : (
                    visibleParticipants > 6 && (
                        <button
                            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
                            onClick={handleShowLessParticipants}
                        >
                            Ẩn bớt
                        </button>
                    )
                )}
            </section>
        </div>
    );
}

export default ChallengeDetail;
