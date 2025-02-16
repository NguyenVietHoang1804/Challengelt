import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { databases, Query } from '~/appwrite/config'; // Import Query từ Appwrite SDK
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function Home() {
    const [challenges, setChallenges] = useState([]); // Danh sách thử thách hiện tại
    const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
    const [totalPages, setTotalPages] = useState(1); // Tổng số trang
    const limit = 6; // Số thử thách mỗi trang

    const [loading, setLoading] = useState(true);

    const fetchChallenges = useCallback(async (page) => {
        setLoading(true);
        try {
            const offset = (page - 1) * limit; // Tính offset dựa vào trang hiện tại

            // Sử dụng `queries` để phân trang
            const response = await databases.listDocuments(
                '678a0e0000363ac81b93', // ID database
                '678a0fc8000ab9bb90be', // ID collection
                [Query.limit(limit), Query.offset(offset)], // Giới hạn và phân trang
            );

            setChallenges(response.documents); // Dữ liệu của trang hiện tại
            setTotalPages(Math.ceil(response.total / limit)); // Tổng số trang
        } catch (error) {
            console.error('Error fetching challenges:', error);
        } finally {
            setLoading(false); // Kết thúc tải dữ liệu
        }
    }, []);

    // Gọi API mỗi khi trang thay đổi
    useEffect(() => {
        fetchChallenges(currentPage);
    }, [currentPage, fetchChallenges]);

    // Chuyển trang
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page); // Cập nhật trang hiện tại
        }
    };

    return (
        <div className="container mx-auto mb-32">
            {/* Hiển thị thử thách */}
            <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading
                    ? Array.from({ length: limit }).map((_, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg shadow">
                              <Skeleton className="rounded-lg mb-4 object-cover" width={300} height={200}></Skeleton>
                              <Skeleton variant="text"></Skeleton>
                              <Skeleton variant="text"></Skeleton>
                              <Skeleton variant="text"></Skeleton>
                              <Skeleton variant="text"></Skeleton>
                          </div>
                      ))
                    : challenges.map((challenge) => (
                          <Link
                              to={`/challenge/${challenge.$id}`} // ID tài liệu Appwrite
                              key={challenge.$id}
                              className="bg-white p-4 rounded-lg shadow transition-transform transform hover:scale-105"
                          >
                              <img
                                  className="rounded-lg mb-4 w-[300px] h-[200px] object-cover"
                                  src={challenge.imgChallenge || 'https://via.placeholder.com/300x200'}
                                  alt={challenge.nameChallenge || `Thử thách ${challenge.$id}`}
                                  loading="lazy"
                              />

                              <h3 className="text-4xl font-bold mb-3">
                                  {challenge.nameChallenge || `Thử thách ${challenge.$id}`}
                              </h3>
                              <p className="text-2xl text-gray-500">Lĩnh vực: {challenge.field || 'Chưa xác định'}</p>
                              <p className="text-2xl text-gray-500">Số người tham gia: {challenge.participants || 0}</p>
                              <p className="text-2xl text-gray-500">
                                  Tác giả: {challenge.createdBy || 'Không xác định'}
                              </p>
                          </Link>
                      ))}
            </section>

            {/* Thanh phân trang */}
            <div className="flex justify-center mt-6">
                <button
                    className="bg-gray-300 px-3 py-1 rounded-l hover:bg-gray-400"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    Trước
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                        key={page}
                        className={`px-3 py-1 ${
                            page === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        onClick={() => handlePageChange(page)}
                    >
                        {page}
                    </button>
                ))}
                <button
                    className="bg-gray-300 px-3 py-1 rounded-r hover:bg-gray-400"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    Sau
                </button>
            </div>
        </div>
    );
}

export default React.memo(Home);
