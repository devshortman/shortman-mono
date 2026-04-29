import { useEffect, useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import { authFetch } from './admin';

type Region = 'korea' | 'global' | 'china';

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

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      <form className="admin-add-form" onSubmit={handleAddAccount}>
        <input
          type="text"
          value={newAccount}
          onChange={(e) => setNewAccount(e.target.value)}
          placeholder="새 계정명 (yml의 ACCOUNT_NAME과 일치)"
          required
        />
        <select value={newRegion} onChange={(e) => setNewRegion(e.target.value as Region)}>
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
              <button className="admin-danger" onClick={() => deleteAccount(account)}>
                계정 삭제
              </button>
            </div>

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
