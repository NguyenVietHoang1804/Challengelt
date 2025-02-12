import Header from "./Header";
import Footer from "./Footer";
import Container from 'react-bootstrap/Container';

function DefaultLayout({children}) {
    return (
        <div>
            <Header/>
                <Container>
                    {children}
                </Container>
            <Footer/>
        </div>
    )
}

export default DefaultLayout;