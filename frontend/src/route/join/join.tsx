import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseConfigured } from '../../supabaseClient';
import Header from '../../component/header/header';
import Footer from '../../component/footer/footer';
import './style.css';

const Join = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!supabaseConfigured) {
      setError(
        'Supabase 환경 변수가 없습니다. frontend/.env.local 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 넣고 서버를 다시 시작하세요.'
      );
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname: nickname.trim() },
        },
      });

      if (err) {
        setError(err.message ?? '회원가입에 실패했습니다.');
        return;
      }

      // 이메일 확인이 필요한 경우 session이 null
      if (data.session) {
        navigate('/my', { replace: true });
      } else {
        setInfo('가입 메일을 확인해주세요. 인증 후 로그인할 수 있습니다.');
      }
    } catch (caught) {
      const msg =
        caught instanceof Error
          ? caught.message
          : typeof caught === 'string'
            ? caught
            : '알 수 없는 오류';
      setError(`요청 실패: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="user-login">
      <Header />
      <div className="login-body">
        <div className="login-box">
          <h1>회원가입</h1>
          {!supabaseConfigured && (
            <p className="error">
              Supabase 설정이 필요합니다. frontend/.env.local 을 참고해 주세요.
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <label>
              <span>이메일</span>
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
              <span>닉네임</span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임"
                required
                maxLength={30}
              />
            </label>
            <label>
              <span>비밀번호 (6자 이상)</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </label>
            <label>
              <span>비밀번호 확인</span>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 확인"
                required
                autoComplete="new-password"
              />
            </label>
            {error && <p className="error">{error}</p>}
            {info && <p className="info">{info}</p>}
            <button type="submit" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>
          <div className="login-bottom">
            <span>이미 계정이 있으신가요?</span>
            <Link to="/login">로그인</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Join;
