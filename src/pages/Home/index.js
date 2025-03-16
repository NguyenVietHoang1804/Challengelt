import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { databases, Query } from '~/appwrite/config';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag, faPenNib, faUsers } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const [challenges, setChallenges] = useState([]);
    const [currentPage, setCurrentPage] = useState(() => {
        // Lấy giá trị page từ URL khi khởi tạo, mặc định là 1 nếu không có
        const params = new URLSearchParams(location.search);
        const pageFromUrl = parseInt(params.get('page'), 10);
        return pageFromUrl > 0 ? pageFromUrl : 1;
    });
    const [totalPages, setTotalPages] = useState(1);
    const limit = 6;
    const [loading, setLoading] = useState(true);

    const fetchChallenges = useCallback(async (page) => {
        setLoading(true);
        try {
            const offset = (page - 1) * limit;
            const response = await databases.listDocuments('678a0e0000363ac81b93', '678a0fc8000ab9bb90be', [
                Query.limit(limit),
                Query.offset(offset),
            ]);

            // Chỉ cập nhật thử thách khi dữ liệu mới đã được tải về
            setChallenges(response.documents);
            setTotalPages(Math.ceil(response.total / limit));
        } catch (error) {
            console.error('Error fetching challenges:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cập nhật currentPage từ URL khi location.search thay đổi
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const pageFromUrl = parseInt(params.get('page'), 10) || 1;
        if (pageFromUrl !== currentPage) {
            setCurrentPage(pageFromUrl);
        }
    }, [currentPage, location.search]);

    // Gọi fetchChallenges khi currentPage thay đổi
    useEffect(() => {
        fetchChallenges(currentPage);
    }, [currentPage, fetchChallenges]);

    // Chuyển trang và cập nhật URL
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setLoading(true);
            setCurrentPage(page);
            navigate(`/home?page=${page}`);
        }
    };

    return (
        <div className="container mb-32">
            {/* Hiển thị thử thách */}
            <section className={cx('mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6')}>
                {loading
                    ? Array.from({ length: limit }).map((_, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg shadow-lg">
                              <Skeleton className={cx('rounded-lg mb-4 object-cover', 'skeleton-image')} height={200} />
                              <Skeleton className={cx('skeleton-text')} />
                              <Skeleton width="80%" className={cx('skeleton-text')} />
                              <Skeleton width="50%" className={cx('skeleton-text')} />
                          </div>
                      ))
                    : challenges.map((challenge) => (
                          <Link
                              to={`/challenge/${challenge.$id}`}
                              key={challenge.$id}
                              className={cx(
                                  'bg-white rounded-lg shadow transition-transform transform hover:scale-105',
                                  'challenge-card',
                              )}
                          >
                              <div className={cx('itemMobile')}>
                                  <img
                                      className={cx(
                                          'challengeImage',
                                          'rounded-lg mb-4 object-cover',
                                      )}
                                      src={challenge.imgChallenge || 'https://via.placeholder.com/300x200'}
                                      alt={challenge.nameChallenge || `Thử thách ${challenge.$id}`}
                                      loading="lazy"
                                  />
                                  <div className={cx('truncate')}>
                                      <h3 className={cx('challenge-title', ' font-bold mb-3 truncate')}>
                                          {challenge.nameChallenge || `Thử thách ${challenge.$id}`}
                                      </h3>
                                      <p className={cx('challenge-info', ' mb-[3px] text-gray-500')}>
                                          <FontAwesomeIcon icon={faFlag} /> Lĩnh vực:{' '}
                                          {challenge.field || 'Chưa xác định'}
                                      </p>
                                      <p className={cx(' mb-[3px] text-gray-500', 'challenge-info')}>
                                          <FontAwesomeIcon icon={faUsers} /> Số người tham gia:{' '}
                                          {challenge.participants || 0}
                                      </p>
                                      <p className={cx(' mb-[3px] text-gray-500', 'challenge-info')}>
                                          <FontAwesomeIcon icon={faPenNib} /> Tác giả:{' '}
                                          {challenge.createdBy || 'Không xác định'}
                                      </p>
                                  </div>
                              </div>
                          </Link>
                      ))}
            </section>

            {/* Thanh phân trang */}
            <div className={cx('mt-6 space-x-2', 'pagination')}>
                <button
                    className="cursor-pointer px-2 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(1)}
                >
                    Đầu
                </button>
                <button
                    className="cursor-pointer px-2 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    Trước
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                        key={page}
                        className={`px-3 py-2 rounded-md ${
                            page === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => handlePageChange(page)}
                    >
                        {page}
                    </button>
                ))}
                <button
                    className="px-2 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    Sau
                </button>
                <button
                    className="px-2 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                >
                    Cuối
                </button>
            </div>
        </div>
    );
}

export default React.memo(Home);
