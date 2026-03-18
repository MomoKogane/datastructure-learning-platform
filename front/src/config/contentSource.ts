const ENABLE_LOCAL_CONTENT_FALLBACK = (
  import.meta.env.DEV
  && String(import.meta.env.VITE_ENABLE_LOCAL_CONTENT_FALLBACK || 'false').toLowerCase() === 'true'
);

export const isLocalContentFallbackEnabled = (): boolean => ENABLE_LOCAL_CONTENT_FALLBACK;
