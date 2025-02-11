import classNames from 'classnames/bind';
import styles from './AccountItem.module.scss';
import Image from '~/components/Image';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

function AccountItem({data}) {
    return (
        <Link to={`/profile/${data.$id}`} className={cx('wrapper')}>
            <Image className={cx('avatar')} src={data.imgUser} alt={data.imgUser} />
            <div className={cx('info')}>
                <p className={cx('name')}>
                    <span>{data.displayName}</span>
                </p>
            </div>
        </Link>
    );
}

export default AccountItem;