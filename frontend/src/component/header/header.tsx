import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/image/logo.svg';
import search from '../../assets/image/icon_btn.svg';
import youtubeIcon from '../../assets/image/youtube.svg';
import instaIcon from '../../assets/image/insta.svg';
import tiktokIcon from '../../assets/image/tiktok.svg';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';
import './style.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname?.replace(/^#?\//, '') || '';
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/', { replace: true });
    };

    const navItems = [
      { icon: youtubeIcon, label: '유튜브 쇼츠', path: '/shorts' },
      { icon: instaIcon, label: '릴스', path: '/reels' },
      { icon: tiktokIcon, label: '틱톡', path: '/tiktok' },
      { label: '커머스', path: '/commerce' },
    ];

    return (
        <div id={'header'}>
            <img src={logo}  onClick={() => navigate('/')} alt="logo" />

            <div className='t'>
              {navItems.map((item) => (
                <div
                  key={item.path}
                  className={`nav-item${currentPath === item.path.replace(/^\//, '') ? ' active' : ''}`}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                >
                  {'icon' in item && item.icon ? (
                    <img src={item.icon} alt={item.label} className="nav-icon" />
                  ) : (
                    <span>{item.label}</span>
                  )}
                </div>
              ))}
            </div>

            <div className='c'>
                {user ? (
                    <>
                        <img src={search} alt="search" onClick={() => navigate("/search")} />
                        {/* <img src={bookmark} alt="bookmark" /> */}
                        <div className="avatar" onClick={() => navigate("/my")}>
                            <span className="badge"></span>
                        </div>
                        <button type="button" className="header-logout-btn" onClick={handleLogout}>
                            로그아웃
                        </button>
                    </>
                ) : (
                    <button type="button" className="header-login-btn" onClick={() => navigate('/login')}>
                        로그인
                    </button>
                )}
            </div>

        </div>

    );
};

export default Header;
