import React from 'react';
import Header from '../../component/header/header';
import "./style.css";
import banner from '../../assets/image/banner.svg'
import arrow from '../../assets/image/arrow.svg'
import Card from '../../component/short-card/short-card';

import Footer from '../../component/footer/footer';
import { data } from '../utils/source';




type CardInterface = {
    avatar?: string;
    thumbnail?: string;
    source?: string;
}

const Home = () => {

    const sections = [
        { region: "한국" },
        { region: "해외" },
        { region: "중국" }
    ];

    return (
        <div id='home'>
            <Header />
            <div className='body'>
                {/* 베너는 이미지로 처리 */}
                <img src={banner} alt="banner" />

                {sections.map((section, idx) => (
                    <React.Fragment key={idx}>
                        <div className="c">
                            <div className="h">
                                <div>
                                    금주의 뜨는 <span>{section.region} 숏폼 트랜드</span>
                                </div>
                                <div>더보기 <span><img src={arrow} alt="arrow" /></span></div>
                            </div>
                            <div className='w'>
                                {data?.map((e: any, i: any) =>
                                    <Card avatar={e?.avatar} thumbnail={e?.thumbnail} source={e?.source} key={i}></Card>
                                )}
                            </div>
                        </div>
                        {idx < sections.length - 1 && <div className="line"></div>}
                    </React.Fragment>
                ))}

            </div>
            <Footer></Footer>
        </div>
    );
};

export default Home;