# NariCingu – Korean Pronunciation Trainer

**[English](#english) · [Slovensky](#slovensky)**

<a id="english"></a>

## 🇬🇧 English

A web application for Slovak learners of Korean. It focuses not on vocabulary but on **listening**:
telling ㄱ / ㄲ / ㅋ apart, understanding assimilation (한국말 → [한궁말]) and understanding real speech.

**🌐 App: https://jakubsel.github.io/NariCingu/**

React + TypeScript + Vite + Tailwind CSS. No backend – content is stored in JSON files, progress in `localStorage`.

### Getting started

```bash
npm install
npm run dev        # development server
npm run validate   # validate content in public/data/*.json
npm run build      # production build into dist/
npm run preview    # preview the build
```

### Sections

| Section | Contents |
| --- | --- |
| **Dashboard** | continue learning, daily plan, problem sounds and confusions, progress, statistics, day streak |
| **Hangul** | consonants, vowels, diphthongs – pronunciation, Slovak equivalent, examples, quiz |
| **Pronunciation trainer** | lessons ㄱㄲㅋ, ㄷㄸㅌ, ㅂㅃㅍ, ㅈㅉㅊ, ㅅㅆ (+ bonus ㅓㅗㅜㅡ): theory, comparison, quiz, minimal pairs, “same/different”, progress |
| **Assimilation** | 받침, nasalization, liaison, tensification, aspiration, palatalization, lateralization, spoken changes |
| **Listening training** | 5 exercise types × 3 levels, no visual hints |
| **Writing** | handwriting on a canvas – dictation or from pronunciation, the correct form appears in the background |
| **Vocabulary** | 6 categories, actual pronunciation, example sentences, quizzes |
| **Stories** | short Korean stories with a real voice: the current sentence is highlighted, click a sentence to jump, repeat a sentence, speed 0.75–1.25×, Slovak translation and pronunciation notes |

Quizzes adapt to the learner: sounds you get wrong appear more often. After a mistake, the correct sound
and your choice are played back to back for comparison. Mistakes can be repeated right away.

### Audio

By default the browser’s speech synthesis is used (`speechSynthesis`, `ko-KR`). Chrome or Edge work best.
To use your own recordings, put them into `public/audio/` and add an `audio` field to the item in JSON:

```json
{ "ko": "달", "sk": "mesiac", "char": "ㄷ", "audio": "audio/dal.mp3" }
```

If a recording is missing or fails to load, speech synthesis is used automatically.

### Stories

Stories are made in the separate Korean Story Lab app. Each story is `storyNNN.json` + `storyNNN.mp3`
in `public/stories/`, listed in `public/stories/index.json`. To add or update stories:

```bash
npm run sync-stories -- C:/path/to/korean-story-lab/data/stories                # the whole folder
npm run sync-stories -- C:/path/to/korean-story-lab/data/stories/story005.json  # a single story
npm run sync-stories                                                            # only rebuild index.json
```

The script copies each JSON with its MP3 (skipping `demo.*` and stories tagged `demo`) and rebuilds
`index.json` from the files in `public/stories/`. Only stories whose MP3 exists are listed.
Don't edit `index.json` by hand.

### Progress

Stored in `localStorage` (`naricingu:progress:v1`, `naricingu:settings`, `naricingu:stories:v1` for stories). In Settings you can download
a backup, load it on another device, or reset your progress.

### License

© 2026 JakubSel. All rights reserved. The source code is public for viewing only – it may not be used,
copied, modified or distributed without the author’s written permission. Using the
[app](https://jakubsel.github.io/NariCingu/) for personal learning is permitted. See [LICENSE](LICENSE) for details.

---

<a id="slovensky"></a>

## 🇸🇰 Slovensky

### NariCingu – tréner kórejskej výslovnosti

Webová aplikácia pre slovenských študentov kórejčiny. Nezameriava sa na slovíčka, ale na **sluch**:
rozlíšiť ㄱ / ㄲ / ㅋ, pochopiť asimiláciu (한국말 → [한궁말]) a rozumieť skutočnej reči.

**🌐 Aplikácia: https://jakubsel.github.io/NariCingu/**

React + TypeScript + Vite + Tailwind CSS. Bez backendu – obsah je v JSON súboroch, pokrok v `localStorage`.

### Spustenie

```bash
npm install
npm run dev        # vývojový server
npm run validate   # kontrola obsahu v public/data/*.json
npm run build      # produkčný build do dist/
npm run preview    # náhľad buildu
```

### Sekcie

| Sekcia | Čo obsahuje |
| --- | --- |
| **Prehľad** | pokračovanie, denný plán, problematické zvuky a zámeny, pokrok, štatistiky, séria dní |
| **Hangul** | spoluhlásky, samohlásky, dvojhlásky – výslovnosť, slovenský ekvivalent, príklady, kvíz |
| **Tréner výslovnosti** | lekcie ㄱㄲㅋ, ㄷㄸㅌ, ㅂㅃㅍ, ㅈㅉㅊ, ㅅㅆ (+ bonus ㅓㅗㅜㅡ): teória, porovnanie, kvíz, minimálne páry, „rovnaké/rozdielne“, pokrok |
| **Asimilácia** | 받침, nazalizácia, spojenie, tenzifikácia, aspirácia, palatalizácia, lateralizácia, hovorené zmeny |
| **Tréning počúvania** | 5 typov cvičení × 3 úrovne, bez vizuálnych nápovied |
| **Písanie** | písanie rukou na plátne – diktát alebo podľa výslovnosti, správny tvar sa ukáže na pozadí |
| **Slovná zásoba** | 6 kategórií, skutočná výslovnosť, príkladové vety, kvízy |
| **Príbehy** | krátke kórejské príbehy s ozajstným hlasom: zvýraznená aktuálna veta, skok na vetu kliknutím, opakovanie vety, rýchlosť 0,75–1,25×, slovenský preklad a poznámky k výslovnosti |

Kvízy sa prispôsobujú: zvuky, pri ktorých sa mýliš, sa objavujú častejšie. Po chybe sa automaticky
prehrá správny zvuk a tvoja voľba za sebou na porovnanie. Chyby sa dajú hneď zopakovať.

### Zvuk

Predvolene sa používa syntéza reči prehliadača (`speechSynthesis`, `ko-KR`). Najlepšie funguje Chrome alebo Edge.
Ak chceš použiť vlastné nahrávky, ulož ich do `public/audio/` a pridaj k položke v JSON pole `audio`:

```json
{ "ko": "달", "sk": "mesiac", "char": "ㄷ", "audio": "audio/dal.mp3" }
```

Ak nahrávka chýba alebo sa nenačíta, automaticky sa použije syntéza reči.

### Príbehy

Príbehy vznikajú v samostatnej aplikácii Korean Story Lab. Každý príbeh je `storyNNN.json` + `storyNNN.mp3`
v `public/stories/` a zoznam je v `public/stories/index.json`. Pridanie alebo aktualizácia:

```bash
npm run sync-stories -- C:/cesta/ku/korean-story-lab/data/stories                # celý priečinok
npm run sync-stories -- C:/cesta/ku/korean-story-lab/data/stories/story005.json  # jeden príbeh
npm run sync-stories                                                             # len prepočítať index.json
```

Skript skopíruje každý JSON aj s MP3 (vynechá `demo.*` a príbehy so štítkom `demo`) a znova vytvorí
`index.json` zo súborov v `public/stories/`. V zozname sú len príbehy, ktorých MP3 existuje.
`index.json` neupravuj ručne.

### Pokrok

Ukladá sa v `localStorage` (`naricingu:progress:v1`, `naricingu:settings`, pri príbehoch `naricingu:stories:v1`). V Nastaveniach sa dá
stiahnuť záloha, načítať ju na inom zariadení alebo pokrok vymazať.

### Licencia

© 2026 JakubSel. Všetky práva vyhradené. Kód je verejný iba na nahliadnutie – bez písomného súhlasu
autora ho nie je dovolené používať, kopírovať, upravovať ani šíriť. Používanie
[aplikácie](https://jakubsel.github.io/NariCingu/) na osobné učenie je povolené. Podrobnosti v [LICENSE](LICENSE).
