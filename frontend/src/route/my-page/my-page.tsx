import { useEffect, useMemo, useRef, useState } from 'react';
import Footer from '../../component/footer/footer';
import Header from '../../component/header/header';
import Fresh from '../../assets/image/fresh.svg';
import defaultAvatarImg from '../../assets/image/default-profile-avatar.svg';
import './style.css';
// import SpiderChart from '../../component/spider-chart/SpiderChart';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';

// 실데이터 API 연동 시 복구
/*
const RADAR_PREVIEW_ROWS = [
    { label: '구독자 성장율', score: 3, color: '#26B6C6', grade: '일반' },
    { label: '콘텐츠 제작 빈도', score: 5, color: 'linear-gradient(180deg, #A02EFF, #23DAEF)', grade: '최우수' },
    { label: '채널 품질', score: 4, color: '#C45EF9', grade: '우수' },
    { label: '인게이지먼트 비율', score: 4, color: '#C45EF9', grade: '우수' },
    { label: '구독자 충성도', score: 4, color: '#C45EF9', grade: '우수' },
];
*/

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function extFromMime(mime: string): string {
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'image/gif') return 'gif';
    return '';
}

const MyPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [nickname, setNickname] = useState('');
    const [youtube, setYoutube] = useState('');
    const [instagram, setInstagram] = useState('');
    const [tiktok, setTiktok] = useState('');
    const [profileUpdatedAt, setProfileUpdatedAt] = useState<string | null>(null);
    const [socialSaveMsg, setSocialSaveMsg] = useState<string | null>(null);
    const [profileLoadErr, setProfileLoadErr] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatar, setAvatar] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarUploadErr, setAvatarUploadErr] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u)).catch(() => setUser(null));
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadProfile(u: User) {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('nickname,avatar,youtube,instagram,tiktok,updated_at')
                .eq('user_id', u.id)
                .maybeSingle();

            if (cancelled) return;

            if (error) {
                console.warn('[MyPage] user_profiles 조회 실패:', error.message);
                setProfileLoadErr(
                    import.meta.env.DEV
                        ? `프로필 DB 조회 오류: ${error.message}. 마이그레이션(backend/supabase) 적용 여부를 확인해 주세요.`
                        : '프로필 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                );
                const meta = u.user_metadata as Record<string, string | undefined> | undefined;
                setNickname((meta?.nickname as string | undefined)?.trim?.() ?? '');
                setYoutube(meta?.youtube ?? '');
                setInstagram(meta?.instagram ?? '');
                setTiktok(meta?.tiktok ?? '');
                setAvatar(typeof meta?.avatar === 'string' ? meta.avatar.trim() : '');
                setProfileUpdatedAt(null);
                return;
            }

            setProfileLoadErr(null);

            if (data) {
                setNickname(data.nickname ?? '');
                setYoutube(data.youtube ?? '');
                setInstagram(data.instagram ?? '');
                setTiktok(data.tiktok ?? '');
                setAvatar(data.avatar ?? '');
                setProfileUpdatedAt(data.updated_at ?? null);

                const dbA = typeof data.avatar === 'string' ? data.avatar.trim() : '';
                const metaA =
                    typeof u.user_metadata?.avatar === 'string' ? u.user_metadata.avatar.trim() : '';
                if (!cancelled && dbA && dbA !== metaA) {
                    const { error: syncMetaErr } = await supabase.auth.updateUser({
                        data: { avatar: dbA },
                    });
                    if (syncMetaErr) console.warn('[MyPage] avatar 메타 동기화 실패:', syncMetaErr.message);
                }
            } else {
                const meta = u.user_metadata as Record<string, string | undefined> | undefined;
                setNickname((meta?.nickname as string | undefined)?.trim?.() ?? '');
                setYoutube(meta?.youtube ?? '');
                setInstagram(meta?.instagram ?? '');
                setTiktok(meta?.tiktok ?? '');
                setAvatar(typeof meta?.avatar === 'string' ? meta.avatar.trim() : '');
                setProfileUpdatedAt(null);
            }
        }

        if (!user) {
            setNickname('');
            setYoutube('');
            setInstagram('');
            setTiktok('');
            setAvatar('');
            setProfileUpdatedAt(null);
            setProfileLoadErr(null);
            return () => {
                cancelled = true;
            };
        }

        void loadProfile(user);
        return () => {
            cancelled = true;
        };
    }, [user]);

    const displayName =
        nickname.trim() ||
        (user?.email ? user.email.split('@')[0] : '') ||
        '내 계정';

    const handleLine = `@${nickname.trim() || (user?.email ? user.email.split('@')[0] : 'guest')}`;

    const avatarDisplaySrc = useMemo(() => {
        const t = avatar.trim();
        const m =
            user && typeof user.user_metadata?.avatar === 'string' ? user.user_metadata.avatar.trim() : '';
        const cand = t || m;
        if (!cand) return defaultAvatarImg;
        return /^https?:\/\//i.test(cand) ? cand : defaultAvatarImg;
    }, [avatar, user]);

    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !user) return;
        setAvatarUploadErr(null);
        if (!file.type.startsWith('image/')) {
            setAvatarUploadErr('이미지 파일만 업로드할 수 있습니다.');
            return;
        }
        if (file.size > AVATAR_MAX_BYTES) {
            setAvatarUploadErr(`파일은 ${Math.floor(AVATAR_MAX_BYTES / (1024 * 1024))}MB 이하만 가능합니다.`);
            return;
        }
        let ext = extFromMime(file.type);
        if (!ext && file.name.includes('.')) {
            const raw = file.name.split('.').pop()!.toLowerCase();
            ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(raw) ? raw : '';
            if (ext === 'jpeg') ext = 'jpg';
        }
        if (!ext) ext = 'jpg';

        const objectPath = `${user.id}/${Date.now()}.${ext}`;
        setAvatarUploading(true);
        try {
            const { error: upErr } = await supabase.storage.from('avatars').upload(objectPath, file, {
                upsert: false,
                contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                cacheControl: '300',
            });
            if (upErr) throw upErr;

            const { data: pub } = supabase.storage.from('avatars').getPublicUrl(objectPath);
            setAvatar(pub.publicUrl);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setAvatarUploadErr(
                `${msg}. 버킷 'avatars'(SQL 마이그레이션)·로그인 여부를 확인해 주세요.`
            );
        } finally {
            setAvatarUploading(false);
        }
    };

    const saveProfile = async () => {
        if (!user) return;
        setSocialSaveMsg(null);

        const trimmedNick = nickname.trim();
        const trimmedAvatar = avatar.trim();
        const row = {
            user_id: user.id,
            nickname: trimmedNick || null,
            avatar: trimmedAvatar ? trimmedAvatar : null,
            youtube: youtube.trim() || null,
            instagram: instagram.trim() || null,
            tiktok: tiktok.trim() || null,
        };

        const { error: upsertErr } = await supabase.from('user_profiles').upsert(row, { onConflict: 'user_id' });

        if (upsertErr) {
            setSocialSaveMsg(
                import.meta.env.DEV
                    ? `저장 실패(DB): ${upsertErr.message}`
                    : `저장에 실패했습니다: ${upsertErr.message}`
            );
            return;
        }

        setProfileLoadErr(null);

        const { error: authErr } = await supabase.auth.updateUser({
            data: {
                nickname: trimmedNick || null,
                avatar: trimmedAvatar ? trimmedAvatar : null,
                youtube: youtube.trim() || null,
                instagram: instagram.trim() || null,
                tiktok: tiktok.trim() || null,
            },
        });

        if (authErr) {
            setSocialSaveMsg(
                import.meta.env.DEV
                    ? `DB에는 저장했으나 Auth 메타 갱신 실패: ${authErr.message}`
                    : `일부 정보 동기화에 실패했습니다: ${authErr.message}`
            );
        } else {
            setSocialSaveMsg('저장되었습니다.');
            setProfileUpdatedAt(new Date().toISOString());
            setTimeout(() => setSocialSaveMsg(null), 2500);
        }
    };

    const formatKoDateTime = (iso: string | null) =>
        iso
            ? new Date(iso).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : '—';

    return (
        <div id="my">
            <Header />
            <div className="body">
                <div className="account">
                    <div>
                        <div className="avatar">
                            <img src={avatarDisplaySrc} alt="" className="mypage-avatar-fill" />
                        </div>

                        <div className="info">
                            <div className="na">
                                <div className="bold">{user ? displayName : '비로그인'}</div>
                                <div className="sub">{user ? handleLine : '로그인 후 프로필을 저장할 수 있어요'}</div>
                            </div>

                            {import.meta.env.DEV && (
                                <div className="locale mypage-region-line">
                                    <div>
                                        프로필 이미지는 상단 패널에서 바꾸고, 표시 이름·SNS는 아래에서 저장합니다.
                                    </div>
                                </div>
                            )}
                        </div>
                        {import.meta.env.DEV && (
                            <div className="Skeleton" onClick={() => navigate('/my-sample')}>
                                Concept
                                <img src={Fresh} alt="" />
                            </div>
                        )}
                    </div>
                </div>

                {import.meta.env.DEV && (
                    <div className="count mypage-metrics-notice">
                        <strong>숏폼 지표·순위 (개발용 안내)</strong>
                        <p>
                            상단 카드 형태 지표는 <em>더미였던 구간을 제거</em>했습니다. 채널 분석은 외부 API·집계가
                            필요하며, 제공 시에는 <code>user_profiles</code>에 연결한 채널 기준으로 불러오면 됩니다.
                        </p>
                    </div>
                )}

                <div className="calist mypage-calist-single">
                    {/*
                      Nox Score / SpiderChart / 레이더 프리뷰 — 실데이터 API 없음, 연동 후 복구
                    <div className="left">
                        <div className="mypage-radar-intro card">...</div>
                        <div className="nox-score-left">...</div>
                    </div>
                    */}
                    <div className="right">
                        <div className="card4">
                            <div className="top mypage-profile-image-panel">
                                <div className="title">프로필 이미지</div>
                                <div className="user-info-content">
                                    {user ? (
                                        <>
                                            <div className="mypage-avatar-editor">
                                                <img src={avatarDisplaySrc} alt="" className="mypage-avatar-thumb" />
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                                    className="mypage-file-input-visually-hidden"
                                                    onChange={(e) => void handleAvatarFile(e)}
                                                    disabled={avatarUploading}
                                                />
                                                <div className="mypage-avatar-actions">
                                                    <button
                                                        type="button"
                                                        className="mypage-avatar-chip-btn"
                                                        disabled={avatarUploading}
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        {avatarUploading ? '업로드 중…' : '이미지 업로드'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="mypage-avatar-chip-btn secondary"
                                                        onClick={() => {
                                                            setAvatar('');
                                                            setAvatarUploadErr(null);
                                                        }}
                                                    >
                                                        기본 이미지
                                                    </button>
                                                </div>
                                            </div>
                                            {avatarUploadErr && (
                                                <p className="mypage-avatar-upload-err">{avatarUploadErr}</p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="user-info-empty">로그인 후 프로필 이미지를 변경할 수 있어요.</p>
                                    )}
                                </div>
                            </div>

                            <div className="top user-info-section">
                                <div className="title">프로필 정보</div>
                                <div className="user-info-content">
                                    {user ? (
                                        <>
                                            <div className="user-info-row">
                                                <span className="user-info-label">표시 이름</span>
                                                <input
                                                    type="text"
                                                    value={nickname}
                                                    onChange={(e) => setNickname(e.target.value)}
                                                    placeholder="닉네임"
                                                    className="user-info-input"
                                                />
                                            </div>
                                            <div className="user-info-row">
                                                <span className="user-info-label">이메일</span>
                                                <span className="user-info-value">{user.email}</span>
                                            </div>
                                            <div className="user-info-row">
                                                <span className="user-info-label">가입일</span>
                                                <span className="user-info-value">
                                                    {user.created_at
                                                        ? new Date(user.created_at).toLocaleDateString('ko-KR', {
                                                              year: 'numeric',
                                                              month: 'long',
                                                              day: 'numeric',
                                                          })
                                                        : '-'}
                                                </span>
                                            </div>
                                            <div className="user-info-row">
                                                <span className="user-info-label">User ID</span>
                                                <span className="user-info-value user-id">{user.id}</span>
                                            </div>
                                            <div className="user-info-social">
                                                <div className="user-info-row">
                                                    <span className="user-info-label">YouTube</span>
                                                    <input
                                                        type="text"
                                                        value={youtube}
                                                        onChange={(e) => setYoutube(e.target.value)}
                                                        placeholder="채널 URL 또는 @username"
                                                        className="user-info-input"
                                                    />
                                                </div>
                                                <div className="user-info-row">
                                                    <span className="user-info-label">Instagram</span>
                                                    <input
                                                        type="text"
                                                        value={instagram}
                                                        onChange={(e) => setInstagram(e.target.value)}
                                                        placeholder="채널 URL 또는 @username"
                                                        className="user-info-input"
                                                    />
                                                </div>
                                                <div className="user-info-row">
                                                    <span className="user-info-label">TikTok</span>
                                                    <input
                                                        type="text"
                                                        value={tiktok}
                                                        onChange={(e) => setTiktok(e.target.value)}
                                                        placeholder="채널 URL 또는 @username"
                                                        className="user-info-input"
                                                    />
                                                </div>
                                                <div className="user-info-social-actions">
                                                    <button type="button" onClick={() => void saveProfile()} className="user-info-save-btn">
                                                        {import.meta.env.DEV ? '저장 (DB · Auth 동기화)' : '저장'}
                                                    </button>
                                                    {socialSaveMsg && <span className="user-info-save-msg">{socialSaveMsg}</span>}
                                                </div>
                                                {profileLoadErr && (
                                                    <p className="mypage-profile-loaderr" role="alert">
                                                        {profileLoadErr}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="user-info-empty">로그인이 필요합니다.</p>
                                    )}
                                </div>
                            </div>

                            <div className="update-info">
                                <div className="im">
                                    <img src={Fresh} alt="" />
                                </div>
                                <div>
                                    <div>프로필 마지막 저장 </div>
                                    <div>{formatKoDateTime(profileUpdatedAt)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MyPage;
