export function getSupabasePublicConfig(): {
  url: string;
  publishableKey: string;
  isConfigured: boolean;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    '';

  const isConfigured = Boolean(
    url.startsWith('http') && publishableKey.length > 10
  );

  return {
    url,
    publishableKey,
    isConfigured,
  };
}
