import React from 'react';
import Footer from '../../component/footer/Footer';
import Header from '../../component/header/Header';
import './style.css';
import Fresh from '../../assets/image/fresh.svg';
import { useNavigate } from 'react-router-dom';

const MyPageMilestone = () => {

    const navigate = useNavigate();

    const data = [
        { label: "완료 프로젝트", value: "완료된 프로젝트 수", description: "하청 유저가 완료한 프로젝트의 개수를 나타냅니다." },
        { label: "진행 중 프로젝트", value: "진행 중인 프로젝트 수", description: "진행 중인 프로젝트의 개수와 상태를 보여줍니다." },
        { label: "평균 평가 점수", value: "프로젝트 평가 점수", description: "프로젝트 완료 후 받은 평균 평가 점수를 시각화합니다." },
        { label: "누적 정산 금액", value: "누적 정산 금액", description: "완료된 프로젝트 기준 누적 보상 금액을 보여줍니다." }
    ];

    const radarDescriptions = [
        "창의성, 납기 준수율, 영상 품질, 협업 응답속도, 피드백 반영률 등의 프로젝트 성과 지표가 표시될 예정입니다.",
        "AI 기반 성과 분석이 여기에 시각화되어 표시될 예정입니다."
    ];

    const tableDescription = "이 표에는 각 프로젝트의 이름, 상태(진행 중, 검수 중, 완료), 보상액, 지급일 등이 자동으로 표시될 예정입니다.";

    return (
        <div id='my'>
            <Header />
            <div className="body">

                <div className='account'>
                    <div>
                        <div className="avatar">
                            <span className="badge"></span>
                        </div>
                        <div className='info'>
                            <div className='na'>
                                <div className='bold'>사용자 이름</div>
                                <div className='sub'>@사용자ID</div>
                            </div>
                            <div className='locale'>
                                <div>등급 정보</div><div className='line' />
                                <div>누적 보상 및 진행 프로젝트 정보가 표시될 예정입니다.</div>
                            </div>
                        </div>
                    </div>
                    <div className='slist'>
                    <div className='Skeleton'onClick={() => navigate('/my')}>Deploy
                        <img src={Fresh} alt="Fresh" />
                    </div>
                    <div>계정 설정 옵션이 들어갈예정입니다.</div>
                </div>


                </div>
              

                <div className='count'>
                    {data.map((e, i) =>
                        <div key={i}>
                            <div>{e.label}</div>
                            <div>{e.value}</div>
                        </div>
                    )}
                </div>

                <div className='calist'>
                    <div className='left'>
                        {data.map((e, i) => (
                            <div key={i} className="card">
                                <div className="title">{e.label}</div>
                                <div className="description">{e.description}</div>
                            </div>
                        ))}
                    </div>

                    <div className='right'>
                        <div className='card4'>
                            <div className='top'>
                                <div className='title'>성과 분석 지표</div>
                                <div className='chart'>
                                    <div className='description'>
                                        이 영역에는 월별 프로젝트 성과 그래프가 표시될 예정입니다.<br />
                                        그래프는 월별 완료 프로젝트 수, 평균 평가 점수, 정산 금액 등을 시각화합니다.
                                    </div>
                                </div>
                                <div className='datalist'>
                                    <table className="summary-table">
                                        <thead>
                                            <tr>
                                                <th>월</th>
                                                <th>완료 프로젝트</th>
                                                <th>평균 점수</th>
                                                <th>정산 금액</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr><td>1월</td><td>—</td><td>—</td><td>—</td></tr>
                                            <tr><td>2월</td><td>—</td><td>—</td><td>—</td></tr>
                                            <tr><td>3월</td><td>—</td><td>—</td><td>—</td></tr>
                                        </tbody>
                                    </table>
                                    <p className="table-description">
                                        ※ 위 표에는 월별 성과 데이터가 자동으로 집계되어 표시될 예정입니다.
                                    </p>
                                </div>
                            </div>

                            <div className='bottom'>
                                <div className='fi'>
                                    <div className='title'>프로젝트 성과 요약</div>
                                    <div className="description">
                                        이 영역에는 프로젝트별 성과 요약 정보와 AI 분석 결과가 표시될 예정입니다.
                                    </div>
                                </div>

                                <div>
                                    <div>
                                        <div>정산 관련 정보가 표시될 예정입니다.</div>
                                        <div>예: 마지막 정산일, 다음 정산 예정일 등</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="project-history">
                    <h3>프로젝트 및 정산 내역</h3>
                    <p>{tableDescription}</p>
                    <div className="example-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>프로젝트명</th>
                                    <th>상태</th>
                                    <th>비고</th>
                                    <th>비고</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>예시 프로젝트 A</td><td>진행 중</td><td>—</td><td>—</td></tr>
                                <tr><td>예시 프로젝트 B</td><td>검수 중</td><td>—</td><td>—</td></tr>
                                <tr><td>예시 프로젝트 C</td><td>완료</td><td>₩—</td><td>—</td></tr>
                            </tbody>
                        </table>
                        <p className="example-description">
                            ※ 위 표는 실제 데이터가 아닌, 표시될 테이블 형식을 예시로 보여줍니다.
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MyPageMilestone;