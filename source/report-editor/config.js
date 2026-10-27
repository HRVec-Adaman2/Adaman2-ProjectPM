// Generated from apps-script/Config.html; edit that file and rebuild.

// Public browser configuration only. This file NEVER contains a password,
// REPORT_BRIDGE_SECRET, Supabase secret key, or service_role key.
window.ANDAMAN_CONFIG = {
  supabaseUrl: 'https://trzydkkblhecwpnlzglb.supabase.co',
  supabasePublishableKey: 'sb_publishable_x0Rd2SgTVJFTHMANlcjFzg_z2AtnmXp',
  syncFunction: 'report-sheet-sync',
  loginAliases: {
    admin: 'andaman.southern2@gmail.com'
  }
};
// Copy only the origin printed here to Edge Function ALLOWED_ORIGINS.
// This diagnostic contains no credentials; there is no connection-settings menu.
console.info('ANDAMAN_REPORT_ORIGIN=' + window.location.origin);
