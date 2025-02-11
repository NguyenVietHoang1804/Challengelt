import { useState, forwardRef } from 'react';
import images from '~/assets/img';
import styles from './Image.module.scss';
import classNames from 'classnames';

const Image = forwardRef(({ src, className, alt, ...props }, ref) => {
    const [fallBack, setFallBack] = useState('');
    const handleError = () => {
        setFallBack(images.noImage);
    };
    return (
        <img
            className={classNames(styles.wrapper, className)}
            src={fallBack || src}
            alt={alt}
            ref={ref}
            {...props}
            onError={handleError}
        />
    );
});

export default Image;
