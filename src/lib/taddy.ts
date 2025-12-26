const TADDY_API_URL = "https://api.taddy.org";

interface TaddyResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

/**
 * Execute a GraphQL query against the Taddy API.
 */
export async function taddyQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const userId = process.env.TADDY_USER_ID;
  const apiKey = process.env.TADDY_API_KEY;

  if (!userId || !apiKey) {
    throw new Error("TADDY_USER_ID and TADDY_API_KEY must be set");
  }

  const response = await fetch(TADDY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-USER-ID": userId,
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Taddy API error: ${response.status} ${response.statusText}`,
    );
  }

  const result: TaddyResponse<T> = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(`Taddy API error: ${result.errors[0].message}`);
  }

  return result.data;
}

// =============================================================================
// Types
// =============================================================================

export interface TaddyPodcast {
  uuid: string;
  name: string;
  description: string | null;
  authorName: string | null;
  imageUrl: string | null;
  itunesId: number | null;
  rssUrl: string | null;
  language: string | null;
  totalEpisodesCount: number | null;
  genres: string[] | null;
}

export interface TaddyEpisode {
  uuid: string;
  name: string;
  description: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  duration: number | null;
  datePublished: number | null; // epoch seconds
  seasonNumber: number | null;
  episodeNumber: number | null;
  guid: string | null;
}

export interface TaddyTranscriptItem {
  text: string;
  startTime: number;
  endTime: number;
  speaker: string | null;
}

// =============================================================================
// Queries
// =============================================================================

const SEARCH_PODCASTS_QUERY = `
  query SearchPodcasts($term: String!, $limitPerPage: Int) {
    searchForTerm(term: $term, filterForTypes: PODCASTSERIES, limitPerPage: $limitPerPage) {
      searchId
      podcastSeries {
        uuid
        name
        description
        authorName
        imageUrl
        itunesId
        totalEpisodesCount
        genres
      }
    }
  }
`;

const GET_PODCAST_QUERY = `
  query GetPodcast($uuid: ID!) {
    getPodcastSeries(uuid: $uuid) {
      uuid
      name
      description
      authorName
      imageUrl
      itunesId
      rssUrl
      language
      totalEpisodesCount
      genres
    }
  }
`;

const GET_EPISODES_QUERY = `
  query GetEpisodes($uuid: ID!, $page: Int!, $limitPerPage: Int!) {
    getPodcastSeries(uuid: $uuid) {
      uuid
      name
      episodes(page: $page, limitPerPage: $limitPerPage, sortOrder: LATEST) {
        uuid
        name
        description
        audioUrl
        imageUrl
        duration
        datePublished
        seasonNumber
        episodeNumber
        guid
      }
    }
  }
`;

const GET_EPISODE_TRANSCRIPT_QUERY = `
  query GetEpisodeTranscript($uuid: ID!) {
    getPodcastEpisode(uuid: $uuid) {
      uuid
      name
      taddyTranscribeStatus
      transcript
      transcriptWithSpeakersAndTimecodes {
        text
        startTime
        endTime
        speaker
      }
    }
  }
`;

// =============================================================================
// API Functions
// =============================================================================

interface SearchPodcastsResult {
  searchForTerm: {
    searchId: string;
    podcastSeries: TaddyPodcast[];
  };
}

/**
 * Search for podcasts by term.
 */
export async function searchPodcasts(
  term: string,
  limit: number = 20,
): Promise<TaddyPodcast[]> {
  const data = await taddyQuery<SearchPodcastsResult>(SEARCH_PODCASTS_QUERY, {
    term,
    limitPerPage: limit,
  });
  return data.searchForTerm.podcastSeries;
}

interface GetPodcastResult {
  getPodcastSeries: TaddyPodcast;
}

/**
 * Get a podcast by its Taddy UUID.
 */
export async function getPodcast(uuid: string): Promise<TaddyPodcast> {
  const data = await taddyQuery<GetPodcastResult>(GET_PODCAST_QUERY, { uuid });
  return data.getPodcastSeries;
}

interface GetEpisodesResult {
  getPodcastSeries: {
    uuid: string;
    name: string;
    episodes: TaddyEpisode[];
  };
}

/**
 * Get episodes for a podcast with pagination.
 */
export async function getEpisodes(
  podcastUuid: string,
  page: number = 1,
  limit: number = 25,
): Promise<TaddyEpisode[]> {
  const data = await taddyQuery<GetEpisodesResult>(GET_EPISODES_QUERY, {
    uuid: podcastUuid,
    page,
    limitPerPage: limit,
  });
  return data.getPodcastSeries.episodes;
}

interface GetEpisodeTranscriptResult {
  getPodcastEpisode: {
    uuid: string;
    name: string;
    taddyTranscribeStatus: string | null;
    transcript: string | null;
    transcriptWithSpeakersAndTimecodes: TaddyTranscriptItem[] | null;
  };
}

/**
 * Get transcript for an episode.
 * Returns null if transcript is not available.
 */
export async function getEpisodeTranscript(uuid: string): Promise<{
  status: string | null;
  transcript: string | null;
  segments: TaddyTranscriptItem[] | null;
} | null> {
  const data = await taddyQuery<GetEpisodeTranscriptResult>(
    GET_EPISODE_TRANSCRIPT_QUERY,
    { uuid },
  );

  const episode = data.getPodcastEpisode;

  return {
    status: episode.taddyTranscribeStatus,
    transcript: episode.transcript,
    segments: episode.transcriptWithSpeakersAndTimecodes,
  };
}
