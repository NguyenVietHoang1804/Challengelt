'use client';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import Container from 'react-bootstrap/Container';
import Button from '~/components/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBell,
    faCircleUser,
    faComments,
    faRankingStar,
    faScrewdriverWrench,
    faSpinner,
    faUserGroup,
    faXmark,
    faBars,
} from '@fortawesome/free-solid-svg-icons';
import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Search from '../Search';
import { UserContext } from '~/contexts/UserContext';
import { account, databases, client, Query } from '~/appwrite/config';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const cx = classNames.bind(styles);

function Header() {
    const location = useLocation();
    const { setUserId, setDisplayName, unreadCount, setUnreadCount } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [loginError, setLoginError] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notiCount, setNotiCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const user = await account.get();
                setCurrentUser(user);
                setUserId(user.$id);
                setDisplayName(user.name);
                setIsAdmin(user.labels?.includes('admin') || false);
            } catch {
                setCurrentUser(null);
                setIsAdmin(false);
            }
        };
        fetchCurrentUser();
    }, [setUserId, setDisplayName]);

    const handleLogin = useCallback(
        async (e) => {
            e.preventDefault();
            setLoginError('');
            setIsLoading(true);

            const email = e.target.email.value;
            const password = e.target.password.value;

            try {
                await account.createEmailPasswordSession(email, password);
                const user = await account.get();
                setCurrentUser(user);
                setUserId(user.$id);
                setDisplayName(user.name);
                setIsModalOpen(false);
            } catch (error) {
                setLoginError('Đăng nhập thất bại: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        },
        [setUserId, setDisplayName],
    );

    const handleRegister = useCallback(async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);

        const email = e.target.email.value;
        const password = e.target.password.value;
        const confirmPassword = e.target.confirmPassword.value;
        const name = e.target.name.value;
        if (password !== confirmPassword) {
            setLoginError('Mật khẩu xác nhận không khớp.');
            return;
        }

        try {
            const user = await account.create('unique()', email, password, name);
            await databases.createDocument('678a0e0000363ac81b93', '678a207f00308710b3b2', user.$id, {
                displayName: name,
                gmail: email,
            });
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            setIsRegister(false);
        } catch (error) {
            setLoginError('Đăng ký thất bại: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUnreadCount = async (userId) => {
        try {
            const response = await databases.listDocuments('678a0e0000363ac81b93', 'messages', [
                Query.equal('receiverId', userId),
                Query.equal('isRead', false),
            ]);
            const unreadMessages = response.documents.length;
            setUnreadCount(unreadMessages);
            localStorage.setItem(`messCount_${userId}`, unreadMessages); // Lưu vào localStorage
            return unreadMessages; // Trả về giá trị để dùng nếu cần
        } catch (error) {
            console.error('Lỗi khi lấy số tin nhắn chưa đọc:', error);
            return 0;
        }
    };

    useEffect(() => {
        if (!currentUser) return;

        // Đồng bộ số tin nhắn chưa đọc từ server khi đăng nhập
        fetchUnreadCount(currentUser.$id);

        // Lấy giá trị từ localStorage làm giá trị ban đầu (nếu có)
        const savedMessCount = localStorage.getItem(`messCount_${currentUser.$id}`);
        if (savedMessCount) {
            setUnreadCount(parseInt(savedMessCount, 10));
        }

        // Subscription để cập nhật thời gian thực
        const unsubscribe = client.subscribe(
            `databases.678a0e0000363ac81b93.collections.messages.documents`,
            (response) => {
                const payload = response.payload;
                if (!payload) return;

                if (payload.receiverId === currentUser.$id && !payload.isRead) {
                    setUnreadCount((prev) => {
                        const newMessCount = prev + 1;
                        localStorage.setItem(`messCount_${currentUser.$id}`, newMessCount);
                        return newMessCount;
                    });
                }
            },
        );

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (location.pathname === '/chat' && currentUser) {
            // Không cần reset unreadCount về 0 ở đây nữa, vì nó sẽ được cập nhật qua selectUser
        }
    }, [currentUser, location.pathname]);

    const fetchNotiCount = async (userId) => {
        try {
            const response = await databases.listDocuments(
                '678a0e0000363ac81b93', // Database ID
                'notifications', // Collection ID
                [
                    Query.equal('userId', userId),
                    Query.equal('isRead', false), // Giả sử bạn có trường 'isRead' để đánh dấu thông báo đã đọc
                ],
            );
            const unreadNotifications = response.documents.length;
            setNotiCount(unreadNotifications);
        } catch (error) {
            console.error('Lỗi khi lấy số thông báo chưa đọc:', error);
        }
    };

    useEffect(() => {
        if (!currentUser) return;

        // Đồng bộ số thông báo chưa đọc từ server khi đăng nhập
        fetchNotiCount(currentUser.$id);

        // Subscription để cập nhật thời gian thực
        const unsubscribe = client.subscribe(
            `databases.678a0e0000363ac81b93.collections.notifications.documents`,
            (response) => {
                const newNotification = response.payload;
                if (!newNotification) return;

                if (newNotification.userId === currentUser.$id) {
                    setNotiCount((prev) => {
                        const newCount = prev + 1;
                        return newCount;
                    });
                }
            },
        );

        return () => unsubscribe();
    }, [currentUser]);

    // Khi vào trang thông báo, reset số lượng thông báo chưa đọc
    useEffect(() => {
        if (location.pathname === '/notification' && currentUser) {
            const markNotificationsAsRead = async () => {
                try {
                    const response = await databases.listDocuments('678a0e0000363ac81b93', 'notifications', [
                        Query.equal('userId', currentUser.$id),
                        Query.equal('isRead', false),
                    ]);
                    const unreadNotifications = response.documents;
                    // Cập nhật từng thông báo thành đã đọc
                    for (const notification of unreadNotifications) {
                        await databases.updateDocument('678a0e0000363ac81b93', 'notifications', notification.$id, {
                            isRead: true,
                        });
                    }
                    setNotiCount(0);
                    localStorage.setItem(`notiCount_${currentUser.$id}`, 0); // Reset localStorage
                } catch (error) {
                    console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
                }
            };
            markNotificationsAsRead();
        }
    }, [currentUser, location.pathname]);

    // Đóng menu khi nhấp ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isMenuOpen &&
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                !event.target.closest(`.${cx('menu-toggle')}`)
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleMenuItemClick = () => {
        setIsMenuOpen(false);
    };
    useEffect(() => {
        setIsMenuOpen(false); // Đóng menu khi đường dẫn thay đổi
    }, [location.pathname]);

    const ModalForm = () => (
        <div className={cx('modal-overlay', { show: isModalOpen })}>
            <div className={cx('modal-form', { show: isModalOpen })}>
                <h1>{isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập vào Challengelt'}</h1>
                {!isLoading && (
                    <FontAwesomeIcon
                        className={cx('close-modal')}
                        onClick={() => setIsModalOpen(false)}
                        icon={faXmark}
                    />
                )}
                <form onSubmit={isRegister ? handleRegister : handleLogin}>
                    {isRegister && (
                        <input name="name" type="text" placeholder="Tên hiển thị" required disabled={isLoading} />
                    )}
                    <input name="email" type="email" placeholder="Email" required disabled={isLoading} />
                    <input name="password" type="password" placeholder="Mật khẩu" required disabled={isLoading} />
                    {isRegister && (
                        <input
                            name="confirmPassword"
                            type="password"
                            placeholder="Xác nhận mật khẩu"
                            required
                            disabled={isLoading}
                        />
                    )}
                    {loginError && <p className={cx('error')}>{loginError}</p>}
                    <button className={cx('btn-login')} type="submit" disabled={isLoading}>
                        {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : isRegister ? 'Đăng Ký' : 'Đăng Nhập'}
                    </button>
                    {!isLoading && (
                        <>
                            <p>Hoặc</p>
                            <span>
                                {isRegister ? (
                                    <>
                                        Bạn đã có tài khoản?{' '}
                                        <span className={cx('btn-dangnhap')} onClick={() => setIsRegister(false)}>
                                            Đăng Nhập
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        Bạn chưa có tài khoản?{' '}
                                        <span className={cx('btn-dangky')} onClick={() => setIsRegister(true)}>
                                            Đăng Ký
                                        </span>
                                    </>
                                )}
                            </span>
                        </>
                    )}
                </form>
            </div>
        </div>
    );

    return (
        <div className={cx('nav-header')}>
            <Container className={cx('con-nav')}>
                <Link to="/home">
                    <img className={cx('logo')} src="/logoweb.png" height={50} width={70} alt="Challengelt" />
                </Link>
                <Search />

                <div className={cx('action')}>
                    {currentUser ? (
                        <>
                            {isAdmin && (
                                <Tippy content="Admin" placement="bottom">
                                    <Link
                                        className={cx('iconAdmin', { active: location.pathname === '/admin' })}
                                        to="/admin"
                                    >
                                        <FontAwesomeIcon icon={faScrewdriverWrench} />
                                    </Link>
                                </Tippy>
                            )}

                            <Tippy content="Bạn bè" placement="bottom">
                                <Link
                                    className={cx('iconFriends', {
                                        active: location.pathname === '/friends',
                                    })}
                                    to="/friends"
                                >
                                    <FontAwesomeIcon icon={faUserGroup} />
                                </Link>
                            </Tippy>

                            <Tippy content="Nhắn tin" placement="bottom">
                                <Link
                                    className={cx('iconMess', {
                                        active: location.pathname === '/chat',
                                    })}
                                    to="/chat"
                                >
                                    <FontAwesomeIcon icon={faComments} />
                                    {unreadCount > 0 && (
                                        <span className={cx('new-noti')}>
                                            <span className="absolute right-[4px] text-white text-[10px]">
                                                {unreadCount}
                                            </span>
                                        </span>
                                    )}
                                </Link>
                            </Tippy>

                            <Tippy content="Thông báo" placement="bottom">
                                <Link
                                    className={cx('iconNotification', {
                                        active: location.pathname === '/notification',
                                    })}
                                    to="/notification"
                                >
                                    <FontAwesomeIcon icon={faBell} />
                                    {notiCount > 0 && (
                                        <span className={cx('unread-badge')}>
                                            <span className="absolute right-[4px] text-white text-[10px]">
                                                {notiCount}
                                            </span>
                                        </span>
                                    )}
                                </Link>
                            </Tippy>

                            <Tippy content="Trang cá nhân" placement="bottom">
                                <Link
                                    className={cx('iconProfile', { active: location.pathname === '/profile' })}
                                    to="/profile"
                                >
                                    <FontAwesomeIcon icon={faCircleUser} />
                                </Link>
                            </Tippy>
                        </>
                    ) : (
                        <>
                            <Button className={cx('btn-login')} onClick={() => setIsModalOpen(true)} primary>
                                Đăng Nhập
                            </Button>
                            {isModalOpen && <ModalForm />}
                        </>
                    )}
                    <Tippy content="Bảng xếp hạng" placement="bottom">
                        <Link className={cx('iconRank', { active: location.pathname === '/rank' })} to="/rank">
                            <FontAwesomeIcon icon={faRankingStar} />
                        </Link>
                    </Tippy>
                    <button className={cx('menu-toggle')} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                </div>
                {isMenuOpen && (
                    <div className={cx('mobile-menu')} ref={menuRef}>
                        {currentUser ? (
                            <>
                                {isAdmin && (
                                    <Link to="/admin" onClick={handleMenuItemClick}>
                                        <FontAwesomeIcon className={cx('action-mobi')} icon={faScrewdriverWrench} />{' '}
                                        Admin
                                    </Link>
                                )}
                                <Link to="/profile" onClick={handleMenuItemClick}>
                                    <FontAwesomeIcon className={cx('action-mobi')} icon={faCircleUser} /> Trang cá nhân
                                </Link>
                                <Link to="/friends" onClick={handleMenuItemClick}>
                                    <FontAwesomeIcon className={cx('action-mobi')} icon={faUserGroup} /> Bạn bè
                                </Link>
                                <Link to="/chat" onClick={handleMenuItemClick}>
                                    <FontAwesomeIcon className={cx('action-mobi')} icon={faComments} /> Nhắn tin
                                    {unreadCount > 0 && (
                                        <span className={cx('new-noti-mobi')}>
                                            <span className="absolute right-[4px] text-white text-[10px]">
                                                {unreadCount}
                                            </span>
                                        </span>
                                    )}
                                </Link>
                                <Link to="/notification" onClick={handleMenuItemClick}>
                                    <FontAwesomeIcon className={cx('action-mobi')} icon={faBell} /> Thông báo
                                    {notiCount > 0 && (
                                        <span className={cx('unread-badge-mobi')}>
                                            <span className="absolute right-[4px] text-white text-[10px]">
                                                {notiCount}
                                            </span>
                                        </span>
                                    )}
                                </Link>
                                <Link to="/rank" onClick={handleMenuItemClick}>
                                    <FontAwesomeIcon className={cx('action-mobi')} icon={faRankingStar} /> Bảng xếp hạng
                                </Link>
                            </>
                        ) : (
                            <Button className={cx('btn-login')} onClick={() => setIsModalOpen(true)} primary>
                                Đăng Nhập
                            </Button>
                        )}
                    </div>
                )}
                {isModalOpen && <ModalForm />}
            </Container>
        </div>
    );
}

export default Header;
