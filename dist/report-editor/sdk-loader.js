/* ANDAMAN REPORT SDK loader · SDK-FIX-20261026-1
 * Bundled SDK first; pinned HTTPS CDN mirrors only if the bundled export is missing.
 * No user tokens, passwords or project keys are sent to the CDN.
 */
(function (root) {
  'use strict';
  const urls = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js',
    'https://unpkg.com/@supabase/supabase-js@2.118.0/dist/umd/supabase.js'
  ];
  const state = { build: 'SDK-FIX-20261026-1', status: 'idle', source: '', attempts: [] };
  let pending = null;
  const available = () => root.supabase && typeof root.supabase.createClient === 'function';
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let finished = false;
      const finish = error => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); }
        else resolve(root.supabase);
      };
      const timer = setTimeout(() => finish(new Error('SDK download timeout')), 10000);
      script.src = url;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      script.onload = () => finish(available() ? null : new Error('SDK export unavailable'));
      script.onerror = () => finish(new Error('SDK download blocked or unavailable'));
      document.head.appendChild(script);
    });
  }
  function ready(source) {
    state.status = 'ready'; state.source = source;
    console.info('ANDAMAN_SDK_READY=' + state.build + '; source=' + source);
    return root.supabase;
  }
  function load() {
    if (available()) return Promise.resolve(ready(state.source || 'bundled'));
    if (pending) return pending;
    state.status = 'loading'; state.attempts = [];
    pending = (async () => {
      for (const url of urls) {
        const source = new URL(url).hostname;
        try {
          await loadScript(url);
          state.attempts.push({ source, success: true });
          return ready(source);
        } catch (error) {
          state.attempts.push({ source, success: false });
          console.warn('ANDAMAN_SDK_LOAD_FAILED=' + source + '; ' + error.message);
        }
      }
      state.status = 'failed';
      throw new Error('โหลดส่วนเชื่อมต่อออนไลน์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตและการเข้าถึง cdn.jsdelivr.net / unpkg.com แล้วรีเฟรชหน้าเว็บ');
    })();
    pending.catch(() => { pending = null; });
    return pending;
  }
  root.AndamanSDK = Object.freeze({ load, diagnostics: () => ({ ...state, attempts: state.attempts.map(x => ({ ...x })) }) });
})(window);
