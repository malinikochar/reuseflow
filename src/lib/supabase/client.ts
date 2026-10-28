import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from './config';

export function createSupabaseBrowserClient() {
  const { url, publishableKey, isConfigured } = getSupabasePublicConfig();
  if (!isConfigured) {
    return null;
  }
  return createBrowserClient(url, publishableKey);
}
