import { useEffect, useState, useCallback } from 'react';
import Header from '../../component/header/header';
import Footer from '../../component/footer/footer';
import { API_ENDPOINTS } from '../../config/api';
import './admin.css';

// ------------------------------------------------------
// Types
// ------------------------------------------------------
type Region = 'korea' | 'global' | 'china';

interface Keyword {
  id: number;
  region: Region;
  keyword: string;
  is_fixed: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

type MenuKey = 'keywords' | 'schedule' | 'shorts' | 'initiative' | 'users' | 'supaboard';

const MENU_ITEMS: { key: MenuKey; label: string; enabled: boolean }[] = [
  { key: 'keywords',   label: '키워드 풀',       enabled: true  },
  { key: 'schedule',   label: '스크래퍼 스케줄', enabled: true  },
  { key: 'shorts',     label: '수집 영상 관리',  enabled: false },
  { key: 'initiative', label: 'Initiative',      enabled: false },
  { key: 'users',      label: '사용자 관리',     enabled: false },
  { key: 'supaboard',  label: 'Supa-board',      enabled: false },
];

const TOKEN_KEY = 'admin_token';

// ------------------------------------------------------
// Token Helpers
// ------------------------------------------------------
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...init, headers });
}

// ------------------------------------------------------
// Login Form
// ------------------------------------------------------
interface LoginFormProps {
  onLoginSuccess: () => void;
}

function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body = new URLSearchParams();
      body.append('username', username);
      body.append('password', password);

      const res = await fetch(`${API_ENDPOINTS.ADMIN_LOGIN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.detail === 'string' ? data.detail : '로그인 실패');
        return;
      }

      const data = await res.json();
      setToken(data.access_token);
      onLoginSuccess();
    } catch {
      setError('서버 통신 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-box">
        <h1>어드민 로그인</h1>
        <form onSubmit={handleSubmit}>
          <label>
            <span>아이디</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------
// Keywords Page
// ------------------------------------------------------
function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [filterRegion, setFilterRegion] = useState<Region | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 추가 폼
  const [newRegion, setNewRegion] = useState<Region>('korea');
  const [newKeyword, setNewKeyword] = useState('');
  const [newIsFixed, setNewIsFixed] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        filterRegion === 'all'
          ? API_ENDPOINTS.ADMIN_KEYWORDS
          : `${API_ENDPOINTS.ADMIN_KEYWORDS}?region=${filterRegion}`;
      const res = await authFetch(url);
      if (!res.ok) {
        setError(`목록 조회 실패 (${res.status})`);
        return;
      }
      const data = await res.json();
      setKeywords(data.items || []);
    } catch {
      setError('서버 통신 오류');
    } finally {
      setLoading(false);
    }
  }, [filterRegion]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await authFetch(API_ENDPOINTS.ADMIN_KEYWORDS, {
        method: 'POST',
        body: JSON.stringify({
          region: newRegion,
          keyword: newKeyword.trim(),
          is_fixed: newIsFixed,
          is_active: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.detail === 'string' ? data.detail : '추가 실패');
        return;
      }
      setNewKeyword('');
      setNewIsFixed(false);
      fetchKeywords();
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (kw: Keyword) => {
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_KEYWORDS}/${kw.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !kw.is_active }),
      });
      if (res.ok) fetchKeywords();
    } catch {}
  };

  const toggleFixed = async (kw: Keyword) => {
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_KEYWORDS}/${kw.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_fixed: !kw.is_fixed }),
      });
      if (res.ok) fetchKeywords();
    } catch {}
  };

  const deleteKeyword = async (kw: Keyword) => {
    if (!confirm(`"${kw.keyword}" 삭제하시겠습니까?`)) return;
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_KEYWORDS}/${kw.id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchKeywords();
    } catch {}
  };

  // region별 그룹핑
  const groupedKeywords: Record<Region, Keyword[]> = {
    korea: [],
    global: [],
    china: [],
  };
  keywords.forEach((kw) => {
    if (groupedKeywords[kw.region]) groupedKeywords[kw.region].push(kw);
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>키워드 풀</h2>
        <div className="admin-filter">
          <label>region</label>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value as Region | 'all')}
          >
            <option value="all">전체</option>
            <option value="korea">korea</option>
            <option value="global">global</option>
            <option value="china">china</option>
          </select>
        </div>
      </div>

      {/* 추가 폼 */}
      <form className="admin-add-form" onSubmit={handleAdd}>
        <select
          value={newRegion}
          onChange={(e) => setNewRegion(e.target.value as Region)}
        >
          <option value="korea">korea</option>
          <option value="global">global</option>
          <option value="china">china</option>
        </select>
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="새 키워드"
          required
        />
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={newIsFixed}
            onChange={(e) => setNewIsFixed(e.target.checked)}
          />
          <span>고정 키워드</span>
        </label>
        <button type="submit" disabled={adding}>
          {adding ? '추가 중...' : '추가'}
        </button>
      </form>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p>로딩 중...</p>}

      {/* 목록: region별 그룹 */}
      {(['korea', 'global', 'china'] as Region[]).map((region) => {
        const list = groupedKeywords[region];
        if (filterRegion !== 'all' && filterRegion !== region) return null;
        if (list.length === 0 && filterRegion === region) {
          return (
            <div key={region} className="admin-region-group">
              <h3>{region}</h3>
              <p className="admin-empty">키워드 없음</p>
            </div>
          );
        }
        if (list.length === 0) return null;

        return (
          <div key={region} className="admin-region-group">
            <h3>
              {region} <span className="admin-count">({list.length})</span>
            </h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>id</th>
                  <th>keyword</th>
                  <th>fixed</th>
                  <th>active</th>
                  <th>action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((kw) => (
                  <tr key={kw.id} className={!kw.is_active ? 'inactive' : ''}>
                    <td>{kw.id}</td>
                    <td>{kw.keyword}</td>
                    <td>
                      <button
                        className={`pill ${kw.is_fixed ? 'on' : 'off'}`}
                        onClick={() => toggleFixed(kw)}
                      >
                        {kw.is_fixed ? 'YES' : 'no'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`pill ${kw.is_active ? 'on' : 'off'}`}
                        onClick={() => toggleActive(kw)}
                      >
                        {kw.is_active ? 'ON' : 'off'}
                      </button>
                    </td>
                    <td>
                      <button
                        className="admin-danger"
                        onClick={() => deleteKeyword(kw)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------
// Schedule Page
// ------------------------------------------------------
interface Schedule {
  id: number;
  account: string;
  weekday: number;
  mode: 'full' | 'light' | 'off';
  region: Region;
  lang: string;
  sleep_min: number;
  sleep_max: number;
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const MODES: ('full' | 'light' | 'off')[] = ['full', 'light', 'off'];

function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 신규 계정 추가 폼
  const [newAccount, setNewAccount] = useState('');
  const [newRegion, setNewRegion] = useState<Region>('korea');
  const [newLang, setNewLang] = useState('ko');
  const [newSleepMin, setNewSleepMin] = useState(5.0);
  const [newSleepMax, setNewSleepMax] = useState(17.0);
  const [adding, setAdding] = useState(false);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(API_ENDPOINTS.ADMIN_SCHEDULES);
      if (!res.ok) {
        setError(`목록 조회 실패 (${res.status})`);
        return;
      }
      const data = await res.json();
      setSchedules(data.items || []);
    } catch {
      setError('서버 통신 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // 계정별 그룹핑
  const accountMap: Record<string, Schedule[]> = {};
  schedules.forEach((s) => {
    if (!accountMap[s.account]) accountMap[s.account] = [];
    accountMap[s.account].push(s);
  });
  const accounts = Object.keys(accountMap).sort();

  const updateMode = async (sch: Schedule, newMode: 'full' | 'light' | 'off') => {
    if (sch.mode === newMode) return;
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_SCHEDULES}/${sch.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ mode: newMode }),
      });
      if (res.ok) fetchSchedules();
    } catch {}
  };

  const updateSleep = async (account: string, sleep_min: number, sleep_max: number) => {
    // 해당 계정의 모든 weekday를 한꺼번에 갱신
    const accountSchedules = accountMap[account] || [];
    try {
      await Promise.all(
        accountSchedules.map((s) =>
          authFetch(`${API_ENDPOINTS.ADMIN_SCHEDULES}/${s.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ sleep_min, sleep_max }),
          })
        )
      );
      fetchSchedules();
    } catch {}
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.trim()) return;
    setAdding(true);
    setError(null);
    try {
      // 7일치 한 번에 upsert
      await Promise.all(
        Array.from({ length: 7 }, (_, weekday) =>
          authFetch(API_ENDPOINTS.ADMIN_SCHEDULES, {
            method: 'POST',
            body: JSON.stringify({
              account: newAccount.trim(),
              weekday,
              mode: 'off',
              region: newRegion,
              lang: newLang,
              sleep_min: newSleepMin,
              sleep_max: newSleepMax,
            }),
          })
        )
      );
      setNewAccount('');
      fetchSchedules();
    } catch {
      setError('계정 추가 실패');
    } finally {
      setAdding(false);
    }
  };

  const deleteAccount = async (account: string) => {
    if (!confirm(`"${account}" 계정의 모든 스케줄을 삭제하시겠습니까?`)) return;
    try {
      const res = await authFetch(
        `${API_ENDPOINTS.ADMIN_SCHEDULES}/account/${encodeURIComponent(account)}`,
        { method: 'DELETE' }
      );
      if (res.ok) fetchSchedules();
    } catch {}
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>스크래퍼 스케줄</h2>
      </div>

      {/* 계정 추가 */}
      <form className="admin-add-form" onSubmit={handleAddAccount}>
        <input
          type="text"
          value={newAccount}
          onChange={(e) => setNewAccount(e.target.value)}
          placeholder="새 계정명 (yml의 ACCOUNT_NAME과 일치)"
          required
        />
        <select
          value={newRegion}
          onChange={(e) => setNewRegion(e.target.value as Region)}
        >
          <option value="korea">korea</option>
          <option value="global">global</option>
          <option value="china">china</option>
        </select>
        <select value={newLang} onChange={(e) => setNewLang(e.target.value)}>
          <option value="ko">ko</option>
          <option value="en">en</option>
          <option value="zh-CN">zh-CN</option>
        </select>
        <input
          type="number"
          step="0.1"
          value={newSleepMin}
          onChange={(e) => setNewSleepMin(parseFloat(e.target.value))}
          placeholder="sleep_min"
          style={{ width: 90 }}
        />
        <input
          type="number"
          step="0.1"
          value={newSleepMax}
          onChange={(e) => setNewSleepMax(parseFloat(e.target.value))}
          placeholder="sleep_max"
          style={{ width: 90 }}
        />
        <button type="submit" disabled={adding}>
          {adding ? '추가 중...' : '계정 추가'}
        </button>
      </form>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p>로딩 중...</p>}

      {/* 계정별 스케줄 그리드 */}
      {accounts.length === 0 && !loading && (
        <p className="admin-empty">등록된 계정이 없습니다.</p>
      )}

      {accounts.map((account) => {
        const list = accountMap[account].sort((a, b) => a.weekday - b.weekday);
        const first = list[0];
        if (!first) return null;

        return (
          <div key={account} className="admin-region-group">
            <div className="admin-account-header">
              <h3>
                {account}
                <span className="admin-count">
                  {' '}
                  · {first.region} · {first.lang}
                </span>
              </h3>
              <button
                className="admin-danger"
                onClick={() => deleteAccount(account)}
              >
                계정 삭제
              </button>
            </div>

            {/* 요일별 모드 */}
            <table className="admin-table admin-schedule-table">
              <thead>
                <tr>
                  {WEEKDAYS.map((w) => (
                    <th key={w}>{w}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {list.map((sch) => (
                    <td key={sch.id} className="admin-schedule-cell">
                      <div className="admin-mode-buttons">
                        {MODES.map((m) => (
                          <button
                            key={m}
                            className={`mode-btn ${m} ${sch.mode === m ? 'active' : ''}`}
                            onClick={() => updateMode(sch, m)}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* 슬립 설정 */}
            <SleepEditor
              account={account}
              initMin={first.sleep_min}
              initMax={first.sleep_max}
              onSave={updateSleep}
            />
          </div>
        );
      })}
    </div>
  );
}

interface SleepEditorProps {
  account: string;
  initMin: number;
  initMax: number;
  onSave: (account: string, min: number, max: number) => void;
}

function SleepEditor({ account, initMin, initMax, onSave }: SleepEditorProps) {
  const [min, setMin] = useState(initMin);
  const [max, setMax] = useState(initMax);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setMin(initMin);
    setMax(initMax);
    setDirty(false);
  }, [initMin, initMax]);

  return (
    <div className="admin-sleep-editor">
      <span className="sleep-label">slot sleep (sec):</span>
      <input
        type="number"
        step="0.1"
        value={min}
        onChange={(e) => {
          setMin(parseFloat(e.target.value));
          setDirty(true);
        }}
      />
      <span>~</span>
      <input
        type="number"
        step="0.1"
        value={max}
        onChange={(e) => {
          setMax(parseFloat(e.target.value));
          setDirty(true);
        }}
      />
      <button
        className="sleep-save"
        disabled={!dirty}
        onClick={() => {
          onSave(account, min, max);
          setDirty(false);
        }}
      >
        저장
      </button>
    </div>
  );
}

// ------------------------------------------------------
// Disabled Page (placeholder)
// ------------------------------------------------------
function DisabledPage({ label }: { label: string }) {
  return (
    <div className="admin-page admin-disabled-page">
      <h2>{label}</h2>
      <p className="admin-empty">준비 중입니다.</p>
    </div>
  );
}

// ------------------------------------------------------
// Admin Layout
// ------------------------------------------------------
interface AdminLayoutProps {
  username: string;
  onLogout: () => void;
}

function AdminLayout({ username, onLogout }: AdminLayoutProps) {
  const [activeMenu, setActiveMenu] = useState<MenuKey>('keywords');

  const renderContent = () => {
    if (activeMenu === 'keywords') return <KeywordsPage />;
    if (activeMenu === 'schedule') return <SchedulePage />;
    const item = MENU_ITEMS.find((m) => m.key === activeMenu);
    return <DisabledPage label={item?.label || ''} />;
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-brand">SHORTMAN ADMIN</div>
          <div className="admin-user">
            <span>{username}</span>
            <button className="admin-logout" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        </div>
        <nav className="admin-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`admin-nav-item ${activeMenu === item.key ? 'active' : ''} ${
                !item.enabled ? 'disabled' : ''
              }`}
              onClick={() => item.enabled && setActiveMenu(item.key)}
              disabled={!item.enabled && activeMenu !== item.key}
            >
              {item.label}
              {!item.enabled && <span className="admin-soon">soon</span>}
            </button>
          ))}
        </nav>
      </aside>
      <main className="admin-content">{renderContent()}</main>
    </div>
  );
}

// ------------------------------------------------------
// Main Component
// ------------------------------------------------------
export default function AdminKeywords() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState('');

  const verifyToken = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setAuthed(false);
      setAuthChecked(true);
      return;
    }
    try {
      const res = await authFetch(API_ENDPOINTS.ADMIN_ME);
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username || '');
        setAuthed(true);
      } else {
        clearToken();
        setAuthed(false);
      }
    } catch {
      clearToken();
      setAuthed(false);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    setUsername('');
  };

  if (!authChecked) {
    return (
      <div id="admin">
        <Header />
        <div className="admin-loading">인증 확인 중...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div id="admin">
      <Header />
      {!authed ? (
        <LoginForm onLoginSuccess={verifyToken} />
      ) : (
        <AdminLayout username={username} onLogout={handleLogout} />
      )}
      <Footer />
    </div>
  );
}
