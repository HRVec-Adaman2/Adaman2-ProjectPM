import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const corsHeaders = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Vary': 'Origin'
};
function base64(bytes: Uint8Array): string {
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(x => x.trim()).filter(Boolean);
  const headers: Record<string, string> = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const answer = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });
  if (origin && !allowed.includes(origin)) return answer({ success: false, message: 'Origin not allowed' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return answer({ success: false, message: 'Method not allowed' }, 405);
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return answer({ success: false, message: 'Authentication required' }, 401);
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('REPORT_SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    const gasUrl = Deno.env.get('REPORT_GAS_URL');
    const secret = Deno.env.get('REPORT_BRIDGE_SECRET');
    if (!url || !key || !gasUrl || !secret || secret.length < 32) return answer({ success: false, message: 'Server configuration incomplete' }, 503);
    const endpoint = new URL(gasUrl);
    if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'script.google.com' || !endpoint.pathname.endsWith('/exec')) return answer({ success: false, message: 'Invalid Apps Script endpoint' }, 503);
    const supabase = createClient(url, key, { global: { headers: { Authorization: 'Bearer ' + token } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return answer({ success: false, message: 'Invalid or expired session' }, 401);
    const bodyText = await req.text();
    if (bodyText.length > 4096) return answer({ success: false, message: 'Request too large' }, 413);
    const input = JSON.parse(bodyText);
    if (typeof input.reportId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.reportId) || !Number.isSafeInteger(input.version)) return answer({ success: false, message: 'Invalid report ID or version' }, 400);
    // User-context client: this query is subject to RLS; no service_role key.
    const { data: report, error } = await supabase.from('andaman_project_reports').select('id,owner_id,payload,version').eq('id', input.reportId).single();
    if (error || !report || report.owner_id !== auth.user.id) return answer({ success: false, message: 'Report not found' }, 404);
    if (report.version !== input.version) return answer({ success: false, message: 'Report changed; reload before sending' }, 409);
    const payload = structuredClone(report.payload);
    if (!Array.isArray(payload.photos) || payload.photos.length > 20) return answer({ success: false, message: 'Invalid photo list' }, 400);
    let totalBytes = 0;
    const photos = [];
    for (const photo of payload.photos) {
      if (typeof photo.path !== 'string' || !photo.path.startsWith(auth.user.id + '/' + report.id + '/')) return answer({ success: false, message: 'Invalid photo ownership' }, 400);
      const { data: blob, error: downloadError } = await supabase.storage.from('andaman-report-photos').download(photo.path);
      if (downloadError || !blob) return answer({ success: false, message: 'Photo download failed' }, 502);
      totalBytes += blob.size;
      if (blob.size > 1572864 || totalBytes > 9000000) return answer({ success: false, message: 'Photos exceed sync limit of 9 MB; reduce photo sizes' }, 413);
      photos.push({ id: photo.id, caption: photo.caption, base64: 'data:' + blob.type + ';base64,' + base64(new Uint8Array(await blob.arrayBuffer())) });
    }
    payload.photos = photos;
    const message = JSON.stringify({ reportId: report.id, ownerId: auth.user.id, version: report.version, timestamp: Date.now(), payload });
    const signingKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = base64(new Uint8Array(await crypto.subtle.sign('HMAC', signingKey, new TextEncoder().encode(message))));
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, signature }), signal: AbortSignal.timeout(50000), redirect: 'follow' });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch { return answer({ success: false, message: 'Apps Script returned non-JSON; check deployment access and version' }, 502); }
    if (!response.ok || !result.success) return answer({ success: false, message: result.message || 'Apps Script sync failed' }, 502);
    return answer({ success: true, reportId: report.id, version: report.version, syncedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError' ? 'Apps Script timed out; retry is safe for the same report version' : 'Sync failed; check function configuration and logs';
    return answer({ success: false, message }, 500);
  }
});
