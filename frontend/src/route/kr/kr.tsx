import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './style.css'
import { data } from '../utils/source';
import Card from '../../component/short-card/short-card';
import Header from '../../component/header/header';

import parent from '../../assets/image/parent.svg';
import health from '../../assets/image/health.svg';
import eat from '../../assets/image/eat.svg';

import parentOn from '../../assets/image/parent_on.svg';
import healthOn from '../../assets/image/health_on.svg';
import eatOn from '../../assets/image/eat_on.svg';
import Footer from '../../component/footer/footer';



const Kr = () => {
    const location = useLocation();
    const title =
        location.pathname.includes('ch')
            ? '중국 숏폼 트렌드'
            : location.pathname.includes('glob')
            ? '글로벌 숏폼 트렌드'
            : '한국 숏폼 트렌드';

    
    const categories = [
        { id: 'all', name: '전체', icon: null, iconOn: null },
        { id: 'parent', name: '맘플 (육아/키즈)', icon: parent, iconOn: parentOn },
        { id: 'eat', name: '먹플 (탐방/레시피/먹방)', icon: eat, iconOn: eatOn },
        { id: 'health', name: '헬플 (헬스/건강)', icon: health, iconOn: healthOn },
        { id: 'etc', name: '기타', icon: null, iconOn: null }
    ];

    const [selectedCategory, setSelectedCategory] = useState('all');

    return (
        <div id={'kr'}>
            <Header />

            <div className='body'>
                <div className='ca'>
                    <div>{title}</div>
                    <div>
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className={selectedCategory === category.id ? 'select on' : 'select'}
                                onClick={() => setSelectedCategory(category.id)}
                            >
                                {category.icon && (
                                    <img
                                        src={selectedCategory === category.id ? category.iconOn : category.icon}
                                        alt={category.name}
                                    />
                                )}
                                <div >
                                    {category.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                <div className='w'>
                    {data?.map((e: any, i: any) =>
                        <Card avatar={e?.avatar} thumbnail={e?.thumbnail} source={e?.source} key={i}></Card>
                    )}
                </div>
            </div>
            <Footer></Footer>

        </div>
    );
};

export default Kr;