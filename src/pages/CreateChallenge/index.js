'use client';
import React, { useContext, useState, useCallback, useMemo } from 'react';
import { storage, databases, BUCKET_ID, DATABASE_ID, PENDING_CHALLENGES_ID } from '~/appwrite/config';
import { ID } from 'appwrite';
import { UserContext } from '~/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';

function CreateChallenge() {
    const { userId, displayName } = useContext(UserContext);
    const [nameChallenge, setNameChallenge] = useState('');
    const [describe, setDescribe] = useState('');
    const [field, setField] = useState('Thể thao');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState('');
    const navigate = useNavigate();
    const [inputKey, setInputKey] = useState(Date.now());

    const fieldOptions = useMemo(
        () => [
            'Thể thao',
            'Đời sống',
            'Học tập',
            'Nấu ăn',
            'Sáng tạo',
            'Nghệ thuật',
            'Kinh doanh',
            'Khoa học',
            'Văn hóa',
        ],
        [],
    );

    const handleDelete = useCallback(() => {
        setImage(null);
        setImagePreview(null);
        setDescribe('');
        setField('Thể thao');
        setNameChallenge('');
        setInputKey(Date.now());
    }, []);

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            alert('Vui lòng chọn một tệp ảnh hợp lệ!');
        }
    }, []);

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();

            if (!userId) {
                alert('Bạn phải đăng nhập để tạo thử thách!');
                return;
            }

            if (!nameChallenge.trim()) {
                alert('Vui lòng nhập Tiêu đề!');
                return;
            }
            if (!describe.trim()) {
                alert('Vui lòng nhập Mô tả thử thách!');
                return;
            }
            if (!image) {
                alert('Vui lòng chọn Hình ảnh đại diện của thử thách!');
                return;
            }

            setLoading(true);

            try {
                let imageUrl = '';
                let fileImgId = '';
                if (image) {
                    const uploadResponse = await storage.createFile(
                        BUCKET_ID, // Storage Bucket ID
                        ID.unique(),
                        image,
                    );
                    fileImgId = uploadResponse.$id;
                    imageUrl = storage.getFileView(BUCKET_ID, fileImgId);
                }

                // Gửi yêu cầu phê duyệt vào collection "pending_challenges"
                await databases.createDocument(
                    DATABASE_ID, // Database ID
                    PENDING_CHALLENGES_ID, // Thay bằng ID của collection "pending_challenges"
                    ID.unique(),
                    {
                        nameChallenge,
                        describe,
                        field,
                        imgChallenge: imageUrl,
                        fileImgId,
                        createdBy: displayName || 'Người dùng ẩn danh',
                        idUserCreated: userId,
                        status: 'pending',
                    },
                );

                alert('Yêu cầu tạo thử thách đã được gửi đến admin để phê duyệt!');
                resetForm();
                navigate('/');
            } catch (error) {
                console.error('Lỗi khi gửi yêu cầu phê duyệt: ', error);
                alert('Gửi yêu cầu phê duyệt thất bại!');
            } finally {
                setLoading(false);
            }
        },
        [nameChallenge, describe, field, image, navigate, displayName, userId],
    );

    const resetForm = () => {
        setNameChallenge('');
        setDescribe('');
        setField('Thể thao');
        setImage(null);
        setImagePreview('');
    };

    return (
        <div className="container mx-auto p-6 bg-gray-100 rounded-lg shadow-lg mt-8 mb-32">
            <h1 className="text-6xl font-bold text-center mb-11 text-[#f86666]">Tạo thử thách mới</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">Chọn hình ảnh đại diện</label>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center w-full md:w-1/3">
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="mt-4 rounded-lg shadow w-full max-h-64 object-cover border border-gray-300"
                                />
                            ) : (
                                <>
                                    <div className="text-[#f86666] mb-4">
                                        <FontAwesomeIcon className="text-4xl" icon={faCloudArrowUp} />
                                    </div>
                                    <p className="text-gray-600 mb-2">Chọn ảnh đại diện cho thử thách</p>
                                    <p className="text-gray-400 mb-2">PNG, JPG, JPEG</p>
                                    <p className="text-gray-400 mb-4">Dung lượng nhỏ hơn 50MB</p>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                key={inputKey}
                                disabled={loading}
                                onChange={handleImageChange}
                                className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#f86666] hidden"
                                id="imgChallenge"
                            />
                            <label
                                htmlFor="imgChallenge"
                                className={`bg-[#f86666] text-white mt-3 px-4 py-2 rounded-lg cursor-pointer ${
                                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f44d4d]'
                                }`}
                                disabled={loading}
                            >
                                {loading ? 'Chọn ảnh' : 'Chọn ảnh'}
                            </label>
                        </div>
                        <div className="flex-1">
                            <div className="mb-4">
                                <label htmlFor="titleChallenge" className="block text-gray-600 mb-2">
                                    Tiêu đề thử thách
                                </label>
                                <input
                                    id="titleChallenge"
                                    value={nameChallenge}
                                    onChange={(e) => setNameChallenge(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#f86666]"
                                    maxLength="200"
                                    placeholder="Nhập tiêu đề thử thách"
                                    disabled={loading}
                                    required
                                />
                                <p className="text-gray-400 text-sm text-right mt-1">{nameChallenge.length}/200</p>
                                <label htmlFor="caption" className="block text-gray-600 mb-2">
                                    Mô tả thử thách
                                </label>
                                <textarea
                                    id="caption"
                                    value={describe}
                                    onChange={(e) => setDescribe(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#f86666]"
                                    maxLength="1000"
                                    placeholder="Nhập mô tả chi tiết"
                                    required
                                    disabled={loading}
                                />
                                <p className="text-gray-400 text-sm text-right mt-1">{describe.length}/1000</p>
                                <label htmlFor="field" className="block text-gray-600 mb-2">
                                    Lĩnh vực
                                </label>
                                <select
                                    value={field}
                                    id="field"
                                    onChange={(e) => setField(e.target.value || 'Thể thao')}
                                    className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#f86666]"
                                    required
                                    disabled={loading}
                                >
                                    <optgroup label="Chọn lĩnh vực">
                                        {fieldOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={handleDelete}
                                    className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg"
                                    disabled={loading}
                                >
                                    Xóa
                                </button>
                                <button
                                    className={`bg-[#f86666] text-white px-4 py-2 rounded-lg ${
                                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f44d4d]'
                                    }`}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? 'Đang gửi...' : 'Tạo'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default React.memo(CreateChallenge);
