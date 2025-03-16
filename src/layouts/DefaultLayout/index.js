import Header from './Header';
import Footer from './Footer';
import NotificationPopup from '~/components/NotificationPopup/NotificationPopup';
import { useNavigate } from 'react-router-dom';

function DefaultLayout({ children }) {
    const navigate = useNavigate();
    const handleChatRedirect = (senderId) => {
        navigate(`/chat?user=${senderId}`);
    };
    return (
        <div>
            <Header />
            <NotificationPopup onChatRedirect={handleChatRedirect} />
            {children}
            <Footer />
        </div>
    );
}

export default DefaultLayout;
