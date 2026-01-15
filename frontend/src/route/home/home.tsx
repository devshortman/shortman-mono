import React, { useEffect, useState } from 'react';
import Header from '../../component/header/header';
import "./style.css";
import banner from '../../assets/image/banner.svg'
import arrow from '../../assets/image/arrow.svg'
import Card from '../../component/short-card/short-card';
import Footer from '../../component/footer/footer';

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
}

interface RegionalData {
    korea: ShortsItem[];
    global_: ShortsItem[];
    china: ShortsItem[];
    total_count: number;
}

const Home = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<RegionalData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRegionalShorts();
    }, []);

    const fetchRegionalShorts = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                'http://localhost:8000/api/v1/shorts/regional?limit_per_region=12'
                // 배포 시: 'https://short-man-backend.onrender.com/api/v1/shorts/regional?limit_per_region=12'
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }

            const result: RegionalData = await response.json();
            setData(result);
            setError(null);
        } catch (err) {
            console.error('Error fetching shorts:', err);
            setError('데이터를 불러오는데 실패했습니다.');
            // 개발 중에는 목업 데이터 사용
            setData({
                korea: [],
                global_: [],
                china: [],
                total_count: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const sections = [
        { region: "한국", key: "korea" as keyof Omit<RegionalData, 'total_count'> },
        { region: "해외", key: "global_" as keyof Omit<RegionalData, 'total_count'> },
        { region: "중국", key: "china" as keyof Omit<RegionalData, 'total_count'> }
    ];

    if (loading) {
        return (
            <div id='home'>
                <Header />
                <div className='body'>
                    <img src={banner} alt="banner" />
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
                {/* 배너 */}
                <img src={banner} alt="banner" />

                {sections.map((section, idx) => {
                    const items = data?.[section.key] || [];
                    
                    return (
                        <React.Fragment key={idx}>
                            <div className="c">
                                <div className="h">
                                    <div>
                                        금주의 뜨는 <span>{section.region} 숏폼 트렌드</span>
                                    </div>
                                    <div>더보기 <span><img src={arrow} alt="arrow" /></span></div>
                                </div>
                                
                                {items.length > 0 ? (
                                    <div className='w'>
                                        {items.map((item) => (
                                            <Card 
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
                                        데이터가 없습니다. 크롤러를 실행해주세요!
                                    </div>
                                )}
                            </div>
                            {idx < sections.length - 1 && <div className="line"></div>}
                        </React.Fragment>
                    );
                })}

            </div>
            <Footer />
        </div>
    );
};

export default Home;
