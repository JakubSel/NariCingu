/**
 * Kde ležia súbory príbehov (index.json, storyNNN.json, storyNNN.mp3).
 * Predvolene public/stories/, teda ./stories/ vedľa buildu. Server musí podporovať
 * HTTP Range pre MP3 (Vite dev/preview aj GitHub Pages áno), inak nefunguje posúvanie.
 */
export const STORIES_BASE_URL = `${import.meta.env.BASE_URL}stories/`;

/**
 * Pravidlá z Korean Story Lab → id pravidla v sekcii Asimilácia (public/data/assimilation.json).
 * Odkaz sa zobrazí len vtedy, ak také pravidlo v obsahu naozaj existuje.
 */
export const RULE_TO_ASSIMILATION: Record<string, string> = {
  liaison: 'liaison',
  double_final: 'batchim',
  final: 'batchim',
  nasalization: 'nasalization',
  liquidization: 'lateralization',
  aspiration: 'aspiration',
  h_deletion: 'aspiration',
  tensification: 'tensification',
  palatalization: 'palatalization',
};

/** Kľúč v localStorage: obľúbené, postup a nastavenia čítačky. */
export const STORIES_STORAGE_KEY = 'naricingu:stories:v1';
