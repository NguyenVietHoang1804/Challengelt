import classNames from 'classnames/bind';
import styles from './Button.module.scss';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

function Button({ to, href, primary = false, disabled = false, children, onClick, ...passProps }) {
    let Comp = 'button';
    const props = {
        onClick,
        ...passProps,
    };

    if (disabled) {
        Object.keys(props).forEach((key) =>{
            if(key.startsWith('on') && typeof props[key] === 'function'){
                delete props[key];
            }
        })
    }   

    if (to) {
        props.to = to;
        Comp = Link;
    } else if (href) {
        props.href = href;
        Comp = 'a';
    }

    const classes = cx('wrapper', {
        primary,
        disabled,
    });
    return (
        <Comp className={classes} {...props}>
            <span className={cx('btn')}>{children}</span>
        </Comp>
    );
}

export default Button;
