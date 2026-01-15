##-- Demo for test admin page(features) --##

import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function AdminKeywords() {
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');

  async function fetchKeywords() {
    const { data } = await supabase.from('keywords').select('*').order('created_at', { ascending: false });
    setKeywords(data);
  }

  async function addKeyword() {
    if (!newKeyword.trim()) return;
    await supabase.from('keywords').insert({ keyword: newKeyword });
    setNewKeyword('');
    fetchKeywords();
  }

  useEffect(() => {
    fetchKeywords();
  }, []);

  return (
    <div>
      <h2>키워드 관리</h2>
      <div style={{ marginBottom: '12px' }}>
        <input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="새 키워드 입력" />
        <button onClick={addKeyword}>등록</button>
      </div>

      <ul>
        {keywords.map((kw) => (
          <li key={kw.id}>
            {kw.keyword} — {kw.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
