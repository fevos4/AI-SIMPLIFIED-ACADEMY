/**
 * Converts standard YouTube/Vimeo watch or share URLs into embeddable iframe URLs.
 * Handles:
 * - https://www.youtube.com/watch?v=ID -> https://www.youtube.com/embed/ID
 * - https://youtu.be/ID -> https://www.youtube.com/embed/ID
 * - https://www.youtube.com/shorts/ID -> https://www.youtube.com/embed/ID
 * - https://vimeo.com/ID -> https://player.vimeo.com/video/ID
 */
export function formatEmbedUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return '';
  let trimmed = url.trim();

  // YouTube watch link: youtube.com/watch?v=VIDEO_ID
  const ytWatchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/i);
  if (ytWatchMatch && ytWatchMatch[1]) {
    return `https://www.youtube.com/embed/${ytWatchMatch[1]}`;
  }

  // YouTube short link: youtu.be/VIDEO_ID
  const ytShortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (ytShortMatch && ytShortMatch[1]) {
    return `https://www.youtube.com/embed/${ytShortMatch[1]}`;
  }

  // YouTube Shorts: youtube.com/shorts/VIDEO_ID
  const ytShortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/i);
  if (ytShortsMatch && ytShortsMatch[1]) {
    return `https://www.youtube.com/embed/${ytShortsMatch[1]}`;
  }

  // Vimeo link: vimeo.com/VIDEO_ID
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return trimmed;
}
