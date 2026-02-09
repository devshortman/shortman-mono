import React, { useEffect, useState } from 'react';
import Header from '../../component/header/Header';
import "./style.css";
import banner from '../../assets/image/banner.svg'
import arrow from '../../assets/image/arrow.svg'
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
}

interface RegionalData {
    korea: ShortsItem[];
    global_: ShortsItem[];
    china: ShortsItem[];
    total_count: number;
}

// 목업 데이터 (API 미연동/개발용)
const MOCK_SECTIONS = [
    { region: "한국", key: "korea" as keyof Omit<RegionalData, 'total_count'> },
    { region: "해외", key: "global_" as keyof Omit<RegionalData, 'total_count'> },
    { region: "중국", key: "china" as keyof Omit<RegionalData, 'total_count'> }
];

const createMockShortsItem = (
    id: number,
    platform: string,
    region: string,
    title: string,
    nickname: string,
    likes: number,
    views: number
): ShortsItem => ({
    id,
    platform,
    platform_id: `mock_${platform}_${id}`,
    region,
    title,
    nickname,
    avatar: undefined,
    thumbnail: undefined,
    video_url: `https://example.com/video/${id}`,
    description: undefined,
    likes,
    views
});

const MOCK_REGIONAL_DATA: RegionalData = {
    korea: [
        createMockShortsItem(1, 'youtube', 'korea', '한 끼 요리 레시피 3종 모음', '요리왕김씨', 12400, 320000),
        createMockShortsItem(2, 'youtube', 'korea', '아침에 듣기 좋은 잔잔한 플레이리스트', '음악플레이', 8900, 156000),
        createMockShortsItem(3, 'tiktok', 'korea', '일상 브이로그 오늘의 점심', '일상로그', 25600, 890000),
        createMockShortsItem(4, 'youtube', 'korea', '5분 스트레칭으로 허리 통증 잡기', '헬스코치', 5200, 78000),
        createMockShortsItem(5, 'tiktok', 'korea', '반려묘 실시간 방송 하이라이트', '고양이집사', 41200, 1200000),
        createMockShortsItem(6, 'youtube', 'korea', '주말 나들이 추천 코스 서울 근교', '주말여행', 6800, 210000),
        createMockShortsItem(7, 'tiktok', 'korea', '집에서 하는 10분 코어 운동', '홈트레이너', 18900, 450000),
        createMockShortsItem(8, 'youtube', 'korea', '오늘의 맛집 탐방 브이로그', '맛집탐험가', 32100, 980000),
    ],
    global_: [
        createMockShortsItem(9, 'youtube', 'global', 'Morning routine that changed my life', 'LifeHacks', 89000, 2100000),
        createMockShortsItem(10, 'tiktok', 'global', 'Get ready with me - summer edition', 'BeautyByJane', 156000, 4500000),
        createMockShortsItem(11, 'youtube', 'global', '5 min workout for busy people', 'FitWorld', 67000, 1800000),
        createMockShortsItem(12, 'tiktok', 'global', 'POV: your cat has main character energy', 'CatVibes', 234000, 7200000),
        createMockShortsItem(13, 'youtube', 'global', 'Easy pasta recipe under 10 minutes', 'ChefMike', 45000, 980000),
        createMockShortsItem(14, 'tiktok', 'global', 'Travel vlog - best of 2024', 'Wanderlust', 78000, 2100000),
        createMockShortsItem(15, 'youtube', 'global', 'Productivity tips that actually work', 'ProductiveLife', 56000, 1200000),
        createMockShortsItem(16, 'tiktok', 'global', 'Day in my life as a remote worker', 'RemoteWorker', 42000, 890000),
    ],
    china: [
        createMockShortsItem(17, 'douyin', 'china', '今日美食分享：家常菜做法', '美食达人', 56000, 1200000),
        createMockShortsItem(18, 'kuaishou', 'china', '晨间运动 5分钟拉伸', '健康生活', 32000, 890000),
        createMockShortsItem(19, 'douyin', 'china', '旅行Vlog 成都美食之旅', '旅行记', 78000, 2100000),
        createMockShortsItem(20, 'kuaishou', 'china', '宠物日常 猫咪成精了', '萌宠日记', 125000, 4500000),
        createMockShortsItem(21, 'douyin', 'china', '穿搭分享 秋冬必备单品', '时尚博主', 43000, 980000),
        createMockShortsItem(22, 'kuaishou', 'china', '手工DIY 低成本改造房间', '改造家', 29000, 670000),
        createMockShortsItem(23, 'douyin', 'china', '护肤教程 敏感肌必备', '美妆小课堂', 67000, 1500000),
        createMockShortsItem(24, 'kuaishou', 'china', '读书分享 本周推荐书单', '读书人', 38000, 720000),
    ],
    total_count: 24
};

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
                `${API_ENDPOINTS.REGIONAL_SHORTS}?limit_per_region=8`
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
            setData(MOCK_REGIONAL_DATA);
        } finally {
            setLoading(false);
        }
    };

    const sections = MOCK_SECTIONS;

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
                {/* 배너 (모바일에서 숨김) */}
                <img src={banner} alt="banner" className="home-banner" />
                {error && (
                    <div className="empty" >
                        {/* {error} (목업 데이터로 표시 중) */}
                    </div>
                )}
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
                                        {items.slice(0, 8).map((item) => (
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
