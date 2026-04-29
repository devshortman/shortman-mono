import { useEffect, useState, useCallback } from 'react';
import Header from '../../component/header/header';
import Footer from '../../component/footer/footer';
import { API_ENDPOINTS } from '../../config/api';
import './admin.css';

import KeywordsPage from './KeywordsPage';
import SchedulePage from './SchedulePage';
import ShortsPage from './ShortsPage';
import InitiativePage from './InitiativePage';
import UsersPage from './UsersPage';

// ------------------------------------------------------
// Token & Fetch Helpers (export for child pages)
// ------------------------------------------------------
const TOKEN_KEY = 'admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...init, headers });
}

// ------------------------------------------------------
// Menu config
// ------------------------------------------------------
type MenuKey = 'keywords' | 'schedule' | 'shorts' | 'initiative' | 'users' | 'supaboard';

const MENU_ITEMS: { key: MenuKey; label: string; enabled: boolean }[] = [
  { key: 'keywords',   label: '키워드 풀',       enabled: true  },
  { key: 'schedule',   label: '스크래퍼 스케줄', enabled: true  },
  { key: 'shorts',     label: '수집 영상 관리',  enabled: true  },
  { key: 'initiative', label: 'Initiative',      enabled: true  },
  { key: 'users',      label: '사용자 관리',     enabled: true  },
  { key: 'supaboard',  label: 'Supa-board',      enabled: false },
];

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
      const res = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
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
// Disabled Page
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
// Layout
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
    if (activeMenu === 'shorts') return <ShortsPage />;
    if (activeMenu === 'initiative') return <InitiativePage />;
    if (activeMenu === 'users') return <UsersPage />;
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
// Main
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
