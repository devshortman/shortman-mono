import { useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { authFetch } from './admin';

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

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [filterRegion, setFilterRegion] = useState<Region | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
