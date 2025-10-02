// lib/shotstack.js
export function getBase() {
  return { host: process.env.SHOTSTACK_HOST || 'https://api.shotstack.io', env: process.env.SHOTSTACK_ENV || 'v1' };
}
async function request(method, path, payload) {
  const { host, env } = getBase();
  const url = `${host}/${env}${path}`;
  const headers = { 'x-api-key': process.env.SHOTSTACK_API_KEY };
  let body;
  if (payload !== undefined) { headers['Content-Type']='application/json'; body = JSON.stringify(payload); }
  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) { const msg = (data && (data.message || data.error)) || text || `HTTP ${res.status}`; throw new Error(`Shotstack ${method} ${path} failed: ${msg}`); }
  return data || {};
}
export async function ssPost(path, payload){ return request('POST', path, payload); }
export async function ssGet(path){ return request('GET', path); }
