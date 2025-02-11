import { faCircleXmark, faMagnifyingGlass, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Tippy from '@tippyjs/react/headless';
import { Wrapper as PopperWrapper } from '~/components/Popper';
import AccountItem from '~/components/AccountItem';
import SearchItem from '~/components/SearchItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames/bind';
import styles from './Search.module.scss';
import { useEffect, useState, useRef } from 'react';
import { useDebounce } from '~/hooks';
import { databases,Query } from '~/appwrite/config';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

function Search() {
    const [searchValue, setSearchValue] = useState('');
    const [searchResult, setSearchResult] = useState([]);
    const [showResult, setShowResult] = useState(true);
    const [loading, setLoading] = useState(false);
    const debounce = useDebounce(searchValue, 500);
    const inputRef = useRef();
    const navigate = useNavigate();


    const handleClear = () => {
        setSearchValue('');
        setSearchResult([]);
        inputRef.current.focus();
    };

    const handleHideResult = () => {
        setShowResult(false);
    };

    const handleSelectItem = () => {
        // Khi người dùng bấm vào thử thách hoặc tài khoản => Ẩn Tippy
        setShowResult(false);
    };

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!debounce.trim()) {
                setSearchResult([]);
                return;
            }

            setLoading(true);

            try {
                const accountResponse = await databases.listDocuments(
                    '678a0e0000363ac81b93',
                    '678a207f00308710b3b2',
                    [Query.contains('displayName', debounce), Query.limit(3)]
                );

                const challengeResponse = await databases.listDocuments(
                    '678a0e0000363ac81b93',
                    '678a0fc8000ab9bb90be',
                    [Query.contains('nameChallenge', debounce), Query.limit(5)]
                );

                setSearchResult([
                    ...accountResponse.documents.map((doc) => ({
                        id: `account-${doc.$id}`,
                        type: 'account',
                        data: doc,
                    })),
                    ...challengeResponse.documents.map((doc) => ({
                        id: `challenge-${doc.$id}`,
                        type: 'challenge',
                        data: doc,
                    })),
                ]);
            } catch (error) {
                console.error('Error fetching search results:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [debounce]);

    const handleSearchSubmit = () => {
        if (searchValue.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchValue)}`);
            setShowResult(false); // Ẩn kết quả gợi ý khi chuyển trang
        }
    };

    return (
        <Tippy
            interactive
            visible={showResult && searchResult.length > 0}
            render={(attr) => (
                <div className={cx('search-result')} tabIndex="-1" {...attr}>
                    <PopperWrapper>
                        <h4 className={cx('search-title')}>Thử thách</h4>
                        {searchResult
                            .filter((result) => result.type === 'challenge')
                            .slice(0, 5)
                            .map((result) => (
                                <div key={result.id} onClick={handleSelectItem}>
                                    <SearchItem data={result.data} />
                                </div>
                            ))}
                        <h4 className={cx('search-title')}>Tài khoản</h4>
                        {searchResult
                            .filter((result) => result.type === 'account')
                            .slice(0, 3)
                            .map((result) => (
                                <div key={result.id} onClick={handleSelectItem}>
                                    <AccountItem data={result.data} />
                                </div>
                            ))}
                    </PopperWrapper>
                </div>
            )}
            onClickOutside={handleHideResult}
        >
            <div className={cx('search')}>
                <input
                    ref={inputRef}
                    value={searchValue}
                    className={cx('input')}
                    size="lg"
                    type="text"
                    placeholder="Tìm kiếm thử thách"
                    spellCheck={false}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onFocus={() => setShowResult(true)}
                />
                {!!searchValue && !loading && (
                    <button onClick={handleClear}>
                        <FontAwesomeIcon className={cx('clear')} icon={faCircleXmark} />
                    </button>
                )}
                {loading && <FontAwesomeIcon icon={faSpinner} className={cx('loading')} />}
                <button onClick={handleSearchSubmit}>
                    <FontAwesomeIcon className={cx('search-btn')} icon={faMagnifyingGlass} />
                </button>
            </div>
        </Tippy>
    );
}

export default Search;
