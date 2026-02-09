import user1 from '../../assets/image/user1.svg'
import user2 from '../../assets/image/user2.svg'
import user3 from '../../assets/image/user3.svg'
import user4 from '../../assets/image/user4.svg'
import user5 from '../../assets/image/user5.svg'
import avatar from '../../assets/image/avatar.svg'

import image1 from '../../assets/image/image1.svg'
import image2 from '../../assets/image/image2.svg'
import image3 from '../../assets/image/image3.svg'
import image4 from '../../assets/image/image4.svg'
import image5 from '../../assets/image/image5.svg'

import insta from '../../assets/image/insta.svg'
import youtube from '../../assets/image/youtube.svg'
import tiktok from '../../assets/image/tiktok.svg'
import Footer from '../../component/footer/Footer';


type CardInterface = {
    avatar?: string;
    thumbnail?: string;
    source?: string;
    platform?: 'youtube' | 'instagram' | 'tiktok';
}

export const data: CardInterface[] = [
    // 유튜브 쇼츠 8개
    { avatar: user1, thumbnail: image1, source: youtube, platform: 'youtube' },
    { avatar: user2, thumbnail: image2, source: youtube, platform: 'youtube' },
    { avatar: user3, thumbnail: image3, source: youtube, platform: 'youtube' },
    { avatar: user4, thumbnail: image4, source: youtube, platform: 'youtube' },
    { avatar: user5, thumbnail: image5, source: youtube, platform: 'youtube' },
    { avatar: avatar, thumbnail: image1, source: youtube, platform: 'youtube' },
    { avatar: user1, thumbnail: image2, source: youtube, platform: 'youtube' },
    { avatar: user2, thumbnail: image3, source: youtube, platform: 'youtube' },
    // 릴스 8개
    { avatar: user3, thumbnail: image4, source: insta, platform: 'instagram' },
    { avatar: user4, thumbnail: image5, source: insta, platform: 'instagram' },
    { avatar: user5, thumbnail: image1, source: insta, platform: 'instagram' },
    { avatar: user1, thumbnail: image2, source: insta, platform: 'instagram' },
    { avatar: user2, thumbnail: image3, source: insta, platform: 'instagram' },
    { avatar: avatar, thumbnail: image4, source: insta, platform: 'instagram' },
    { avatar: user3, thumbnail: image5, source: insta, platform: 'instagram' },
    { avatar: user4, thumbnail: image1, source: insta, platform: 'instagram' },
    // 틱톡 8개
    { avatar: user5, thumbnail: image2, source: tiktok, platform: 'tiktok' },
    { avatar: user1, thumbnail: image3, source: tiktok, platform: 'tiktok' },
    { avatar: user2, thumbnail: image4, source: tiktok, platform: 'tiktok' },
    { avatar: avatar, thumbnail: image5, source: tiktok, platform: 'tiktok' },
    { avatar: user3, thumbnail: image1, source: tiktok, platform: 'tiktok' },
    { avatar: user4, thumbnail: image2, source: tiktok, platform: 'tiktok' },
    { avatar: user5, thumbnail: image3, source: tiktok, platform: 'tiktok' },
    { avatar: user1, thumbnail: image4, source: tiktok, platform: 'tiktok' },
] 