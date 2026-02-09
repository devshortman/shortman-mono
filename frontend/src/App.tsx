import { Routes, Route } from 'react-router-dom';
import { HashRouter as Router } from 'react-router-dom';
import './App.css'
import Home from './route/home/home';
import Kr from './route/kr/kr';
import Search from './route/search/search';
import MyPage from './route/my-page/my-page';
import MyPageMilestone from './route/my-page-milestone/my-page-milestone';
import Commerce from './route/commerce/commerce';
import Join from './route/join/join';
import UserLogin from './route/user/user_login';
import AdminKeywords from './route/admin/admin';
import Project from './route/project/project';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shorts" element={<Kr />} />
        <Route path="/reels" element={<Kr />} />
        <Route path="/tiktok" element={<Kr />} />
        <Route path="/commerce" element={<Commerce />} />
        <Route path="/search" element={<Search />} />
        <Route path="/my" element={<MyPage />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/join" element={<Join />} />
        <Route path="/admin" element={<AdminKeywords />} />
        <Route path="/project" element={<Project />} />
        <Route path="/my-sample" element={<MyPageMilestone />} />
        <Route path="/about" element={<h1>About Page</h1>} />
        {/* 이전 URL 호환 */}
      </Routes>
    </Router>
  );
}

export default App
