'use client';
import React, { useContext, useEffect, useState } from 'react';
import { databases, storage, account, Query,ID } from '~/appwrite/config';
import { UserContext } from '~/contexts/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // optional

const Profile = () => {
    const { userId, setUserId,displayName } = useContext(UserContext);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [createdChallenges, setCreatedChallenges] = useState([]);
    const [joinedChallenges, setJoinedChallenges] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        imgUserFile: null,
        newPassword: '',
        confirmPassword: '',
    });
    const [imgUserPreview, setimgUserPreview] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const [isSavingChallenge, setIsSavingChallenge] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState(null);
    const [challengeForm, setChallengeForm] = useState({
        nameChallenge: '',
        field: '',
        describe: '',
        imgChallenge: null,
    });
    const fields = ['Thể thao', 'Đời sống', 'Học tập', 'Nấu ăn', 'Sáng tạo', 'Nghệ thuật', 'Kinh doanh','Khoa học','Văn hóa'];

    const [visibleCreatedChallenges, setVisibleCreatedChallenges] = useState(5);
    const [visibleJoinedChallenges, setVisibleJoinedChallenges] = useState(3);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) return;

            try {
                const userDocument = await databases.getDocument(
                    '678a0e0000363ac81b93', // Database ID
                    '678a207f00308710b3b2', // Collection ID
                    userId,
                );
                setUserData(userDocument);
                const userImage =
                    userDocument.imgUser ||
                    'https://cloud.appwrite.io/v1/storage/buckets/678a12cf00133f89ab15/files/679f7b6c00277c0c36bd/view?project=678a0a09003d4f41cb57&mode=admin';
                setimgUserPreview(userImage);

                setFormData((prev) => ({
                    ...prev,
                    displayName: userDocument.displayName || '',
                }));
                const challengesQuery = await databases.listDocuments(
                    '678a0e0000363ac81b93', // Database ID
                    '678a0fc8000ab9bb90be', // Collection "challenges"
                    [Query.equal('idUserCreated', userId)], // Lọc theo userId
                );

                setCreatedChallenges(challengesQuery.documents);
                const joinedChallengesQuery = await databases.listDocuments(
                    '678a0e0000363ac81b93',
                    '679c498f001b467ed632', // Collection "joinedChallenges"
                    [Query.equal('idUserJoined', userId)],
                );

                // 🔹 Lấy thông tin thử thách từ collection "challenges" dựa trên challengeId
                const joinedChallengesData = await Promise.all(
                    joinedChallengesQuery.documents.map(async (entry) => {
                        try {
                            const challengeData = await databases.getDocument(
                                '678a0e0000363ac81b93',
                                '678a0fc8000ab9bb90be',
                                entry.challengeId,
                            );
                            return {
                                ...challengeData,
                                userVideo: entry.videoURL, // Gắn video của user vào thử thách
                                userDescribe: entry.describe, // Gắn mô tả của user vào thử thách
                                fileId: entry.fileId,
                            };
                        } catch (error) {
                            console.error('Lỗi khi lấy thông tin thử thách đã tham gia:', error);
                            return null;
                        }
                    }),
                );

                // 🔹 Loại bỏ các thử thách bị lỗi
                setJoinedChallenges(joinedChallengesData.filter(Boolean));
            } catch (error) {
                console.error('Lỗi khi lấy thông tin người dùng:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    const handleShowMoreCreatedChallenges = () => {
        setVisibleCreatedChallenges((prev) => prev + 5);
    };

    const handleShowMoreJoinedChallenges = () => {
        setVisibleJoinedChallenges((prev) => prev + 3);
    };

    const handleEditChallenge = (challenge) => {
        setEditingChallenge((prev) => (prev && prev.$id === challenge.$id ? null : challenge));
        setChallengeForm({
            nameChallenge: challenge.nameChallenge,
            field: challenge.field,
            describe: challenge.describe,
            imgChallenge: challenge.imgChallenge,
        });
    };

    const handleChallengeInputChange = (e) => {
        const { name, value } = e.target;
        setChallengeForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleChallengeImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setChallengeForm((prev) => ({ ...prev, imgChallenge: file }));
        }
    };

    const handleSaveChallengeChanges = async () => {
        if (!editingChallenge) return;
        setIsSavingChallenge(true);
        try {
            let imgChallengeUrl = editingChallenge.imgChallenge;
            if (challengeForm.imgChallenge instanceof File) {
                const fileResponse = await storage.createFile(
                    '678a12cf00133f89ab15',
                    'unique()',
                    challengeForm.imgChallenge,
                );
                imgChallengeUrl = storage.getFileView('678a12cf00133f89ab15', fileResponse.$id);
            }
            const updatedChallenge = await databases.updateDocument(
                '678a0e0000363ac81b93',
                '678a0fc8000ab9bb90be',
                editingChallenge.$id,
                {
                    nameChallenge: challengeForm.nameChallenge,
                    field: challengeForm.field,
                    describe: challengeForm.describe,
                    imgChallenge: imgChallengeUrl,
                },
            );
            setCreatedChallenges((prev) => prev.map((c) => (c.$id === updatedChallenge.$id ? updatedChallenge : c)));
            setEditingChallenge(null);
            alert('Cập nhật thử thách thành công!');
        } catch (error) {
            console.error('Lỗi khi cập nhật thử thách:', error);
            alert('Cập nhật thử thách thất bại!');
        } finally {
            setIsSavingChallenge(false); // Tắt loading sau khi lưu xong
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDeleteChallenge = async (challengeId) => {
        if (!challengeId) {
            alert('Không tìm thấy thử thách để xóa.');
            return;
        }
        const confirmDelete = window.confirm(
            'Bạn có chắc chắn muốn xóa thử thách này không? Hành động này không thể hoàn tác!',
        );
        if (!confirmDelete) return;

        try {
            await databases.deleteDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', challengeId);

            // Cập nhật UI: Xóa thử thách khỏi danh sách hiển thị
            setCreatedChallenges((prevChallenges) =>
                prevChallenges.filter((challenge) => challenge.$id !== challengeId),
            );

            alert('Xóa thử thách thành công!');
        } catch (error) {
            console.error('Lỗi khi xóa thử thách:', error.message);
            alert('Không thể xóa thử thách, vui lòng thử lại.');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, imgUserFile: file }));
            setimgUserPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveChanges = async () => {
        setErrorMessage('');
        const confirmSave = window.confirm('Bạn có chắc chắn muốn lưu những thay đổi này không?');
        if (!confirmSave) return;

        // Kiểm tra mật khẩu mới
        if (isChangingPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                setErrorMessage('Mật khẩu mới và xác nhận không khớp.');
                return;
            }
            if (formData.newPassword === '') {
                setErrorMessage('Mật khẩu mới không được để trống.');
                return;
            }
        }

        try {
            // Kiểm tra session
            const accountInfo = await account.get(); // Lấy thông tin tài khoản

            if (!accountInfo) {
                setErrorMessage('Bạn cần đăng nhập để thực hiện thao tác này.');
                return;
            }

            let imgUserUrl = userData.imgUser;

            // Tải ảnh mới nếu có
            if (formData.imgUserFile) {
                const fileResponse = await storage.createFile('678a12cf00133f89ab15', 'unique()', formData.imgUserFile);
                imgUserUrl = storage.getFileView('678a12cf00133f89ab15', fileResponse.$id);
            }

            await account.updateName(formData.displayName);

            // Cập nhật mật khẩu
            if (isChangingPassword && formData.newPassword) {
                await account.updatePassword(formData.newPassword, formData.currentPassword);
            }

            // Cập nhật thông tin khác
            const updatedUser = await databases.updateDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', userId, {
                displayName: formData.displayName,
                imgUser: imgUserUrl,
            });

            alert('Cập nhật thông tin thành công!');
            setUserData(updatedUser);
            setIsEditing(false);
            setIsChangingPassword(false);
        } catch (error) {
            console.error('Lỗi khi cập nhật thông tin:', error.message);
            setErrorMessage('Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại.');
        }
    };

    const handleLeaveChallenge = async (challenge) => {
        const confirmLeave = window.confirm(
            `Bạn có chắc chắn muốn rời khỏi thử thách "${challenge.nameChallenge}" không?`,
        );
        if (!confirmLeave) return;

        try {
            // 🔹 1. Xóa video khỏi Storage
            if (challenge.fileId) {
                await storage.deleteFile('678a12cf00133f89ab15', challenge.fileId);
            } else {
                console.warn('Không tìm thấy fileId, bỏ qua xóa video');
            }

            const challengeData = await databases.getDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', challenge.$id);
        const ownerId = challengeData.idUserCreated; // Chủ thử thách

            // 🔹 2. Xóa dữ liệu khỏi collection "joinedChallenges"
            const joinedChallengesQuery = await databases.listDocuments(
                '678a0e0000363ac81b93',
                '679c498f001b467ed632',
                [Query.equal('idUserJoined', userId), Query.equal('challengeId', challenge.$id)],
            );

            if (joinedChallengesQuery.documents.length > 0) {
                const joinedChallengeId = joinedChallengesQuery.documents[0].$id;
                await databases.deleteDocument('678a0e0000363ac81b93', '679c498f001b467ed632', joinedChallengeId);
            }

            // 🔹 3. Giảm số lượng người tham gia (participants)
            const updatedParticipants = Math.max(challenge.participants - 1, 0);
            await databases.updateDocument('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', challenge.$id, {
                participants: updatedParticipants,
            });

        

            const updatePoints = async (userId) => {
                const userData = await databases.getDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', userId);
                const newPoints = Math.max((userData.points || 0) - 5, 0); // Trừ 5 điểm, không xuống dưới 0
                await databases.updateDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', userId, {
                    points: newPoints,
                });
            };
    
            await updatePoints(userId); // Trừ điểm của người rời thử thách
            if (ownerId) {
                await updatePoints(ownerId); // Trừ điểm của chủ thử thách
            }
    
            // 🔹 6. Gửi thông báo đến chủ thử thách
            await databases.createDocument('678a0e0000363ac81b93', 'notifications', ID.unique(), {
                userId: ownerId,
                message: `${displayName} đã rời khỏi thử thách của bạn: ${challengeData.nameChallenge}. Bạn bị trừ 5 điểm!`,
                challengeId: challenge.$id,
                createdAt: new Date().toISOString(),
            });

            // 🔹 4. Cập nhật UI: Loại bỏ thử thách khỏi danh sách
            setJoinedChallenges((prev) => prev.filter((c) => c.$id !== challenge.$id));

            alert('Bạn đã rời khỏi thử thách thành công!');
        } catch (error) {
            console.error('Lỗi khi rời khỏi thử thách:', error);
            alert('Không thể rời khỏi thử thách, vui lòng thử lại.');
        }
    };

    const handleLogout = async () => {
        const confirmLogout = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
        if (!confirmLogout) return;
        try {
            await account.deleteSession('current');
            setUserId(null);
            alert('Đăng xuất thành công!');
            navigate('/');
            window.location.reload();
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error.message);
            alert('Đăng xuất thất bại, vui lòng thử lại.');
        }
    };

    if (loading) return <p>Đang tải thông tin...</p>;
    if (!userData) return <p>Không tìm thấy thông tin người dùng!</p>;

    return (
        <div className="relative container mx-auto mt-8 mb-[90px] p-6 bg-white rounded-lg shadow">
            <div className="mt-6 flex justify-end absolute gap-2 top-14 right-3">
                <button
                    className="bg-blue-500 text-white font-semibold py-2 px-4 rounded"
                    onClick={() => setIsEditing(true)}
                >
                    Sửa hồ sơ
                </button>
                <Tippy content="Đăng xuất">
                    <button className="bg-red-500 text-white font-semibold py-2 px-4 rounded" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faRightFromBracket}></FontAwesomeIcon>
                    </button>
                </Tippy>
            </div>
            <div className="flex items-center">
                <img src={imgUserPreview} alt="imgUser" width={100} height={100} className="rounded-full" />
                <h1 className="text-5xl font-bold ml-4">{userData.displayName}</h1>
            </div>

            {isEditing ? (
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold">Chỉnh sửa thông tin</h2>
                    <div className="mt-4 space-y-4">
                        <div className="flex">
                            <label className="text-xl w-[80px] leading-[40px]">Tên hiển thị:</label>
                            <input
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleInputChange}
                                placeholder="Tên hiển thị"
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div className="flex">
                            <label className="text-xl w-[80px] leading-[40px]">Ảnh đại diện:</label>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full p-2" />
                        </div>
                        <button
                            className="bg-blue-500 px-4 py-2 text-white mt-4 rounded"
                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                        >
                            {isChangingPassword ? 'Ẩn đổi mật khẩu' : 'Thay đổi mật khẩu'}
                        </button>
                        {isChangingPassword && (
                            <>
                                <div className="flex">
                                    <label className="text-xl w-[160px] leading-[40px]">Mật khẩu hiện tại:</label>
                                    <input
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleInputChange}
                                        placeholder="Mật khẩu hiện tại"
                                        className="w-full p-2 border rounded mt-2"
                                        type="password"
                                    />
                                </div>
                                <div className="flex">
                                    <label className="text-xl w-[160px] leading-[40px]">Mật khẩu mới:</label>
                                    <input
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleInputChange}
                                        placeholder="Mật khẩu mới"
                                        className="w-full p-2 border rounded mt-2"
                                        type="password"
                                    />
                                </div>
                                <div className="flex">
                                    <label className="text-xl w-[160px] leading-[40px]">Xác nhận mật khẩu mới:</label>
                                    <input
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="Xác nhận mật khẩu mới"
                                        className="w-full p-2 border rounded mt-2"
                                        type="password"
                                    />
                                </div>
                            </>
                        )}
                        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
                        <div className="mt-6">
                            <button
                                className="bg-green-500 rounded mr-[10px] px-4 py-2 text-white"
                                onClick={handleSaveChanges}
                            >
                                Lưu
                            </button>
                            <button
                                className="bg-gray-400 rounded px-4 py-2 text-black"
                                onClick={() => setIsEditing(false)}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-10">
                    <h2 className="text-3xl font-semibold">Thông tin cá nhân</h2>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-gray-100 p-4 rounded-lg text-center">
                            <h3 className="font-bold">Thử thách đã tạo:</h3>
                            <p className="text-2xl">{createdChallenges.length || 0}</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg text-center">
                            <h3 className="font-bold">Thử thách đã tham gia:</h3>
                            <p className="text-2xl">{joinedChallenges.length || 0}</p>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg text-center">
                            <h3 className="font-bold">Điểm của bạn:</h3>
                            <p className="text-2xl">{userData.points || 0} điểm</p>
                        </div>
                    </div>

                    <div className="mt-10">
                        <h2 className="text-3xl font-semibold">Danh sách thử thách</h2>

                        {editingChallenge ? (
                            <div className="mt-6">
                                <h2 className="text-2xl font-semibold">Chỉnh sửa thử thách</h2>
                                <div className="mt-4 space-y-4">
                                    <div className="flex">
                                        <label className="w-[135px] leading-[40px]">Tên thử thách:</label>
                                        <input
                                            name="nameChallenge"
                                            value={challengeForm.nameChallenge}
                                            onChange={handleChallengeInputChange}
                                            placeholder="Tên thử thách"
                                            className="w-full p-2 border rounded"
                                            disabled={isSavingChallenge}
                                        />
                                    </div>
                                    <div className="flex">
                                        <label className="w-[135px] leading-[40px]">lĩnh vực:</label>
                                        <select
                                            name="field"
                                            value={challengeForm.field}
                                            onChange={handleChallengeInputChange}
                                            className="w-full p-2 border rounded"
                                            disabled={isSavingChallenge}
                                        >
                                            {fields.map((field) => (
                                                <option key={field} value={field}>
                                                    {field}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex">
                                        <label className="w-[135px] leading-[40px]">Mô tả:</label>
                                        <textarea
                                            name="describe"
                                            value={challengeForm.describe}
                                            onChange={handleChallengeInputChange}
                                            placeholder="Mô tả thử thách"
                                            className="w-full p-2 border rounded"
                                            disabled={isSavingChallenge}
                                        />
                                    </div>
                                    <div className="flex">
                                        <label className="w-[135px] leading-[40px]">Hình ảnh:</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleChallengeImageChange}
                                            className="w-full p-2"
                                            disabled={isSavingChallenge}
                                        />
                                    </div>
                                    {isSavingChallenge && <p className="text-center text-gray-500">Đang lưu...</p>}
                                    <button
                                        className={`bg-green-500 rounded px-4 py-2 text-white mr-2 ${
                                            isSavingChallenge ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        onClick={handleSaveChallengeChanges}
                                        disabled={isSavingChallenge}
                                    >
                                        {isSavingChallenge ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                    <button
                                        className="bg-gray-400 rounded px-4 py-2 text-black "
                                        onClick={() => setEditingChallenge(null)}
                                        disabled={isSavingChallenge}
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl mt-4 font-bold">Thử thách đã tạo:</h3>
                                <ul className="mt-2 space-y-2">
                                    {createdChallenges.length > 0 ? (
                                        createdChallenges.slice(0, visibleCreatedChallenges).map((challenge) => (
                                            <div className="relative" key={challenge.$id}>
                                                <Link
                                                    to={`/challenge/${challenge.$id}`}
                                                    key={challenge.$id}
                                                    className="flex items-center justify-between bg-white p-3 rounded-lg shadow"
                                                >
                                                    <div>
                                                        <p className="font-bold">{challenge.nameChallenge}</p>
                                                        <p className="text-sm text-gray-500">{challenge.field}</p>
                                                        <p className="text-sm text-blue-500">
                                                            {challenge.participants > 0
                                                                ? `${challenge.participants} người tham gia`
                                                                : 'Chưa có người tham gia'}
                                                        </p>
                                                    </div>
                                                </Link>
                                                <button
                                                    className="absolute top-8 right-24 bg-yellow-500 text-white px-3 py-1 rounded"
                                                    onClick={() => handleEditChallenge(challenge)}
                                                >
                                                    {editingChallenge?.$id === challenge.$id ? 'Đóng' : 'Sửa'}
                                                </button>
                                                <button
                                                    className="absolute top-8 right-3 bg-red-500 text-white px-3 py-1 rounded"
                                                    onClick={() => handleDeleteChallenge(challenge.$id)}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p>Không có thử thách nào được tạo.</p>
                                    )}
                                </ul>
                                {visibleCreatedChallenges < createdChallenges.length && (
                                    <button
                                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                                        onClick={handleShowMoreCreatedChallenges}
                                    >
                                        Xem thêm
                                    </button>
                                )}
                            </div>
                        )}

                        <h3 className="text-xl mt-4 font-bold">Thử thách đã tham gia:</h3>
                        <ul className="grid grid-cols-3 gap-4 mt-2 space-y-2">
                            {joinedChallenges.length > 0 ? (
                                joinedChallenges.slice(0, visibleJoinedChallenges).map((challenge) => (
                                    <div key={challenge.$id} className="relative">
                                        <button
                                            className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded"
                                            onClick={() => handleLeaveChallenge(challenge)}
                                        >
                                            Rời khỏi
                                        </button>
                                        <Link
                                            to={`/challenge/${challenge.$id}`}
                                            key={challenge.$id}
                                            className="flex items-center justify-between bg-white p-4 rounded-lg shadow"
                                        >
                                            <div>
                                                <p className="font-bold">{challenge.nameChallenge}</p>
                                                <p className="text-sm text-gray-500">{challenge.field}</p>
                                                <p className="text-sm text-blue-500">
                                                    {challenge.participants} người tham gia
                                                </p>
                                                {/* 🔹 Hiển thị video của người dùng */}
                                                <video
                                                    src={challenge.userVideo}
                                                    controls
                                                    className="min-w-[300px] h-[200px] mt-2 rounded-lg"
                                                ></video>
                                                <p className="text-gray-600 mt-2">Mô tả: {challenge.userDescribe}</p>
                                            </div>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <p>Không có thử thách nào được tham gia.</p>
                            )}
                        </ul>
                        {visibleJoinedChallenges < joinedChallenges.length && (
                            <button
                                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                                onClick={handleShowMoreJoinedChallenges}
                            >
                                Xem thêm
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
