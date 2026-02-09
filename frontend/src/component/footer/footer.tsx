import React from 'react';
import './style.css'
import logo from '../../assets/image/logo_white.svg'
const Footer = () => {
    return (
        <div id='footer'>
            <img src={logo} alt="logo" />
            <div className='fc'>
                <div>
                    <div>상호명 : 숏만랩</div> <div className="line" />
                    <div>대표자 : 윤승진</div><div className="line" />
                    <div>주소 : 서울 강남구 도산대로 145 인우빌딩 12층 1208</div>
                </div>
                <div>
                    <div>사업자등록번호: 673-88-01348</div> <div className="line" />
                    <div>Tel : 02-381-9587</div><div className="line" />
                    <div>문의 : crazy4dream@mannacompany.co.kr </div>
                </div>
                <div>
                    <div>COPYRIGHT ⓒ 숏만랩 ALL RIGHTS RESERVED</div>
                </div>
            </div>
        </div>
    );
};

export default Footer;
