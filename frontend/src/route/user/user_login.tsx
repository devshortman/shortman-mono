import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseConfigured } from '../../supabaseClient';
import Header from '../../component/header/header';
import Footer from '../../component/footer/footer';
import './user_login.css';

export default function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!supabaseConfigured) {
      setError(
        'Supabase 환경 변수가 없습니다. frontend/.env.local 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 넣은 뒤 npm run dev 를 다시 시작하세요. (.env.production 은 로컬 dev 에서 불러오지 않습니다)'
      );
      return;
    }
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message ?? '로그인에 실패했습니다.');
        return;
      }
      if (data.user) {
        navigate('/my', { replace: true });
      }
    } catch (caught) {
      const msg =
        caught instanceof Error
          ? caught.message
          : typeof caught === 'string'
            ? caught
            : '알 수 없는 오류';
      setError(
        `요청 실패 (Failed to fetch 포함): ${msg}. URL·anon 키를 확인했는지, 광고 차단·네트워크를 점검하세요.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="user-login">
      <Header />
      <div className="login-body">
        <div className="login-box">
          <h1>로그인</h1>
          {!supabaseConfigured && (
            <p className="error">
              현재 브라우저에 Supabase URL/키가 없어 로그인 요청이 나가지 않습니다. frontend/.env.local 을 확인하세요.
            </p>
          )}
          <form onSubmit={handleLogin}>
            <label>
              <span>아이디 (이메일)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                autoComplete="email"
              />
            </label>
            <label>
              <span>비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                autoComplete="current-password"
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <div className="login-bottom">
            <span>아직 계정이 없으신가요?</span>
            <Link to="/join">회원가입</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
