import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './style.css';
import ShortCard from '../../component/short-card/ShortCard';
import Header from '../../component/header/Header';
import Footer from '../../component/footer/Footer';
import { API_ENDPOINTS } from '../../config/api';

import parent from '../../assets/image/parent.svg';
import health from '../../assets/image/health.svg';
import eat from '../../assets/image/eat.svg';
import parentOn from '../../assets/image/parent_on.svg';
import healthOn from '../../assets/image/health_on.svg';
import eatOn from '../../assets/image/eat_on.svg';

interface ShortsItem {
    id: number;
    platform: string;
    platform_id: string;
    region: string;
    title: string;
    nickname?: string;
    avatar?: string;
    thumbnail?: string;
    video_url: string;
    description?: string;
    likes?: number;
    views?: number;
    comments?: number;
}

const PLATFORM_MAP: Record<string, 'youtube' | 'instagram' | 'tiktok'> = {
    shorts: 'youtube',
    reels: 'instagram',
    tiktok: 'tiktok',
};

const TITLE_MAP: Record<string, string> = {
    shorts: '유튜브 쇼츠 트렌드',
    reels: '인스타 릴스 트렌드',
    tiktok: '틱톡 트렌드',
};

const categories = [
    { id: 'all', name: '전체', icon: null, iconOn: null },
    { id: 'parent', name: '맘플 (육아/키즈)', icon: parent, iconOn: parentOn },
    { id: 'eat', name: '먹플 (탐방/레시피/먹방)', icon: eat, iconOn: eatOn },
    { id: 'health', name: '헬플 (헬스/건강)', icon: health, iconOn: healthOn },
    { id: 'etc', name: '기타', icon: null, iconOn: null },
];

const Kr = () => {
    const location = useLocation();
    const path = location.pathname.replace(/^#?\//, '') || '';

    const platform = PLATFORM_MAP[path] || 'youtube';
    const title = TITLE_MAP[path] || '숏폼 트렌드';

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [activeTab, setActiveTab] = useState<'korea' | 'global'>('korea');
    const [items, setItems] = useState<ShortsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, [platform, activeTab]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const resp = await fetch(
                `${API_ENDPOINTS.SHORTS}?platform=${platform}&region=${activeTab}&limit=8`
            );
            if (!resp.ok) throw new Error('fetch failed');
            const data = await resp.json();
            setItems(data.items || []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id='kr'>
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
                                        src={selectedCategory === category.id ? category.iconOn! : category.icon}
                                        alt={category.name}
                                    />
                                )}
                                <div>{category.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 국내 / 글로벌 탭 */}
                <div className='tabs'>
                    <div
                        className={activeTab === 'korea' ? 'tab on' : 'tab'}
                        onClick={() => setActiveTab('korea')}
                    >
                        국내
                    </div>
                    <div
                        className={activeTab === 'global' ? 'tab on' : 'tab'}
                        onClick={() => setActiveTab('global')}
                    >
                        글로벌
                    </div>
                </div>

                {loading ? (
                    <div className="loading">로딩 중...</div>
                ) : items.length > 0 ? (
                    <div className='w'>
                        {items.map((item) => (
                            <ShortCard
                                key={item.id}
                                avatar={item.avatar}
                                thumbnail={item.thumbnail}
                                source={item.platform}
                                videoUrl={item.video_url}
                                title={item.title}
                                nickname={item.nickname}
                                likes={item.likes}
                                views={item.views}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty">데이터가 없습니다.</div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Kr;
