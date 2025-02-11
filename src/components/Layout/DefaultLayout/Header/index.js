'use client';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Button from '~/components/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCircleUser, faRankingStar, faScrewdriverWrench, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Search from '../Search';
import { UserContext } from '~/contexts/UserContext';
import { account, databases } from '~/appwrite/config';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';


const cx = classNames.bind(styles);

function Header() {
    const location = useLocation();
    const { setUserId, setDisplayName } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [loginError, setLoginError] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);


    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const user = await account.get();
                setCurrentUser(user);
                setUserId(user.$id);
                setDisplayName(user.name);
                if (user.labels && user.labels.includes('admin')) {
                    setIsAdmin(true);
                }
            } catch {
                setCurrentUser(null);
                setIsAdmin(false);
            }
        };
        fetchCurrentUser();
    }, [setUserId, setDisplayName]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');

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
            console.error('Login error:', error);
            setLoginError('Đăng nhập thất bại: ' + error.message);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoginError('');

        const email = e.target.email.value;
        const password = e.target.password.value;
        const confirmPassword = e.target.confirmPassword.value;
        const name = e.target.name.value;
        if (password !== confirmPassword) {
            setLoginError('Mật khẩu xác nhận không khớp.');
            return;
        }

        try {
            // Tạo tài khoản trong Appwrite Auth
            const user = await account.create('unique()', email, password, name);

            // Lưu `displayName` vào collection `users`
            await databases.createDocument(
                '678a0e0000363ac81b93', // Database ID
                '678a207f00308710b3b2', // Collection ID
                user.$id, // Sử dụng Appwrite User ID làm Document ID
                {
                    displayName: name,
                    gmail: email,
                },
            );

            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            setIsRegister(false);
        } catch (error) {
            setLoginError('Đăng ký thất bại: ' + error.message);
        }
    };

    const ModalForm = () => (
        <div className={cx('modal-overlay', { show: isModalOpen })}>
            <div className={cx('modal-form', { show: isModalOpen })}>
                <h1>{isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập vào Challengelt'}</h1>
                <FontAwesomeIcon className={cx('close-modal')} onClick={() => setIsModalOpen(false)} icon={faXmark} />
                <form onSubmit={isRegister ? handleRegister : handleLogin}>
                    {isRegister && <input name="name" type="text" placeholder="Tên hiển thị" required />}
                    <input name="email" type="email" placeholder="Email" required />
                    <input name="password" type="password" placeholder="Mật khẩu" required />
                    {isRegister && (
                        <input name="confirmPassword" type="password" placeholder="Xác nhận mật khẩu" required />
                    )}
                    {loginError && <p className={cx('error')}>{loginError}</p>}
                    <button className={cx('btn-login')} type="submit">
                        {isRegister ? 'Đăng Ký' : 'Đăng Nhập'}
                    </button>
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
                </form>
            </div>
        </div>
    );

    return (
        <div className={cx('nav-header')}>
            <Container className={cx('con-nav')}>
                <Navbar.Brand>
                    <Link to="/">
                        <img className={cx('logo')} src="/logo2.png" height={50} width={118} alt="Challengelt" />
                    </Link>
                </Navbar.Brand>

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
                            <Tippy content="Thông báo" placement="bottom">
                                <Link
                                    className={cx('iconNotification', {
                                        active: location.pathname === '/notification',
                                    })}
                                    to="/notification"
                                >
                                    <FontAwesomeIcon icon={faBell} />

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

                            <Tippy content="Bảng xếp hạng" placement="bottom">
                                <Link
                                    className={cx('iconRank', { active: location.pathname === '/rank' })}
                                    to="/rank"
                                >
                                    <FontAwesomeIcon icon={faRankingStar} />
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
                </div>
            </Container>
        </div>
    );
}

export default Header;
