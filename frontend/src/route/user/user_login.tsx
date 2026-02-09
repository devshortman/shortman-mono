import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Header from '../../component/header/Header';
import Footer from '../../component/footer/Footer';
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
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
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
        </div>
      </div>
      <Footer />
    </div>
  );
}
