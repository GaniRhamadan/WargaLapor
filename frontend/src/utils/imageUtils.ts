/**
 * Resolves an image path to a full URL.
 * 
 * Handles multiple path formats:
 * - Full URLs (https://...) → returned as-is
 * - Relative storage paths (/storage/...) → prepended with backend base URL
 * - Empty/null → returns fallback placeholder
 */
export function getImageUrl(path: string | null | undefined, fallback?: string): string {
  const defaultFallback = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60';

  if (!path) return fallback || defaultFallback;

  // Already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Relative storage path from Laravel
  if (path.startsWith('/storage/')) {
    const backendUrl = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL).origin
      : '';
    return `${backendUrl}${path}`;
  }

  // Data URI (base64)
  if (path.startsWith('data:image')) {
    return path;
  }

  // Unknown format, return as-is
  return path;
}
