
interface M3UItem {
  title: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  type?: 'movie' | 'series' | 'tv' | 'unknown';
}

/**
 * Determine the content type based on M3U item properties
 */
const determineContentType = (item: M3UItem): M3UItem['type'] => {
  const title = item.title.toLowerCase();
  const groupTitle = (item.groupTitle || '').toLowerCase();
  
  // Check for series indicators with improved T#|EP# pattern detection
  if (
    title.includes('s01') || title.includes('s02') || 
    title.includes('temporada') || title.includes('episódio') || 
    title.includes('episodio') || title.includes('ep.') || 
    groupTitle.includes('série') || groupTitle.includes('series') || 
    groupTitle.includes('show') || /t\d+e\d+/i.test(title) ||
    /t\d+\|ep\d+/i.test(title) || // Added pattern for T#|EP# format
    /temporada.*\d+.*epis[oó]dio.*\d+/i.test(title)
  ) {
    return 'series';
  }
  
  // Check for movie indicators
  if (
    groupTitle.includes('filme') || groupTitle.includes('movie') || 
    groupTitle.includes('cinema') || (title.includes('(') && title.includes(')') && !title.includes('T') && !title.includes('EP')) || 
    /\(\d{4}\)/.test(title) // year in parentheses like (2022)
  ) {
    return 'movie';
  }
  
  // Check for TV indicators
  if (
    groupTitle.includes('tv') || groupTitle.includes('channel') || 
    groupTitle.includes('canal') || groupTitle.includes('ao vivo') || 
    groupTitle.includes('live')
  ) {
    return 'tv';
  }
  
  return 'unknown';
};

/**
 * Parse an episode title to extract series name, season, and episode number
 */
export const parseEpisodeTitle = (title: string): { 
  seriesName: string; 
  season: number; 
  episode: number;
} => {
  let seriesName = title;
  let season = 1;
  let episode = 1;
  
  // Try to match T#|EP# pattern (like T6|EP12)
  const tEpMatch = title.match(/(.+?)\s+T(\d+)\|EP(\d+)/i);
  if (tEpMatch) {
    seriesName = tEpMatch[1].trim();
    season = parseInt(tEpMatch[2], 10);
    episode = parseInt(tEpMatch[3], 10);
    return { seriesName, season, episode };
  }
  
  // Try to match patterns like "Show Name S01E02" or "Show Name T01E02"
  const seasonEpisodeMatch = title.match(/(.+?)(?:[ST](\d+)E(\d+))/i);
  if (seasonEpisodeMatch) {
    seriesName = seasonEpisodeMatch[1].trim();
    season = parseInt(seasonEpisodeMatch[2], 10);
    episode = parseInt(seasonEpisodeMatch[3], 10);
    return { seriesName, season, episode };
  }
  
  // Try to match patterns with Temporada/Episódio text
  const tempEpMatch = title.match(/(.+?)(?:Temporada\s*(\d+).*Epis[oó]dio\s*(\d+))/i);
  if (tempEpMatch) {
    seriesName = tempEpMatch[1].trim();
    season = parseInt(tempEpMatch[2], 10);
    episode = parseInt(tempEpMatch[3], 10);
    return { seriesName, season, episode };
  }
  
  // Remove common suffixes that might contain season/episode info
  seriesName = seriesName.replace(/\s+-\s+.*$/g, '')
                         .replace(/\s+\d+x\d+.*$/g, '')
                         .replace(/\s+\(\d{4}\).*$/g, '')
                         .trim();
  
  return { seriesName, season, episode };
};

/**
 * Helper function to validate URLs
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Convert HTTP URLs to HTTPS via Google Apps Script proxy
 */
const secureHttpUrl = (url: string): string => {
  if (url && url.startsWith('http://')) {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzTWrmPw3ZBKp49-5UlNXsYI5NzxVlTwEXvgFBvEo_tz3Qf4GF_UQCz5dA6MXbj2J7I/exec";
    return `${scriptUrl}?url=${encodeURIComponent(url)}`;
  }
  return url;
};

/**
 * Parse M3U content into structured array of items
 */
export const parseM3U = (content: string): M3UItem[] => {
  const lines = content.split('\n');
  const items: M3UItem[] = [];
  
  let currentItem: Partial<M3UItem> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '') continue;
    
    if (line.startsWith('#EXTM3U')) {
      continue; // Skip the header
    }
    
    if (line.startsWith('#EXTINF')) {
      // Parse the info line
      currentItem = {};
      
      // Extract title
      const titleMatch = line.match(/,(.+)$/);
      if (titleMatch) {
        currentItem.title = titleMatch[1].trim();
      }
      
      // Extract TVG and group info
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/);
      
      if (tvgIdMatch) currentItem.tvgId = tvgIdMatch[1];
      if (tvgNameMatch) currentItem.tvgName = tvgNameMatch[1];
      if (tvgLogoMatch) {
        // Convert any HTTP logo URLs to use the proxy
        const logoUrl = tvgLogoMatch[1];
        currentItem.tvgLogo = logoUrl.startsWith('http://') ? secureHttpUrl(logoUrl) : logoUrl;
      }
      if (groupTitleMatch) currentItem.groupTitle = groupTitleMatch[1];
    } else if ((line.startsWith('http://') || line.startsWith('https://')) && currentItem) {
      // This is a URL line - validate it's actually a URL
      if (isValidUrl(line)) {
        // For HTTP URLs, convert to use the Google Apps Script proxy
        currentItem.url = line.startsWith('http://') ? secureHttpUrl(line) : line;
        
        // Add the completed item to the array
        const item = currentItem as M3UItem;
        
        // Determine content type
        item.type = determineContentType(item);
        
        items.push(item);
        currentItem = null;
      } else {
        console.warn(`Skipping invalid URL: ${line}`);
        currentItem = null;
      }
    }
  }
  
  return items;
};

export default {
  parseM3U,
  parseEpisodeTitle,
  determineContentType,
  isValidUrl,
  secureHttpUrl
};
