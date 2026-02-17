'use server';

import { XMLParser } from 'fast-xml-parser';

interface BGGSearchParams {
  query: string;
}

export interface BGGCandidate {
  id: string;
  name: string;
  year?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
});

const BGG_API_TOKEN = process.env.BGG_API_TOKEN;

/**
 * Helper to get BGG API headers
 */
function getBGGHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/xml',
  };
  if (BGG_API_TOKEN) {
    headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`;
  }
  return headers;
}

export async function searchBoardGame(query: string): Promise<BGGCandidate[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Search for board games (type=boardgame)
    const response = await fetch(
      `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`,
      {
        headers: getBGGHeaders(),
        next: { revalidate: 3600 },
      }, // Cache search results for 1 hour
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          'BGG API: Unauthorized. Please check your BGG_API_TOKEN in .env.local',
        );
      }
      throw new Error(`BGG API Error: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const result = parser.parse(xmlText);

    // console.log('BGG Raw Result:', JSON.stringify(result, null, 2));

    // Handle case where no items are found or single item returned
    if (!result.items || !result.items.item) {
      console.log('BGG Search: No items found for query:', query);
      return [];
    }

    const items = result.items.item;
    const candidates: BGGCandidate[] = [];
    const itemList = Array.isArray(items) ? items : [items];

    for (const item of itemList) {
      // Extract name (value attribute)
      // Name can be an array if there are multiple names (primary/alternate)
      let name = 'Unknown';
      if (Array.isArray(item.name)) {
        // console.log('Item name is array:', item.name);
        const primary = item.name.find((n: any) => n.type === 'primary');
        name = primary ? primary.value : item.name[0].value;
      } else if (item.name) {
        name = item.name.value;
      }

      // Extract year (value attribute)
      const yearObj = item.yearpublished;
      const year = yearObj?.value;

      candidates.push({
        id: item.id,
        name: name,
        year: year,
      });

      if (candidates.length >= 10) break;
    }

    // console.log('BGG Candidates found:', candidates.length);
    return candidates;
  } catch (error) {
    console.error('BGG Search Error:', error);
    return [];
  }
}

export interface BGGDetails {
  id: string;
  name: string;
  year?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playTime?: number;
  minPlayTime?: number;
  maxPlayTime?: number;
  description?: string;
  thumbnail?: string;
  image?: string;
  designers?: string[];
  artists?: string[];
  publishers?: string[];
  mechanics?: string[];
  categories?: string[];
  averageRating?: number;
  complexity?: number;
}

export async function getBoardGameDetails(
  bggId: string,
): Promise<BGGDetails | null> {
  if (!bggId) return null;

  try {
    const response = await fetch(
      `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`,
      {
        headers: getBGGHeaders(),
        next: { revalidate: 86400 },
      }, // Cache details for 24 hours
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          'BGG API: Unauthorized. Please check your BGG_API_TOKEN in .env.local',
        );
      }
      throw new Error(`BGG API Error: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const result = parser.parse(xmlText);
    const item = result.items?.item;

    if (!item) return null;

    // Handle name (primary)
    let name = 'Unknown';
    if (Array.isArray(item.name)) {
      const primary = item.name.find((n: any) => n.type === 'primary');
      name = primary ? primary.value : item.name[0].value;
    } else if (item.name) {
      name = item.name.value;
    }

    // Helper to extract array of values from link tags
    const extractLinks = (type: string) => {
      if (!item.link) return [];
      const links = Array.isArray(item.link) ? item.link : [item.link];
      return links.filter((l: any) => l.type === type).map((l: any) => l.value);
    };

    return {
      id: item.id,
      name: name,
      year: item.yearpublished ? Number(item.yearpublished.value) : undefined,
      minPlayers: item.minplayers ? Number(item.minplayers.value) : undefined,
      maxPlayers: item.maxplayers ? Number(item.maxplayers.value) : undefined,
      playTime: item.playingtime ? Number(item.playingtime.value) : undefined,
      minPlayTime: item.minplaytime
        ? Number(item.minplaytime.value)
        : undefined,
      maxPlayTime: item.maxplaytime
        ? Number(item.maxplaytime.value)
        : undefined,
      description: item.description,
      thumbnail: item.thumbnail,
      image: item.image,
      designers: extractLinks('boardgamedesigner'),
      artists: extractLinks('boardgameartist'),
      publishers: extractLinks('boardgamepublisher'),
      mechanics: extractLinks('boardgamemechanic'),
      categories: extractLinks('boardgamecategory'),
      averageRating: item.statistics?.ratings?.average?.value
        ? Number(item.statistics.ratings.average.value)
        : undefined,
      complexity: item.statistics?.ratings?.averageweight?.value
        ? Number(item.statistics.ratings.averageweight.value)
        : undefined,
    };
  } catch (error) {
    console.error('BGG Details Error:', error);
    return null;
  }
}
