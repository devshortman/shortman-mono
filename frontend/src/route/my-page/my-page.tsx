import React from 'react';
import Footer from '../../component/footer/footer';
import Header from '../../component/header/header';
import Tiktok from '../../assets/image/tiktok.svg';
import Youtube from '../../assets/image/youtube.svg';
import Insta from '../../assets/image/insta.svg';
import Normal from '../../assets/image/normal.svg';
import Bad from '../../assets/image/bad.svg';
import Smile from '../../assets/image/smile.svg';
import Good from '../../assets/image/good.svg';
import Fresh from '../../assets/image/fresh.svg';
import Up from '../../assets/image/up.svg';
import Down from '../../assets/image/down.svg';
import './style.css'
import RadarChartComponent from '../../component/spider-chart/spider-chart';
import { useNavigate } from 'react-router-dom';

const MyPage = () => {
    const navigate = useNavigate();

    const data = [
        { label: "팔로워", value: "7300K", icon: "up", status: "+0.97%", period: "30일 기준", description: "0.6896-1.22%는 유사한 채널의 평균적인 팔로워수 증가 등급을 나타내는 수치입니다.", face: Normal, grade: "일반", card: "2" },
        { label: "인게이지먼트 비율", value: "15.24%", icon: "up", status: "+0.97%", period: "10개 영상 기준", description: "6.00%-11.23%는 유사한 채널의 평균적인 참여율 등급을 나타내는 수치입니다.", face: Bad, grade: "일반", card: "" },
        { label: "조회수/구독자", value: "11.71%", icon: "up", status: "+0.97%", period: "10개 영상 기준", description: "0.80%-7.56%는 유사한 채널의 평균적인 조회수/구독자 등급을 나타내는 수치입니다.", face: Smile, grade: "우수", card: "" },
        { label: "평균 조회수", value: "855K", icon: "down", status: "+0.97%", period: "10개 영상 기준", description: "최신 10개 영상의 평균조회수입니다.", card: "3" }
    ]

    const dataList = [
        { label: "구독자 성장율", score: 3, color: "#26B6C6", grade: "일반" },
        { label: "콘텐츠 제작 빈도", score: 5, color: "linear-gradient(180deg, #A02EFF, #23DAEF)", grade: "최우수" },
        { label: "채널 품질", score: 4, color: "#C45EF9", grade: "우수" },
        { label: "인게이지먼트 비율", score: 4, color: "#C45EF9", grade: "우수" },
        { label: "구독자 충성도", score: 4, color: "#C45EF9", grade: "우수" },
    ];

    return (
        <div id='my'>
            <Header></Header>
            <div className="body">

                <div className='account'>
                    <div>
                        <div className="avatar" >
                            <span className="badge"></span>
                        </div>

                        <div className='info'>
                            <div className='na'>
                                <div className='bold'>domelipa</div>
                                <div className='sub'>@domelipa</div>
                            </div>

                            <div className='locale'>
                                <div>콜롬비아</div><div className='line' />
                                <div>스페인어</div><div className='line' />
                            </div>
                        </div>
                    </div>

                    <div className='slist'>
                        <div className='Skeleton' onClick={() => navigate('/my-sample')}>Concept
                            <img src={Fresh} alt="Fresh" />
                        </div>
                        <img src={Tiktok} alt="Tiktok" />
                        <img src={Youtube} alt="Youtube" />
                        <img src={Insta} alt="Insta" />
                    </div>
                </div>

                <div className='count'>
                    {data.map((e: any, i: number) =>
                        <div key={i}>
                            <div>{e?.label}</div>
                            <div>{e?.value}</div>
                        </div>
                    )}
                </div>

                <div className='calist'>
                    <div className='left'>
                        {data.map((e: any, i: number) => (
                            <div key={i} className={`card${e.card || ''}`}>
                                <div className="title">{e.label || ''}</div>
                                <div className="main-value">{e.value || ''}</div>
                                <div className="stats">
                                    {e.icon && <img src={e.icon === "up" ? Up : Down} alt={e.icon} className="trend-icon" />}
                                    <span
                                        className="percent"
                                        style={{ color: e.icon === "down" ? "#FA4F8C" : "#746BFA" }}
                                    >
                                        {e.status || ''}
                                    </span>
                                    <span className="period">{e.period || ''}</span>
                                </div>
                                <div className="description">{e.description || ''}</div>

                                {e.face &&
                                    <div className='face'>
                                        <img src={e.face} alt="face" />
                                        <div>{e.grade || ''}</div>
                                    </div>
                                }
                            </div>
                        ))}
                    </div>
                    <div className='right'>
                        <div className='card4'>
                            <div className='top'>
                                <div className='title'>Nox Score 지표</div>

                                <div className='chart'>
                                    <RadarChartComponent></RadarChartComponent>
                                    <div className='datalist'>
                                        {dataList.map((item, index) => (
                                            <div key={index} className="data-item">
                                                <div className="label">{item.label}</div>
                                                <div className="dots">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className={`dot ${i < item.score ? "active" : ""}`}
                                                            style={
                                                                i < item.score
                                                                    ? item.color.includes("linear")
                                                                        ? { background: item.color }
                                                                        : { backgroundColor: item.color }
                                                                    : {}
                                                            }
                                                        ></span>
                                                    ))}
                                                </div>
                                                <div className="grade"
                                                    style={
                                                        item.color.includes("linear")
                                                            ? {
                                                                background: item.color,
                                                                WebkitBackgroundClip: "text",
                                                                WebkitTextFillColor: "transparent",
                                                            }
                                                            : { color: item.color }
                                                    }>
                                                    {item.grade}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className='bottom'>
                                <div className='fi'>
                                    <div className='title'>Nox Score</div>
                                    <div className='rating'>
                                        <div className='rate'><span>4.29</span>/5</div>

                                        <div>별별별별</div>
                                    </div>
                                    <div className="description">
                                        NoxScore은 5개 지표데이터로 구성(구독자 성장율, 콘텐츠 제작 빈도, 채널 품질, 구독자출성도, 참여용)되며, 1부터 5까지 총 5개 등급으로 분류됩니다.
                                    </div>

                                    <div className='face'>
                                        <img src={Good} alt="face" />
                                        <div>최우수</div>
                                    </div>
                                </div>

                                <div>
                                    <div className='im'>
                                        <img src={Fresh} alt="Fresh" />
                                    </div>
                                    <div>
                                        <div>업데이트 : </div>
                                        <div>2024-03-02 11:56:19</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer></Footer>
        </div>
    );
};

export default MyPage;