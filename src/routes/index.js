import Home from '~/pages/Home';
import joinChallenge from '~/pages/joinChallenge';
import ChallengeDetail from '~/pages/ChallengeDetail';
import Award from '~/pages/Award';
import CreateChallenge from '~/pages/CreateChallenge';
import Explore from '~/pages/Explore';
import Notification from '~/pages/Notification';
import Profile from '~/pages/Profile';
import ProfileUser from '~/pages/ProfileUser';
import Admin from '~/pages/Admin';
import SearchResult from '~/pages/SearchResult';
import Rank from '~/pages/Rank';


const publicRoutes=[
    {path: '/', component: Home},
    {path: '/joinChallenge/:id', component: joinChallenge},
    {path: '/challenge/:id', component: ChallengeDetail},
    {path: '/award', component: Award},
    {path: '/createChallenge', component: CreateChallenge},
    {path: '/explore', component: Explore},
    {path: '/notification', component: Notification},
    {path: '/profile', component: Profile },
    {path: '/profile/:id', component: ProfileUser },
    {path: '/admin', component: Admin },
    {path: '/search', component: SearchResult },
    {path: '/Rank', component: Rank },
    // {path: '/@:username', component: Profile },
    // {path: '/@:searchValue', component: Search },
]

const privateRoutes=[
    
]

export { publicRoutes, privateRoutes }