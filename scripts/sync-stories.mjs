// Skopíruje príbehy z Korean Story Lab do public/stories a znova vytvorí index.json.
//
//   npm run sync-stories -- <priečinok alebo storyNNN.json> [ďalšie ...]
//   npm run sync-stories                 # len prepočíta index.json
//
// Z priečinka sa berú všetky *.json okrem index.json a ukážok (demo.*, štítok "demo"),
// ku každému aj jeho MP3 (pole "audio"). index.json sa skladá rovnako ako list_stories()
// v korean-story-lab/backend/storylab/core/exporter.py: len príbehy, ktorých MP3 existuje.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_VERSION = 1;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const FILE_RE = /^[A-Za-z0-9_-]{1,64}\.(json|mp3)$/;
const dest = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'stories');

const warnings = [];
let copied = 0;

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

/** Copies one story JSON and its MP3 into public/stories. */
function copyStory(jsonPath) {
  const name = basename(jsonPath);
  const story = readJson(jsonPath);
  if (!story || typeof story !== 'object' || Array.isArray(story) || !ID_RE.test(String(story.id ?? ''))) {
    return warnings.push(`${name}: nie je platný príbeh (chýba alebo je zlé "id"), preskakujem`);
  }
  if (name !== `${story.id}.json`) return warnings.push(`${name}: názov súboru nesedí s id "${story.id}", preskakujem`);
  if (story.id === 'demo' || story.tags?.includes('demo')) return warnings.push(`${name}: ukážka bez hlasu, preskakujem`);

  const audio = String(story.audio ?? '');
  if (!FILE_RE.test(audio) || !audio.endsWith('.mp3')) return warnings.push(`${name}: neplatné pole "audio" (${audio}), preskakujem`);
  const audioSrc = join(dirname(jsonPath), audio);
  if (!isFile(audioSrc)) warnings.push(`${name}: chýba ${audio}, JSON skopírujem, ale v indexe nebude`);
  else copyFileSync(audioSrc, join(dest, audio));
  copyFileSync(jsonPath, join(dest, name));
  copied++;
}

function copySource(arg) {
  const src = resolve(arg);
  if (!existsSync(src)) return warnings.push(`${arg}: neexistuje`);
  if (statSync(src).isDirectory()) {
    for (const f of readdirSync(src).sort()) {
      if (f.endsWith('.json') && f !== 'index.json') copyStory(join(src, f));
    }
  } else if (src.endsWith('.json') && basename(src) !== 'index.json') {
    copyStory(src);
  } else {
    warnings.push(`${arg}: zadaj priečinok alebo storyNNN.json`);
  }
}

/** Same entries and fields as list_stories() in the reference exporter. */
function listStories() {
  const entries = [];
  for (const f of readdirSync(dest).filter((f) => f.endsWith('.json')).sort()) {
    if (f === 'index.json') continue;
    const s = readJson(join(dest, f));
    if (!s || typeof s !== 'object' || Array.isArray(s) || !('id' in s)) continue;
    if (!isFile(join(dest, s.audio ?? ''))) continue;
    entries.push({
      id: s.id,
      file: f,
      title: s.title ?? s.id,
      titleTranslations: s.titleTranslations ?? {},
      level: s.level ?? 'A1',
      duration: s.duration ?? 0,
      sentenceCount: (s.sentences ?? []).length,
      tags: s.tags ?? [],
      created: s.created ?? null,
    });
  }
  return entries;
}

mkdirSync(dest, { recursive: true });
for (const arg of process.argv.slice(2)) copySource(arg);

const stories = listStories();
const indexPath = join(dest, 'index.json');
writeFileSync(`${indexPath}.tmp`, JSON.stringify({ version: SCHEMA_VERSION, stories }, null, 2) + '\n', 'utf8');
renameSync(`${indexPath}.tmp`, indexPath);

for (const w of warnings) console.warn(`⚠ ${w}`);
console.log(`✓ skopírované: ${copied}, v indexe: ${stories.length} (${stories.map((s) => s.id).join(', ') || 'žiadny'})`);
