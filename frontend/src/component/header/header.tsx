import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/image/logo.svg';
import search from '../../assets/image/icon_btn.svg';
import bookmark from '../../assets/image/icon_btn_mark.svg'
import './style.css'

const Header = () => {
    const navigate = useNavigate();

    const navItems = [
      { label: '한국', path: '/kr' },
      { label: '해외', path: '/glob' },
      { label: '중국', path: '/ch' },
      { label: '커머스', path: '/com' },
    ];

    return (
        <div id={'header'}>
            <img src={logo}  onClick={() => navigate('/')} alt="logo" />

            <div className='t'>
              {navItems.map((item) => (
                <div key={item.path} onClick={() => navigate(item.path)}>
                  {item.label}
                </div>
              ))}
            </div>

            <div className='c'>
                <img src={search} alt="logo" onClick={() => navigate("/search")}/>
                <img src={bookmark} alt="logo" />
                <div className="avatar" onClick={() => navigate("/my")}>
                    <span className="badge"></span>
                </div>
            </div>

        </div>

    );
};

export default Header;