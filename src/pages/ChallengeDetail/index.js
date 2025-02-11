'use client';
import React, { useEffect, useState, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { databases, Query } from '~/appwrite/config'; // Import Appwrite SDK
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { UserContext } from '~/contexts/UserContext';

function ChallengeDetail() {
    const { id } = useParams(); // Lấy id từ URL
    const { userId } = useContext(UserContext);
    const [challenge, setChallenge] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [hasJoined, setHasJoined] = useState(false);
    const [visibleParticipants, setVisibleParticipants] = useState(3);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                // Lấy thông tin thử thách từ Appwrite Database
                const response = await databases.getDocument(
                    '678a0e0000363ac81b93',
                    '678a0fc8000ab9bb90be',
                    id
                );
                setChallenge(response);
            } catch (error) {
                console.error('Thử thách không tồn tại hoặc xảy ra lỗi:', error);
            }
        };

        const fetchParticipants = async () => {
            try {
                // Lấy danh sách người tham gia từ collection "joinedChallenges"
                const response = await databases.listDocuments(
                    '678a0e0000363ac81b93',
                    '679c498f001b467ed632',
                    [Query.equal('challengeId', id)]
                );
                setParticipants(response.documents);
                const userJoined = response.documents.some(participant => participant.idUserJoined === userId);
                setHasJoined(userJoined);
            } catch (error) {
                console.error('Lỗi khi lấy danh sách người tham gia:', error);
            }
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

    if (!challenge) {
        return <p>Đang tải thông tin thử thách...</p>;
    }

    return (
        <div className="container mx-auto p-6 bg-white rounded-lg shadow mt-8 mb-32">
            {/* Thông tin chi tiết thử thách */}
            <div className="flex justify-end">
                <Link to="/">
                    <FontAwesomeIcon
                        icon={faXmark}
                        className="text-5xl bg-slate-100 rounded-full p-2"
                    />
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
                    />
                </div>
                <div className="mt-11 mb-11">
                    <h2 className="text-4xl font-semibold">Mô tả chi tiết thử thách</h2>
                    <p className="mt-2 text-gray-600"><span className='text-gray-900'>Lĩnh vực:</span> {challenge.field || 'Chưa xác định'}</p>
                    <p className="mt-2 text-gray-600"><span className='text-gray-900'>Mô tả:</span> {challenge.describe || 'Không có mô tả.'}</p>
                    <p className="mt-2 text-gray-600"><span className='text-gray-900'>Số người tham gia thử thách:</span> {challenge.participants}</p>
                    <p className="mt-2 text-gray-600"><span className='text-gray-900'>Tác giả:</span> {challenge.createdBy || 'Chưa xác định'}</p>
                    {!hasJoined && (
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
                    {participants.length > 0 ? (
                        participants.slice(0, visibleParticipants).map((participant) => (
                            <div
                                key={participant.$id}
                                className="flex flex-col bg-gray-100 p-4 rounded-lg shadow"
                            >
                                <p className="font-bold">{participant.userName}</p>
                                <p className="text-gray-600">Mô tả: {participant.describe}</p>
                                <video
                                    src={participant.videoURL}
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
                    <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={handleShowMoreParticipants}>
                        Xem thêm
                    </button>
                ) : (
                    visibleParticipants > 6 && (
                        <button className="mt-4 bg-gray-500 text-white px-4 py-2 rounded" onClick={handleShowLessParticipants}>
                            Ẩn bớt
                        </button>
                    )
                )}
            </section>
        </div>
    );
}

export default ChallengeDetail;
