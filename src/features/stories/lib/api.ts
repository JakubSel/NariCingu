import { STORIES_BASE_URL } from '../config';
import type { Story, StoryIndex } from '../types';

// Static story files only (public/stories, copied there by `npm run sync-stories`).

export const storyAsset = (file: string) => `${STORIES_BASE_URL}${file}`;

/** The MP3 URL keeps its name after regeneration, so `created` busts the cache. */
export const storyAudio = (story: Pick<Story, 'audio' | 'created'>) =>
  story.created ? `${storyAsset(story.audio)}?v=${encodeURIComponent(story.created)}` : storyAsset(story.audio);

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(storyAsset(file), { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const fetchIndex = () => getJson<StoryIndex>('index.json');

export async function fetchStory(id: string): Promise<Story> {
  const story = await getJson<Story>(`${id}.json`);
  story.sentences.sort((a, b) => a.start - b.start);
  return story;
}
