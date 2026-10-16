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

Quizzes adapt to the learner: sounds you get wrong appear more often. After a mistake, the correct sound
and your choice are played back to back for comparison. Mistakes can be repeated right away.

### Audio

By default the browser’s speech synthesis is used (`speechSynthesis`, `ko-KR`). Chrome or Edge work best.
To use your own recordings, put them into `public/audio/` and add an `audio` field to the item in JSON:

```json
{ "ko": "달", "sk": "mesiac", "char": "ㄷ", "audio": "audio/dal.mp3" }
```

If a recording is missing or fails to load, speech synthesis is used automatically.

### Progress

Stored in `localStorage` (`naricingu:progress:v1`, `naricingu:settings`). In Settings you can download
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

Kvízy sa prispôsobujú: zvuky, pri ktorých sa mýliš, sa objavujú častejšie. Po chybe sa automaticky
prehrá správny zvuk a tvoja voľba za sebou na porovnanie. Chyby sa dajú hneď zopakovať.

### Zvuk

Predvolene sa používa syntéza reči prehliadača (`speechSynthesis`, `ko-KR`). Najlepšie funguje Chrome alebo Edge.
Ak chceš použiť vlastné nahrávky, ulož ich do `public/audio/` a pridaj k položke v JSON pole `audio`:

```json
{ "ko": "달", "sk": "mesiac", "char": "ㄷ", "audio": "audio/dal.mp3" }
```

Ak nahrávka chýba alebo sa nenačíta, automaticky sa použije syntéza reči.

### Pokrok

Ukladá sa v `localStorage` (`naricingu:progress:v1`, `naricingu:settings`). V Nastaveniach sa dá
stiahnuť záloha, načítať ju na inom zariadení alebo pokrok vymazať.

### Licencia

© 2026 JakubSel. Všetky práva vyhradené. Kód je verejný iba na nahliadnutie – bez písomného súhlasu
autora ho nie je dovolené používať, kopírovať, upravovať ani šíriť. Používanie
[aplikácie](https://jakubsel.github.io/NariCingu/) na osobné učenie je povolené. Podrobnosti v [LICENSE](LICENSE).
