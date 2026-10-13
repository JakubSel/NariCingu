// Overí štruktúru obsahu v public/data/*.json. Spusti: npm run validate
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
const errors = [];
const warn = [];

function load(name) {
  try {
    return JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8'));
  } catch (e) {
    errors.push(`${name}.json: ${e.message}`);
    return null;
  }
}

function req(obj, fields, where) {
  for (const f of fields) {
    if (obj?.[f] === undefined || obj?.[f] === '') errors.push(`${where}: chýba pole "${f}"`);
  }
}

function unique(list, key, where) {
  const seen = new Set();
  for (const x of list) {
    if (seen.has(x[key])) errors.push(`${where}: duplicitné ${key} "${x[key]}"`);
    seen.add(x[key]);
  }
}

const hangul = load('hangul');
hangul?.groups?.forEach((g, gi) => {
  req(g, ['id', 'title', 'items'], `hangul.groups[${gi}]`);
  g.items?.forEach((it) => req(it, ['char', 'name', 'rom', 'sound', 'explanation', 'slovak', 'examples'], `hangul ${g.id}/${it.char}`));
});

const pron = load('pronunciation');
if (pron) unique(pron.lessons, 'id', 'pronunciation.lessons');
pron?.lessons?.forEach((l) => {
  const w = `lekcia "${l.id}"`;
  req(l, ['id', 'title', 'subtitle', 'chars', 'summary', 'theory', 'profiles', 'tips', 'comparison', 'minimalSets'], w);
  l.comparison?.forEach((r, i) => {
    if (r.syllables?.length !== l.chars?.length) errors.push(`${w}: comparison[${i}] má ${r.syllables?.length} slabík, chars má ${l.chars?.length}`);
  });
  l.profiles?.forEach((p) => !l.chars.includes(p.char) && errors.push(`${w}: profil ${p.char} nie je v chars`));
  l.minimalSets?.forEach((s, i) => {
    if ((s.items?.length ?? 0) < 2) errors.push(`${w}: minimalSets[${i}] potrebuje aspoň 2 položky`);
    s.items?.forEach((it) => {
      req(it, ['ko', 'sk', 'char'], `${w} minimalSets[${i}]`);
      if (!l.chars.includes(it.char)) errors.push(`${w}: minimalSets[${i}] "${it.ko}" má char ${it.char}, ktorý nie je v chars`);
    });
  });
});

const assim = load('assimilation');
if (assim) unique(assim.rules, 'id', 'assimilation.rules');
assim?.rules?.forEach((r) => {
  req(r, ['id', 'title', 'korean', 'short', 'explanation', 'pattern', 'examples'], `pravidlo "${r.id}"`);
  r.examples?.forEach((e) => {
    const w = `pravidlo "${r.id}" / ${e.written}`;
    req(e, ['written', 'meaning', 'naive', 'actual', 'actualRom', 'explanation', 'distractors'], w);
    if ((e.distractors?.length ?? 0) < 1) errors.push(`${w}: potrebuje aspoň 1 distractor`);
    if (e.distractors?.includes(e.actual)) errors.push(`${w}: distractor sa zhoduje so správnou odpoveďou`);
    if (new Set(e.distractors).size !== e.distractors?.length) errors.push(`${w}: duplicitné distractors`);
  });
});

const vocab = load('vocabulary');
if (vocab) unique(vocab.categories, 'id', 'vocabulary.categories');
const allWords = new Map();
vocab?.categories?.forEach((c) => {
  req(c, ['id', 'title', 'icon', 'description', 'words'], `kategória "${c.id}"`);
  if ((c.words?.length ?? 0) < 4) warn.push(`kategória "${c.id}" má menej ako 4 slová – kvíz si požičia možnosti z iných kategórií`);
  c.words?.forEach((w) => {
    req(w, ['ko', 'sk', 'pron', 'rom', 'example'], `slovo ${c.id}/${w.ko}`);
    req(w.example, ['ko', 'sk'], `slovo ${c.id}/${w.ko} example`);
    if (allWords.has(w.ko)) warn.push(`slovo "${w.ko}" je v kategóriách ${allWords.get(w.ko)} aj ${c.id}`);
    allWords.set(w.ko, c.id);
  });
});

const listening = load('listening');
if (listening) {
  unique(listening.levels, 'id', 'listening.levels');
  unique(listening.exercises, 'id', 'listening.exercises');
  const types = ['sounds', 'words', 'meaning', 'pairs', 'assimilation'];
  listening.exercises.forEach((e) => {
    req(e, ['id', 'type', 'title', 'description', 'icon'], `cvičenie "${e.id}"`);
    if (!types.includes(e.type)) errors.push(`cvičenie "${e.id}": neznámy typ "${e.type}" (povolené: ${types.join(', ')})`);
  });
  listening.levels.forEach((l) => {
    req(l, ['id', 'title', 'description', 'options', 'rate', 'questions'], `úroveň "${l.id}"`);
    if (!listening.soundSets?.[l.id]) warn.push(`úroveň "${l.id}" nemá soundSets – použije sa prvá sada`);
  });
  Object.entries(listening.soundSets ?? {}).forEach(([k, sets]) =>
    sets.forEach((s, i) => {
      if (s.length < 2) errors.push(`soundSets.${k}[${i}] potrebuje aspoň 2 slabiky`);
      if (new Set(s).size !== s.length) errors.push(`soundSets.${k}[${i}] obsahuje duplicity`);
    }),
  );
}

warn.forEach((w) => console.warn('⚠ ' + w));
if (errors.length) {
  errors.forEach((e) => console.error('✖ ' + e));
  console.error(`\n${errors.length} chýb v obsahu.`);
  process.exit(1);
}
console.log('✔ Obsah je v poriadku.');
