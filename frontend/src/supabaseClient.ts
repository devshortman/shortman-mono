import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

/** 배포 빌드·로컬 .env 에 키가 있을 때만 실제 요청 가능 */
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * createClient 에 빈 문자열을 넣으면 @supabase/supabase-js 가 즉시 throw 하여 전역이 흰 화면이 됩니다.
 * 로컬에 env 없이도 UI 확인할 수 있도록 stub 로 연결합니다(로그인·DB는 불가).
 */
function createSupabaseOrStub(): SupabaseClient {
  if (!supabaseConfigured) {
    if (import.meta.env.DEV) {
      console.warn(
        '[Supabase] VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY 가 없습니다. ' +
          '로그인·DB는 동작하지 않습니다. frontend/.env.local 등에 변수를 두세요 (.env.production 은 vite dev 에서 로드하지 않음).'
      );
    }
    return createClient(
      'https://invalid.invalid',
      'dev-missing-supabase-env-placeholder-not-a-real-jwt-secret'
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseOrStub();
