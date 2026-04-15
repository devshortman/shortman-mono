import React, { useEffect, useState } from 'react';
import Header from '../../component/header/Header';
import "./style.css";
import banner from '../../assets/image/banner.svg';
import arrow from '../../assets/image/arrow.svg';
import ShortCard from '../../component/short-card/ShortCard';
import Footer from '../../component/footer/Footer';
import { API_ENDPOINTS } from '../../config/api';

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

const Home = () => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ShortsItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchShorts();
    }, []);

    const fetchShorts = async () => {
        try {
            setLoading(true);

            // 플랫폼당 4개 × 3 = 12개
            // 국내 2개 + 글로벌 2개씩 균등하게 뽑기
            const platforms = ['youtube', 'instagram', 'tiktok'];
            const regions = ['korea', 'global'];
            const perPlatformPerRegion = 2;

            const requests = platforms.flatMap(platform =>
                regions.map(region =>
                    fetch(`${API_ENDPOINTS.SHORTS}?platform=${platform}&region=${region}&limit=${perPlatformPerRegion}`)
                        .then(r => r.ok ? r.json() : { items: [] })
                        .then(d => d.items || [])
                        .catch(() => [])
                )
            );

            const results = await Promise.all(requests);
            const combined: ShortsItem[] = results.flat();

            // 빈 플랫폼이 있으면 나머지로 채우기
            if (combined.length < 12) {
                const extra = await fetch(`${API_ENDPOINTS.SHORTS}?limit=12`)
                    .then(r => r.ok ? r.json() : { items: [] })
                    .then(d => d.items || [])
                    .catch(() => []);

                const existingIds = new Set(combined.map((i: ShortsItem) => i.id));
                const fill = extra.filter((i: ShortsItem) => !existingIds.has(i.id));
                combined.push(...fill.slice(0, 12 - combined.length));
            }

            setItems(combined.slice(0, 12));
            setError(null);
        } catch (err) {
            console.error('Error fetching shorts:', err);
            setError('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div id='home'>
                <Header />
                <div className='body'>
                    <img src={banner} alt="banner" className="home-banner" />
                    <div className="loading">로딩 중...</div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div id='home'>
            <Header />
            <div className='body'>
                <img src={banner} alt="banner" className="home-banner" />

                <div className="c">
                    <div className="h">
                        <div>
                            숏만 Pick <span>Top 12</span>
                        </div>
                        <div>더보기 <span><img src={arrow} alt="arrow" /></span></div>
                    </div>

                    {items.length > 0 ? (
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
                        <div className="empty">
                            {error || '데이터가 없습니다.'}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Home;
