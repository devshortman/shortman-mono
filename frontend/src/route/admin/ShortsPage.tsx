import { useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { authFetch } from './admin';

type Region = 'korea' | 'global' | 'china';

interface ShortsItemAdmin {
  id: number;
  platform: string;
  platform_id: string;
  title: string;
  thumbnail?: string;
  video_url: string;
  nickname?: string;
  region: Region;
  source?: string;
  keyword?: string;
  likes?: number;
  views?: number;
  comments?: number;
  is_hidden: boolean;
  crawled_at?: string;
}

export default function ShortsPage() {
  const [items, setItems] = useState<ShortsItemAdmin[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterRegion, setFilterRegion] = useState<Region | 'all'>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'views' | 'likes'>('newest');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const fetchShorts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterRegion !== 'all') params.set('region', filterRegion);
      if (filterPlatform !== 'all') params.set('platform', filterPlatform);
      if (filterKeyword.trim()) params.set('keyword', filterKeyword.trim());
      if (showHidden) params.set('show_hidden', 'true');
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('page_size', String(pageSize));

      const res = await authFetch(`${API_ENDPOINTS.ADMIN_SHORTS}?${params.toString()}`);
      if (!res.ok) {
        setError(`목록 조회 실패 (${res.status})`);
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
      setCount(data.count || 0);
      setSelected(new Set());
    } catch {
      setError('서버 통신 오류');
    } finally {
      setLoading(false);
    }
  }, [filterRegion, filterPlatform, filterKeyword, showHidden, sort, page, pageSize]);

  useEffect(() => {
    fetchShorts();
  }, [fetchShorts]);

  const toggleHidden = async (item: ShortsItemAdmin) => {
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_SHORTS}/${item.id}/hidden`, {
        method: 'PATCH',
        body: JSON.stringify({ is_hidden: !item.is_hidden }),
      });
      if (res.ok) fetchShorts();
    } catch {}
  };

  const deleteShorts = async (item: ShortsItemAdmin) => {
    if (!confirm(`"${item.title}" 영구 삭제하시겠습니까?`)) return;
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_SHORTS}/${item.id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchShorts();
    } catch {}
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const bulkHide = async () => {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}개 영상을 숨김 처리하시겠습니까?`)) return;
    try {
      const res = await authFetch(API_ENDPOINTS.ADMIN_SHORTS_BULK_HIDE, {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) fetchShorts();
    } catch {}
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}개 영상을 영구 삭제하시겠습니까?`)) return;
    try {
      const res = await authFetch(API_ENDPOINTS.ADMIN_SHORTS_BULK_DEL, {
        method: 'POST',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) fetchShorts();
    } catch {}
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>
          수집 영상 관리 <span className="admin-count">(총 {count})</span>
        </h2>
      </div>

      <div className="admin-filters-row">
        <select
          value={filterRegion}
          onChange={(e) => {
            setFilterRegion(e.target.value as Region | 'all');
            setPage(1);
          }}
        >
          <option value="all">all region</option>
          <option value="korea">korea</option>
          <option value="global">global</option>
          <option value="china">china</option>
        </select>
        <select
          value={filterPlatform}
          onChange={(e) => {
            setFilterPlatform(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">all platform</option>
          <option value="youtube">youtube</option>
          <option value="instagram">instagram</option>
          <option value="tiktok">tiktok</option>
        </select>
        <input
          type="text"
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              fetchShorts();
            }
          }}
          placeholder="keyword 검색 (Enter)"
        />
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as typeof sort);
            setPage(1);
          }}
        >
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
          <option value="views">조회수순</option>
          <option value="likes">좋아요순</option>
        </select>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => {
              setShowHidden(e.target.checked);
              setPage(1);
            }}
          />
          <span>숨김 포함</span>
        </label>
      </div>

      {/* 일괄 액션 바 */}
      <div className="admin-bulk-bar">
        <button onClick={selectAll}>
          {selected.size === items.length && items.length > 0 ? '전체 해제' : '전체 선택'}
        </button>
        <span className="admin-count">선택 {selected.size}개</span>
        <button onClick={bulkHide} disabled={selected.size === 0}>
          일괄 숨김
        </button>
        <button
          onClick={bulkDelete}
          disabled={selected.size === 0}
          className="admin-danger"
        >
          일괄 삭제
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p>로딩 중...</p>}

      <div className="admin-shorts-grid">
        {items.map((item) => (
          <div
            key={item.id}
            className={`admin-shorts-card ${item.is_hidden ? 'hidden' : ''} ${
              selected.has(item.id) ? 'selected' : ''
            }`}
          >
            <label className="admin-shorts-checkbox">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggleSelect(item.id)}
              />
            </label>
            <a href={item.video_url} target="_blank" rel="noreferrer">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item.title} />
              ) : (
                <div className="admin-shorts-thumb-empty">no thumb</div>
              )}
            </a>
            <div className="admin-shorts-meta">
              <div className="admin-shorts-title">{item.title}</div>
              <div className="admin-shorts-sub">
                {item.platform} · {item.nickname || '—'}
              </div>
              <div className="admin-shorts-stats">
                <span>👁 {item.views?.toLocaleString() ?? 0}</span>
                <span>♥ {item.likes?.toLocaleString() ?? 0}</span>
                <span>💬 {item.comments?.toLocaleString() ?? 0}</span>
              </div>
              <div className="admin-shorts-tags">
                <span className="tag">{item.region}</span>
                {item.keyword && <span className="tag">{item.keyword}</span>}
                {item.is_hidden && <span className="tag tag-warn">hidden</span>}
              </div>
            </div>
            <div className="admin-shorts-actions">
              <button
                className={`pill ${item.is_hidden ? 'on' : 'off'}`}
                onClick={() => toggleHidden(item)}
              >
                {item.is_hidden ? '숨김 해제' : '숨김'}
              </button>
              <button className="admin-danger" onClick={() => deleteShorts(item)}>
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            이전
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
