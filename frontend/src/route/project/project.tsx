import { useState } from 'react';
import Header from '../../component/header/Header';
import Footer from '../../component/footer/Footer';
import './style.css';

type ProjectStatus = '진행중' | '대기중' | '완료';

interface ProjectTask {
  title: string;
  assignee: string;
  done: boolean;
}

interface ProjectCard {
  id: number;
  title: string;
  sub: string;
  status: ProjectStatus;
  deadline?: string;
  progress?: number;
  tasks?: ProjectTask[];
}

const PROJECT_CARDS: ProjectCard[] = [
  {
    id: 1,
    title: '프로젝트 카드 #1',
    sub: '브랜드 A 숏폼 캠페인',
    status: '진행중',
    deadline: '2024-12-15',
    progress: 45,
    tasks: [
      { title: '기획서 작성', assignee: '김민수', done: true },
      { title: '촬영 진행', assignee: '이지은', done: false },
    ],
  },
  {
    id: 2,
    title: '프로젝트 카드 #2',
    sub: '인플루언서 협업 프로젝트',
    status: '완료',
    deadline: '2024-11-30',
    progress: 100,
    tasks: [
      { title: '인플루언서 섭외', assignee: '박준혁', done: true },
      { title: '계약 체결', assignee: '김민수', done: true },
      { title: '콘텐츠 제작', assignee: '이지은', done: true },
    ],
  },
  {
    id: 3,
    title: '프로젝트 카드 #3',
    sub: '트렌드 분석 리포트 Q4',
    status: '대기중',
    deadline: '2025-01-10',
    progress: 0,
    tasks: [],
  },
  {
    id: 4,
    title: '프로젝트 카드 #4',
    sub: '신규 플랫폼 런칭 준비',
    status: '진행중',
    deadline: '2024-12-31',
    progress: 60,
    tasks: [
      { title: '요구사항 정리', assignee: '박준혁', done: true },
      { title: 'UI 디자인', assignee: '이지은', done: false },
    ],
  },
  {
    id: 5,
    title: '프로젝트 카드 #5',
    sub: '브랜드 B 마케팅',
    status: '완료',
    deadline: '2024-11-20',
    progress: 100,
    tasks: [
      { title: '캠페인 기획', assignee: '김민수', done: true },
      { title: '촬영 및 편집', assignee: '이지은', done: true },
    ],
  },
  {
    id: 6,
    title: '프로젝트 카드 #6',
    sub: '월간 리포트 작성',
    status: '대기중',
    deadline: '2025-01-15',
    progress: 0,
    tasks: [],
  },
  {
    id: 7,
    title: '프로젝트 카드 #7',
    sub: '크리에이터 교육 프로그램',
    status: '진행중',
    deadline: '2024-12-20',
    progress: 30,
    tasks: [
      { title: '커리큘럼 설계', assignee: '박준혁', done: true },
      { title: '강사 섭외', assignee: '김민수', done: false },
    ],
  },
  {
    id: 8,
    title: '프로젝트 카드 #8',
    sub: '연말 결산 준비',
    status: '완료',
    deadline: '2024-11-30',
    progress: 100,
    tasks: [
      { title: '정산 데이터 수집', assignee: '이지은', done: true },
      { title: '보고서 작성', assignee: '김민수', done: true },
    ],
  },
];

type TabId = '전체' | '진행중' | '대기중' | '완료';

const DETAIL_TABS = ['업무', '자료', '대화', '보고서'] as const;

const Project = () => {
  const [activeTab, setActiveTab] = useState<TabId>('전체');
  const [selectedCard, setSelectedCard] = useState<ProjectCard | null>(null);
  const [detailTab, setDetailTab] = useState<(typeof DETAIL_TABS)[number]>('업무');

  const filteredCards =
    activeTab === '전체'
      ? PROJECT_CARDS
      : PROJECT_CARDS.filter((card) => card.status === activeTab);

  const stats = {
    inProgress: PROJECT_CARDS.filter((c) => c.status === '진행중').length,
    completed: PROJECT_CARDS.filter((c) => c.status === '완료').length,
    avgProgress: 66,
  };

  const tabs: TabId[] = ['전체', '진행중', '대기중', '완료'];

  return (
    <div id="project" className="project">
      <Header />
      <div className="project__body">
        <div className="project__title">프로젝트 관리 시스템</div>
        <div className="project__line" />
        <div className="project__stats-grid">
          <div className="project__stat-box">
            <p className="project__stat-label">진행 중인 프로젝트</p>
            <p className="project__stat-value">{stats.inProgress}</p>
          </div>
          <div className="project__stat-box">
            <p className="project__stat-label">완료된 프로젝트</p>
            <p className="project__stat-value">{stats.completed}</p>
          </div>
          <div className="project__stat-box">
            <p className="project__stat-label">평균 진행률</p>
            <p className="project__stat-value">{stats.avgProgress}%</p>
          </div>
        </div>
        <div className="project__header">
          <h2 className="project__header-title">프로젝트</h2>
          <div className="project__tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`project__tab-button ${activeTab === tab ? 'project__tab-button--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="project__grid">
          {filteredCards.map((card) => (
            <div
              key={card.id}
              className="project__card"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCard(card)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedCard(card)}
            >
              <div className="project__card-inner">
                {card.title}
                <br />
                <small>({card.sub})</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCard && (
        <div className="project__detail-panel">
          <div className="project__detail-header">
            <div className="project__detail-header-row">
              <h3 className="project__detail-title">{selectedCard.sub}</h3>
              <button
                type="button"
                className="project__detail-close"
                onClick={() => setSelectedCard(null)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="project__detail-meta">
              <span
                className={`project__status-badge project__status-badge--${selectedCard.status === '완료' ? 'completed' : selectedCard.status === '진행중' ? 'in-progress' : 'pending'}`}
              >
                {selectedCard.status}
              </span>
              {selectedCard.deadline && (
                <span className="project__detail-deadline">
                  마감: {selectedCard.deadline}
                </span>
              )}
            </div>
            <div className="project__detail-progress-wrap">
              <div className="project__progress-bar">
                <div
                  className="project__progress-fill"
                  style={{ width: `${selectedCard.progress ?? 0}%` }}
                />
              </div>
              <p className="project__progress-text">
                {selectedCard.progress ?? 0}% 완료
              </p>
            </div>
          </div>
          <div className="project__detail-tabs">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`project__detail-tab ${detailTab === tab ? 'project__detail-tab--active' : ''}`}
                onClick={() => setDetailTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="project__detail-content">
            {detailTab === '업무' && (
              <div>
                <div className="project__tasks-header">
                  <h4 className="project__tasks-title">업무 목록</h4>
                  <button type="button" className="project__tasks-add-btn">
                    + 업무 추가
                  </button>
                </div>
                <div className="project__tasks-list">
                  {(selectedCard.tasks ?? []).length > 0 ? (
                    (selectedCard.tasks ?? []).map((task, i) => (
                      <div
                        key={i}
                        className={`project__task-item ${task.done ? 'project__task-item--done' : ''}`}
                      >
                        <input
                          readOnly
                          className="project__task-checkbox"
                          type="checkbox"
                          checked={task.done}
                        />
                        <div className="project__task-body">
                          <p className="project__task-title">{task.title}</p>
                          <p className="project__task-assignee">
                            담당: {task.assignee}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="project__tasks-empty">등록된 업무가 없습니다.</p>
                  )}
                </div>
              </div>
            )}
            {detailTab === '자료' && (
              <p className="project__detail-placeholder">자료 탭 내용</p>
            )}
            {detailTab === '대화' && (
              <p className="project__detail-placeholder">대화 탭 내용</p>
            )}
            {detailTab === '보고서' && (
              <p className="project__detail-placeholder">보고서 탭 내용</p>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Project;
