import { useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { authFetch } from './admin';

interface UserProfile {
  user_id: string;
  nickname?: string;
  avatar?: string;
  is_blocked: boolean;
  block_reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [filterBlocked, setFilterBlocked] = useState<'all' | 'blocked' | 'active'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterBlocked === 'blocked') params.set('blocked', 'true');
      if (filterBlocked === 'active') params.set('blocked', 'false');
      params.set('page', String(page));
      params.set('page_size', String(pageSize));

      const res = await authFetch(`${API_ENDPOINTS.ADMIN_USERS}?${params.toString()}`);
      if (!res.ok) {
        setError(`목록 조회 실패 (${res.status})`);
        return;
      }
      const data = await res.json();
      setUsers(data.items || []);
      setCount(data.count || 0);
    } catch {
      setError('서버 통신 오류');
    } finally {
      setLoading(false);
    }
  }, [filterBlocked, page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const startEdit = (user: UserProfile) => {
    setEditing(user.user_id);
    setEditNickname(user.nickname || '');
    setEditReason(user.block_reason || '');
    setEditNotes(user.notes || '');
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditNickname('');
    setEditReason('');
    setEditNotes('');
  };

  const saveEdit = async (userId: string) => {
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nickname: editNickname || null,
          block_reason: editReason || null,
          notes: editNotes || null,
        }),
      });
      if (res.ok) {
        cancelEdit();
        fetchUsers();
      }
    } catch {}
  };

  const toggleBlock = async (user: UserProfile) => {
    const willBlock = !user.is_blocked;
    if (willBlock && !confirm(`"${user.nickname || user.user_id}" 차단?`)) return;
    try {
      const res = await authFetch(`${API_ENDPOINTS.ADMIN_USERS}/${user.user_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_blocked: willBlock }),
      });
      if (res.ok) fetchUsers();
    } catch {}
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>
          사용자 관리 <span className="admin-count">(총 {count})</span>
        </h2>
        <div className="admin-filter">
          <label>filter</label>
          <select
            value={filterBlocked}
            onChange={(e) => {
              setFilterBlocked(e.target.value as typeof filterBlocked);
              setPage(1);
            }}
          >
            <option value="all">전체</option>
            <option value="active">활성</option>
            <option value="blocked">차단됨</option>
          </select>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p>로딩 중...</p>}

      {users.length === 0 && !loading && (
        <p className="admin-empty">등록된 사용자가 없습니다.</p>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>user_id</th>
            <th>nickname</th>
            <th>blocked</th>
            <th>reason</th>
            <th>notes</th>
            <th>created</th>
            <th>action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isEditing = editing === user.user_id;
            return (
              <tr key={user.user_id} className={user.is_blocked ? 'inactive' : ''}>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {user.user_id.slice(0, 8)}...
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                    />
                  ) : (
                    user.nickname || '—'
                  )}
                </td>
                <td>
                  <button
                    className={`pill ${user.is_blocked ? 'on' : 'off'}`}
                    onClick={() => toggleBlock(user)}
                  >
                    {user.is_blocked ? 'BLOCKED' : 'active'}
                  </button>
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                    />
                  ) : (
                    user.block_reason || '—'
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  ) : (
                    user.notes || '—'
                  )}
                </td>
                <td style={{ fontSize: 11, color: '#888' }}>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : '—'}
                </td>
                <td>
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(user.user_id)}>저장</button>
                      <button onClick={cancelEdit}>취소</button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(user)}>편집</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
