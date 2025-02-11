import classNames from 'classnames/bind';
import styles from './SearchItem.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function SearchItem({data}) {
    return (
        <Link to={`/challenge/${data.$id}`} className={cx('wrapper')}>

            <div className={cx('info')}>
                <FontAwesomeIcon className={cx('iconSearch')} icon={faMagnifyingGlass} />
                <div className={cx('')}>
                    <p className={cx('nameChallenge')}>
                        <span>{data.nameChallenge}</span>
                    </p>
                    <span className={cx('field')}>{data.field}</span>
                </div>
            </div>
        </Link>
    );
}

export default SearchItem;