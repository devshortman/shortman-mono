import React from 'react';
import Header from '../../component/header/header';
import Footer from '../../component/footer/footer';
import './style.css'

import Image1 from '../../assets/short_project_image/image_1.jpeg'
import Image2 from '../../assets/short_project_image/image_2.jpeg'
import Image3 from '../../assets/short_project_image/image_3.jpeg'
import Image4 from '../../assets/short_project_image/image_4.jpeg'
import Image5 from '../../assets/short_project_image/image_5.png'
import Image6 from '../../assets/short_project_image/image_6.webp'
import Image7 from '../../assets/short_project_image/image_7.jpg'
import Image8 from '../../assets/short_project_image/image_8.png'
import Image9 from '../../assets/short_project_image/image_9.jpg'
import Image10 from '../../assets/short_project_image/image_10.jpg'

import NotiveImage1 from '../../assets/short_project_image/notice.webp';
import NotiveImage2 from '../../assets/short_project_image/notice2.avif';
import NotiveImage3 from '../../assets/short_project_image/notice3.jpg';
import NotiveImage4 from '../../assets/short_project_image/notice4.png';

import bookmark from '../../assets/image/icon_btn_mark.svg'

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/autoplay';
import { Autoplay } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';

const Commerce = () => {

    const navigate = useNavigate();

    const slides = [
        { image: NotiveImage3, description: '프로젝트 1에 대한 설명입니다.', sub: "모집중입니다." },
        { image: NotiveImage4, description: '프로젝트 2에 대한 설명입니다.', sub: "모집중입니다." },
        { image: NotiveImage1, description: '프로젝트 3에 대한 설명입니다.', sub: "모집중입니다." },
        { image: NotiveImage2, description: '프로젝트 4에 대한 설명입니다.', sub: "모집중입니다." },
        { image: Image6, description: '프로젝트 6에 대한 설명입니다.', sub: "모집중입니다." },
    ];
    const card = [
        { image: NotiveImage3, date: "2025.12.20", description: '공지 4에 대한 설명입니다.', sub: "공지 카드입니다. 이곳에 간단한 내용을 작성하세요." },
        { image: NotiveImage4, date: "2025.12.01", description: '공지 5에 대한 설명입니다.', sub: "공지 카드입니다. 이곳에 간단한 내용을 작성하세요." },
        { image: NotiveImage1, date: "2025.11.26", description: '공지 6에 대한 설명입니다.', sub: "공지 카드입니다. 이곳에 간단한 내용을 작성하세요." },
        { image: NotiveImage2, date: "2025.12.31", description: '공지 3에 대한 설명입니다.', sub: "공지 카드입니다. 이곳에 간단한 내용을 작성하세요." },
    ];

    const prpject = [
        { company: "공급자 명이 들어가면_1", title: "프로젝트 알파 : 숏폼 캠페인", image: Image6, date: "2025.12.31", description: '프로젝트 3에 대한 설명입니다.', d_day: "4" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image1, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
        { company: "공급자 명이 들어가면_2", title: "프로젝트 베타 : 숏폼 캠페인", image: Image5, date: "2025.12.20", description: '프로젝트 4에 대한 설명입니다.', d_day: "3" },
        { company: "공급_회사_1", title: "프로젝트 감마 : 숏폼 캠페인", image: Image7, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "5" },
        { company: "공급자 명이 들어가면_2", title: "프로젝트 베타 : 숏폼 캠페인", image: Image9, date: "2025.12.20", description: '프로젝트 4에 대한 설명입니다.', d_day: "3" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image2, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image10, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
        { company: "공급_회사_1", title: "프로젝트 감마 : 숏폼 캠페인", image: Image7, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "5" },
        { company: "공급자 명이 들어가면_2", title: "프로젝트 베타 : 숏폼 캠페인", image: Image9, date: "2025.12.20", description: '프로젝트 4에 대한 설명입니다.', d_day: "3" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image10, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
        { company: "공급자 명이 들어가면_1", title: "프로젝트 알파 : 숏폼 캠페인", image: Image6, date: "2025.12.31", description: '프로젝트 3에 대한 설명입니다.', d_day: "4" },
        { company: "공급자 명이 들어가면_2", title: "프로젝트 베타 : 숏폼 캠페인", image: Image5, date: "2025.12.20", description: '프로젝트 4에 대한 설명입니다.', d_day: "3" },
        { company: "공급_회사_1", title: "프로젝트 감마 : 숏폼 캠페인", image: Image7, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "5" },
        { company: "공급자 명이 들어가면_2", title: "프로젝트 베타 : 숏폼 캠페인", image: Image9, date: "2025.12.20", description: '프로젝트 4에 대한 설명입니다.', d_day: "3" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image10, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image8, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
        { company: "공급_회사_1", title: "프로젝트 감마 : 숏폼 캠페인", image: Image7, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "5" },
        { company: "공급자 명이 들어가면_2", title: "프로젝트 베타 : 숏폼 캠페인", image: Image9, date: "2025.12.20", description: '프로젝트 4에 대한 설명입니다.', d_day: "3" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image10, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image8, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
        { company: "공급자 명이 들어가면_2", title: "프로젝트 베타 : 숏폼 캠페인", image: Image4, date: "2025.12.20", description: '프로젝트 4에 대한 설명입니다.', d_day: "3" },
        { company: "공급_회사_1", title: "프로젝트 감마 : 숏폼 캠페인", image: Image5, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "5" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image3, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
        { company: "공급자 명이 들어가면_1", title: "프로젝트 알파 : 숏폼 캠페인", image: Image6, date: "2025.12.31", description: '프로젝트 3에 대한 설명입니다.', d_day: "4" },
        { company: "공급자 명이 들어가면_2", title: "프로젝트 베타 : 숏폼 캠페인", image: Image4, date: "2025.12.20", description: '프로젝트 4에 대한 설명입니다.', d_day: "3" },
        { company: "공급_회사_1", title: "프로젝트 감마 : 숏폼 캠페인", image: Image5, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "5" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image3, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
        { company: "공급자 명이 들어가면_2", title: "프로젝트 베타 : 숏폼 캠페인", image: Image4, date: "2025.12.20", description: '프로젝트 4에 대한 설명입니다.', d_day: "3" },
        { company: "공급_회사_1", title: "프로젝트 감마 : 숏폼 캠페인", image: Image5, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "5" },
        { company: "공급_회사_2", title: "프로젝트 감마 : 숏폼 캠페인", image: Image3, date: "2025.12.01", description: '프로젝트 5에 대한 설명입니다.', d_day: "16" },
    ];

    return (
        <div id='commerce'>
            <Header></Header>
            <div className='container'>
                <div className='fir'>

                    <div className='image_swiper'>
                        <Swiper
                            slidesPerView={1}
                            loop={true}
                            autoplay={{ delay: 2500, disableOnInteraction: false }}
                            modules={[Autoplay]}
                        >
                            {slides.map((slide, index) => (
                                <SwiperSlide key={index} style={{ borderRadius: 10 }}>
                                    <div className="slide_container">
                                        <div className="image_wrapper">
                                            <img
                                                src={slide.image}
                                                alt={`slide-${index}`}
                                                className="slide_image"
                                            />
                                        </div>
                                        <div className="slide_description">
                                            {slide.description}
                                        </div>
                                        <div className="slide_sub">
                                            {slide.sub}
                                        </div>

                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>

                    <div className='acc'>
                        <div className='apply'>
                            <div>
                                <div className='description'>크리에이터 지원하기</div>
                                <div className='sub'>숏만랩은 숏폼 프로젝트를 수행할 크리에이터를 모집중입니다.</div>
                                <div className='sub'>당신의 아이디어가 세상을 바꿀 다음 숏폼이 될 수 있습니다.</div>
                                <div className='sub'>지금 바로 숏만랩 크리에이터로 참여해보세요</div>
                            </div>
                            <div className='btn_wrap'>
                                <div className="btn" onClick={() => navigate('/join')}>지금 합류하기</div>
                                <div className="btn on"onClick={() => navigate('/my')}>마이페이지</div>
                            </div>
                        </div>

                        <div className='count'>
                            <div className='description'>Notice</div>
                            <div className='wr'>
                                <div className='sub'>현재 모집중인 프로젝트</div>
                                <div className='num'>1,249개</div>
                            </div>
                            {/* <div className='btn'>asd</div> */}
                        </div>

                    </div>
                </div>

                <div className='notice_title'>
                    <div>공지사항</div>
                </div>

                <div className='notice_card_wrap'>
                    {card?.map((e: any, i: number) =>
                        <div className='notice_card' key={i}>
                            <div className='image_wrap'>
                                <img src={e?.image} alt={`image${i}`} />
                            </div>

                            <div className='des_wrap'>
                                <div>
                                    <div className='description'>{e.description}</div>
                                    <div className='sub'>{e.sub}</div>
                                    <div className='date'>{e.date}</div>
                                </div>

                                <div className='detail'>
                                    자세히 보기 {">"}
                                </div>

                            </div>
                        </div>
                    )}
                </div>


                <div className='notice_title' style={{marginTop : 100}}>
                    <div>프로젝트</div>
                </div>

                <div className='project_wrap'>
                    {prpject.map((e: any, i: number) =>
                        <div key={i} className='project_card'>
                            <div className='project_image_wrap'>
                                <div className='dday'>D - {e?.d_day}</div>
                                <img src={e?.image} alt={`image${i}`} />
                            </div>

                            <div className='description_wrap'>
                                <div className='titleWrap'>
                                    <div className='title'>{e.title}</div>
                                    <img src={bookmark} alt="" />
                                </div>
                                <div className='sub'>{e.company}</div>
                                <div className='mo'>모집중</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Footer></Footer>

        </div>
    );
};

export default Commerce;