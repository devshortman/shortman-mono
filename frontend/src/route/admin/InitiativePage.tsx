import { useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { authFetch } from './admin';

type Status = 'draft' | 'recruiting' | 'in_progress' | 'review' | 'closed';

interface Initiative {
  id: number;
  title: string;
  description?: string;
  capacity_min: number;
  capacity_max: number;
  deadline?: string;
  status: Status;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface Demo {
  id: number;
  title?: string;
  video_url: string;
  thumbnail?: string;
  description?: string;
  sort_order: number;
}

interface Notice {
  id: number;
  notice_type: 'notice' | 'checklist' | 'guide';
  title: string;
  content?: string;
  sort_order: number;
}

interface Submission {
  id: number;
  participant_id: number;
  video_url: string;
  thumbnail?: string;
  title?: string;
  views?: number;
  likes?: number;
  comments?: number;
  is_hidden: boolean;
  submitted_at?: string;
}

interface Stats {
  initiative_id: number;
  participants_total: number;
  participants_by_status: Record<string, number>;
  submissions_total: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
}

const STATUSES: Status[] = ['draft', 'recruiting', 'in_progress', 'review', 'closed'];
const NOTICE_TYPES = ['notice', 'checklist', 'guide'] as const;

export default function InitiativePage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 신규 폼
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        filterStatus === 'all'
          ? API_ENDPOINTS.ADMIN_INITIATIVES
          : `${API_ENDPOINTS.ADMIN_INITIATIVES}?status=${filterStatus}`;
      const res = await authFetch(url);
      if (!res.ok) {
        setError(`목록 조회 실패 (${res.status})`);
        return;
      }
      const data = await res.json();
      setInitiatives(data.items || []);
    } catch {
      setError('서버 통신 오류');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await authFetch(API_ENDPOINTS.ADMIN_INITIATIVES, {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          status: 'draft',
        }),
      });
      if (res.ok) {
        setNewTitle('');
        fetchList();
      }
    } finally {
      setAdding(false);
    }
  };

  const updateStatus = async (id: number, status: Status) => {
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_INITIATIVES}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchList();
    } catch {}
  };

  const deleteInitiative = async (id: number, title: string) => {
    if (!confirm(`"${title}" 삭제하시겠습니까? 데모/공지/참가자 모두 함께 삭제됩니다.`)) return;
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_INITIATIVES}/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (selectedId === id) setSelectedId(null);
        fetchList();
      }
    } catch {}
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>Initiative 관리</h2>
        <div className="admin-filter">
          <label>status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
          >
            <option value="all">전체</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form className="admin-add-form" onSubmit={handleCreate}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="새 Initiative 제목 (생성 후 상세에서 추가 설정)"
          required
        />
        <button type="submit" disabled={adding}>
          {adding ? '생성 중...' : '신규 생성'}
        </button>
      </form>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p>로딩 중...</p>}

      {initiatives.length === 0 && !loading && (
        <p className="admin-empty">등록된 Initiative가 없습니다.</p>
      )}

      <div className="admin-initiative-list">
        {initiatives.map((it) => (
          <div
            key={it.id}
            className={`admin-initiative-card ${selectedId === it.id ? 'selected' : ''}`}
          >
            <div className="admin-initiative-head">
              <div>
                <h3>{it.title}</h3>
                <div className="admin-initiative-meta">
                  #{it.id} · {it.capacity_min}~{it.capacity_max}명 ·{' '}
                  {it.deadline ? new Date(it.deadline).toLocaleDateString() : 'no deadline'}
                </div>
              </div>
              <div className="admin-initiative-actions">
                <select
                  value={it.status}
                  onChange={(e) => updateStatus(it.id, e.target.value as Status)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSelectedId(selectedId === it.id ? null : it.id)}
                >
                  {selectedId === it.id ? '닫기' : '상세'}
                </button>
                <button
                  className="admin-danger"
                  onClick={() => deleteInitiative(it.id, it.title)}
                >
                  삭제
                </button>
              </div>
            </div>
            {it.description && (
              <p className="admin-initiative-desc">{it.description}</p>
            )}

            {selectedId === it.id && <InitiativeDetail initiativeId={it.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------
// Detail
// ------------------------------------------------------
function InitiativeDetail({ initiativeId }: { initiativeId: number }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // 데모 폼
  const [demoUrl, setDemoUrl] = useState('');
  const [demoTitle, setDemoTitle] = useState('');

  // 공지 폼
  const [noticeType, setNoticeType] = useState<'notice' | 'checklist' | 'guide'>('notice');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [s, d, n, sub] = await Promise.all([
        authFetch(`${API_ENDPOINTS.ADMIN_INITIATIVES}/${initiativeId}/stats`),
        authFetch(`${API_ENDPOINTS.ADMIN_INITIATIVES}/${initiativeId}/demos`),
        authFetch(`${API_ENDPOINTS.ADMIN_INITIATIVES}/${initiativeId}/notices`),
        authFetch(`${API_ENDPOINTS.ADMIN_INITIATIVES}/${initiativeId}/submissions`),
      ]);
      if (s.ok) setStats(await s.json());
      if (d.ok) {
        const j = await d.json();
        setDemos(j.items || []);
      }
      if (n.ok) {
        const j = await n.json();
        setNotices(j.items || []);
      }
      if (sub.ok) {
        const j = await sub.json();
        setSubmissions(j.items || []);
      }
    } catch {}
  }, [initiativeId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUrl.trim()) return;
    try {
      const res = await authFetch(
        `${API_ENDPOINTS.ADMIN_INITIATIVES}/${initiativeId}/demos`,
        {
          method: 'POST',
          body: JSON.stringify({
            video_url: demoUrl.trim(),
            title: demoTitle.trim() || undefined,
            sort_order: demos.length,
          }),
        }
      );
      if (res.ok) {
        setDemoUrl('');
        setDemoTitle('');
        fetchAll();
      }
    } catch {}
  };

  const deleteDemo = async (id: number) => {
    if (!confirm('데모 삭제?')) return;
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_DEMOS}/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchAll();
    } catch {}
  };

  const addNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim()) return;
    try {
      const res = await authFetch(
        `${API_ENDPOINTS.ADMIN_INITIATIVES}/${initiativeId}/notices`,
        {
          method: 'POST',
          body: JSON.stringify({
            notice_type: noticeType,
            title: noticeTitle.trim(),
            content: noticeContent.trim() || undefined,
            sort_order: notices.length,
          }),
        }
      );
      if (res.ok) {
        setNoticeTitle('');
        setNoticeContent('');
        fetchAll();
      }
    } catch {}
  };

  const deleteNotice = async (id: number) => {
    if (!confirm('공지 삭제?')) return;
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_NOTICES}/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchAll();
    } catch {}
  };

  const toggleSubmissionHidden = async (sub: Submission) => {
    try {
      const res = await authFetch(
        `${API_ENDPOINTS.ADMIN_SUBMISSIONS}/${sub.id}/hidden`,
        {
          method: 'PATCH',
          body: JSON.stringify({ is_hidden: !sub.is_hidden }),
        }
      );
      if (res.ok) fetchAll();
    } catch {}
  };

  return (
    <div className="admin-initiative-detail">
      {/* 통계 */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="stat-box">
            <div className="stat-label">참가자</div>
            <div className="stat-value">{stats.participants_total}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">제출물</div>
            <div className="stat-value">{stats.submissions_total}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">총 조회수</div>
            <div className="stat-value">{stats.total_views.toLocaleString()}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">총 좋아요</div>
            <div className="stat-value">{stats.total_likes.toLocaleString()}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">총 댓글</div>
            <div className="stat-value">{stats.total_comments.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* 데모 */}
      <section className="admin-section">
        <h4>데모 컨텐츠</h4>
        <form className="admin-inline-form" onSubmit={addDemo}>
          <input
            type="text"
            value={demoTitle}
            onChange={(e) => setDemoTitle(e.target.value)}
            placeholder="제목 (선택)"
          />
          <input
            type="text"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="영상 URL"
            required
            style={{ flex: 1 }}
          />
          <button type="submit">추가</button>
        </form>
        <ul className="admin-list-simple">
          {demos.map((d) => (
            <li key={d.id}>
              <a href={d.video_url} target="_blank" rel="noreferrer">
                {d.title || d.video_url}
              </a>
              <button className="admin-danger" onClick={() => deleteDemo(d.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 공지 */}
      <section className="admin-section">
        <h4>공지/체크리스트</h4>
        <form className="admin-inline-form" onSubmit={addNotice}>
          <select
            value={noticeType}
            onChange={(e) => setNoticeType(e.target.value as typeof noticeType)}
          >
            {NOTICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={noticeTitle}
            onChange={(e) => setNoticeTitle(e.target.value)}
            placeholder="제목"
            required
            style={{ flex: 1 }}
          />
          <input
            type="text"
            value={noticeContent}
            onChange={(e) => setNoticeContent(e.target.value)}
            placeholder="내용 (선택)"
            style={{ flex: 2 }}
          />
          <button type="submit">추가</button>
        </form>
        <ul className="admin-list-simple">
          {notices.map((n) => (
            <li key={n.id}>
              <span className="tag">{n.notice_type}</span>
              <strong>{n.title}</strong>
              {n.content && <span className="admin-initiative-desc"> — {n.content}</span>}
              <button className="admin-danger" onClick={() => deleteNotice(n.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 제출물 */}
      <section className="admin-section">
        <h4>제출물</h4>
        {submissions.length === 0 ? (
          <p className="admin-empty">제출물 없음</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>id</th>
                <th>title</th>
                <th>views</th>
                <th>likes</th>
                <th>comments</th>
                <th>action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className={sub.is_hidden ? 'inactive' : ''}>
                  <td>{sub.id}</td>
                  <td>
                    <a href={sub.video_url} target="_blank" rel="noreferrer">
                      {sub.title || sub.video_url}
                    </a>
                  </td>
                  <td>{sub.views?.toLocaleString() ?? 0}</td>
                  <td>{sub.likes?.toLocaleString() ?? 0}</td>
                  <td>{sub.comments?.toLocaleString() ?? 0}</td>
                  <td>
                    <button
                      className={`pill ${sub.is_hidden ? 'on' : 'off'}`}
                      onClick={() => toggleSubmissionHidden(sub)}
                    >
                      {sub.is_hidden ? '숨김 해제' : '숨김'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
