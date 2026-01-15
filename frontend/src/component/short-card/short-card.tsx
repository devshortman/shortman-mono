import React from 'react';
import './style.css'
import bookmark from '../../assets/image/icon_btn_mark.svg'
import like from '../../assets/image/heart.svg'
import comment from '../../assets/image/comment.svg'
import play from '../../assets/image/play.svg'

// 플랫폼 아이콘 import
import instagramIcon from '../../assets/image/insta.svg'
import youtubeIcon from '../../assets/image/youtube.svg'
import tiktokIcon from '../../assets/image/tiktok.svg'

type CardInterface = {
    avatar?: string;
    thumbnail?: string;
    source?: string;  // 플랫폼: instagram, youtube, tiktok
    videoUrl?: string;
    title?: string;
    nickname?: string;
    likes?: number;
    views?: number;
}

const Card: React.FC<CardInterface> = ({
    avatar,
    thumbnail,
    source,
    videoUrl,
    title,
    nickname,
    likes,
    views,
}) => {
    
    // 플랫폼별 아이콘
    const getPlatformIcon = (platform?: string) => {
        switch(platform) {
            case 'instagram': return instagramIcon;
            case 'youtube': return youtubeIcon;
            case 'tiktok': return tiktokIcon;
            default: return instagramIcon;
        }
    };

    // 숫자 포맷팅 (1000 -> 1K)
    const formatNumber = (num?: number) => {
        if (!num) return '0';
        if (num >= 10000000) return `${(num / 10000000).toFixed(1)}천만`;
        if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // 카드 클릭 시 원본 페이지 이동
    const handleClick = () => {
        if (videoUrl) {
            window.open(videoUrl, '_blank', 'noopener,noreferrer');
        }
    };
    
    return (
        <div id='card' onClick={handleClick} style={{ cursor: videoUrl ? 'pointer' : 'default' }}>
            <div className="th">
                <img 
                    className="thumbnail" 
                    src={thumbnail || 'https://via.placeholder.com/400x600'} 
                    alt="thumbnail" 
                />
                <div className="source-icon">
                    <img src={getPlatformIcon(source)} alt={source || 'platform'} />
                </div>
                <div className="bottom-text">
                    <img src={play} alt="play" />
                    <span>{formatNumber(views)}</span>
                </div>
            </div>

            <div className='con'>
                <div className='a'>
                    <img 
                        className="avatar" 
                        src={avatar || 'https://via.placeholder.com/40'} 
                        alt="avatar" 
                    />
                    <div>{nickname || 'Unknown'}</div>
                    <img src={bookmark} alt="bookmark" />
                </div>

                <div className="title">
                    {title || '제목 없음'}
                </div>

                <div className="stats">
                    <div>
                        <img src={like} alt="like" />
                        <div>{formatNumber(likes)}</div>
                    </div>
                    <div>
                        <img src={comment} alt="comment" />
                        <div>{formatNumber(Math.floor((likes || 0) * 0.1))}</div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Card;