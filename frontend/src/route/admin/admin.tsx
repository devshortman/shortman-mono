
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { API_ENDPOINTS } from '../../config/api';

export default function AdminKeywords() {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // 구글 Shorts 키워드 크롤
  const [crawlKeyword, setCrawlKeyword] = useState('육아');
  const [crawlHtml, setCrawlHtml] = useState('');
  const [crawlResult, setCrawlResult] = useState<{ parsed: number; saved: number } | null>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);

  async function fetchKeywords() {
    const { data } = await supabase.from('keywords').select('*').order('created_at', { ascending: false });
    setKeywords(data ?? []);
  }

  // async function addKeyword() {
  //   if (!newKeyword.trim()) return;
  //   await supabase.from('keywords').insert({ keyword: newKeyword });
  //   setNewKeyword('');
  //   fetchKeywords();
  // }

  async function runCrawlKeyword() {
    setCrawlResult(null);
    setCrawlError(null);
    try {
      const res = await fetch(API_ENDPOINTS.CRAWL_KEYWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: crawlKeyword.trim() || '육아',
          html: crawlHtml.trim() || undefined,
          region: 'korea',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || '크롤 실패'));
      setCrawlResult({ parsed: data.parsed, saved: data.saved });
    } catch (e) {
      setCrawlError(e instanceof Error ? e.message : '크롤 실패');
      setCrawlResult({ parsed: 0, saved: 0 });
      console.error(e);
    }
  }

  async function createTestUser() {
    setAuthMessage(null);
    if (!testEmail.trim() || !testPassword.trim()) {
      setAuthMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (testPassword.length < 6) {
      setAuthMessage('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: testEmail.trim(),
      password: testPassword,
    });
    if (error) {
      setAuthMessage(error.message);
      return;
    }
    if (data.user) {
      setAuthMessage(`테스트 계정 생성됨: ${data.user.email} — 로그인 페이지에서 확인하세요.`);
      setTestEmail('');
      setTestPassword('');
    }
  }

  useEffect(() => {
    fetchKeywords();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      {/* <h2>키워드 관리</h2>
      <div style={{ marginBottom: 12 }}>
        <input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="새 키워드 입력" />
        <button onClick={addKeyword}>등록</button>
      </div> */}
      <ul>
        {keywords.map((kw) => (
          <li key={kw.id}>
            {kw.keyword} — {kw.status}
          </li>
        ))}
      </ul>

      <hr style={{ margin: '32px 0' }} />

      <h2>구글 Shorts 키워드 크롤</h2>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
        구글에서 “육아” 등으로 검색한 후 Shorts 탭을 선택하고, 페이지 HTML을 복사해 붙여넣으세요.
      </p>
      <div style={{ marginBottom: 8 }}>
        <input
          value={crawlKeyword}
          onChange={(e) => setCrawlKeyword(e.target.value)}
          placeholder="키워드 (예: 육아)"
          style={{ width: '100%', maxWidth: 320, padding: 8, marginBottom: 8 }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <textarea
          value={crawlHtml}
          onChange={(e) => setCrawlHtml(e.target.value)}
          placeholder="HTML 붙여넣기 (선택) — 없으면 SERPAPI_KEY로 API 검색 시도"
          rows={6}
          style={{ width: '100%', maxWidth: 600, padding: 8, fontFamily: 'monospace', fontSize: 12 }}
        />
      </div>
      <button onClick={runCrawlKeyword}>크롤 실행</button>
      {crawlResult !== null && (
        <p style={{ marginTop: 8, fontSize: 14, color: crawlError ? '#c00' : '#0a0' }}>
          {crawlError
            ? `오류: ${crawlError}`
            : `파싱 ${crawlResult.parsed}개, 신규 저장 ${crawlResult.saved}개`}
        </p>
      )}

      <hr style={{ margin: '32px 0' }} />

      <h2>테스트 로그인 계정 생성</h2>
      <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
        아래에서 이메일/비밀번호로 회원을 생성한 뒤, 로그인 페이지(/login)에서 로그인할 수 있습니다.
      </p>
      <div style={{ marginBottom: 8 }}>
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="이메일 (예: test@example.com)"
          style={{ width: '100%', maxWidth: 320, padding: 8, marginRight: 8 }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          type="password"
          value={testPassword}
          onChange={(e) => setTestPassword(e.target.value)}
          placeholder="비밀번호 (6자 이상)"
          style={{ width: '100%', maxWidth: 320, padding: 8 }}
        />
      </div>
      <button onClick={createTestUser}>테스트 계정 생성</button>
      {authMessage && (
        <p style={{ marginTop: 8, fontSize: 14, color: authMessage.startsWith('테스트') ? '#0a0' : '#c00' }}>
          {authMessage}
        </p>
      )}
    </div>
  );
}
