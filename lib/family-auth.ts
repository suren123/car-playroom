export interface FamilyEnv { FAMILY_PASSWORD_HASH?: string; FAMILY_PASSWORD_SALT?: string; SESSION_SECRET?: string; }
const encoder = new TextEncoder();
export const COOKIE = 'car_family_session';
export const MAX_AGE = 60 * 60 * 24 * 7;
const b64 = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
function decode(value: string) { return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0)); }
export function configured(env: FamilyEnv) { return !!(env.FAMILY_PASSWORD_HASH && env.FAMILY_PASSWORD_SALT && env.SESSION_SECRET && env.SESSION_SECRET.length >= 32); }
async function signingKey(secret: string) { return crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign', 'verify']); }
export async function passwordMatches(password: string, env: FamilyEnv) {
  if (!configured(env) || password.length > 256) return false;
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', iterations: 100000, salt: encoder.encode(env.FAMILY_PASSWORD_SALT!)}, material, 256);
  const actual = new Uint8Array(bits), expected = decode(env.FAMILY_PASSWORD_HASH!);
  let different = actual.length ^ expected.length;
  for (let i = 0; i < actual.length; i++) different |= actual[i] ^ (expected[i] ?? 0);
  return different === 0;
}
export async function createSession(env: FamilyEnv, now = Date.now()) {
  const body = `parent.${Math.floor(now / 1000) + MAX_AGE}.${crypto.randomUUID()}`;
  const signature = await crypto.subtle.sign('HMAC', await signingKey(env.SESSION_SECRET!), encoder.encode(body));
  return `${body}.${b64(signature)}`;
}
export async function validSession(request: Request, env: FamilyEnv, now = Date.now()) {
  if (!configured(env)) return false;
  const value = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  if (!value) return false;
  const parts = value.split('.'), expires = Number(parts[1]);
  if (parts.length !== 4 || parts[0] !== 'parent' || !Number.isSafeInteger(expires) || expires <= Math.floor(now / 1000) || expires > Math.floor(now / 1000) + MAX_AGE + 30) return false;
  try { return await crypto.subtle.verify('HMAC', await signingKey(env.SESSION_SECRET!), decode(parts[3]), encoder.encode(parts.slice(0, 3).join('.'))); } catch { return false; }
}
function json(data: unknown, status = 200, headers: Record<string,string> = {}) { return new Response(JSON.stringify(data), {status, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers}}); }
export async function familyGate(request: Request, env: FamilyEnv): Promise<Response | null> {
  const url = new URL(request.url);
  let path:string;
  try { path=decodeURIComponent(url.pathname); } catch { return json({message:'页面地址不正确。'},400); }
  if (path === '/api/login' || path === '/api/logout') {
    if (request.method !== 'POST') return json({message: '请从登录页面进入。'}, 405, {allow: 'POST'});
    if (request.headers.get('origin') !== url.origin) return json({message: '请重新打开游戏后再试。'}, 403);
    if (path === '/api/logout') return json({ok: true}, 200, {'set-cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});
    if (!configured(env)) return json({message: '家庭账号尚未配置，请联系家长。'}, 503);
    if (Number(request.headers.get('content-length') || 0) > 4096) return json({message: '输入内容过长。'}, 413);
    let body: {username?: unknown; password?: unknown};
    try { const raw = await request.text(); if (raw.length > 4096) return json({message: '输入内容过长。'}, 413); body = JSON.parse(raw); if (!body || typeof body !== 'object') throw new Error('invalid'); } catch { return json({message: '请填写家庭账号和密码。'}, 400); }
    if (typeof body.password !== 'string' || typeof body.username !== 'string') return json({message: '请填写家庭账号和密码。'}, 400);
    const matches = await passwordMatches(body.password, env);
    if (!matches || body.username !== 'parent') return json({message: '账号或密码不对，请家长再检查一下。'}, 401);
    return json({ok: true}, 200, {'set-cookie': `${COOKIE}=${await createSession(env)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`});
  }
  const publicPath=path==='/'||['/favicon.svg','/manifest.webmanifest','/apple-touch-icon.png','/icon-512.png'].includes(path)||path.startsWith('/_next/static/');
  if (!publicPath) {
    if (!await validSession(request, env)) {
      if (path.startsWith('/api/')) return json({message: '请家长重新登录。'}, 401);
      return new Response(null, {status: 303, headers: {location: '/', 'cache-control': 'no-store'}});
    }
    if (path === '/api/session') return json({ok: true});
  }
  return null;
}
