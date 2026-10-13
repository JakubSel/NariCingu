# NariCingu – tréner kórejskej výslovnosti

Webová aplikácia pre slovenských študentov kórejčiny. Nezameriava sa na slovíčka, ale na **sluch**:
rozlíšiť ㄱ / ㄲ / ㅋ, pochopiť asimiláciu (한국말 → [한궁말]) a rozumieť skutočnej reči.

React + TypeScript + Vite + Tailwind CSS. Bez backendu – obsah je v JSON súboroch, pokrok v `localStorage`.

## Spustenie

```bash
npm install
npm run dev        # vývojový server
npm run validate   # kontrola obsahu v public/data/*.json
npm run build      # produkčný build do dist/
npm run preview    # náhľad buildu
```

## Sekcie

| Sekcia | Čo obsahuje |
| --- | --- |
| **Prehľad** | pokračovanie, denný plán, problematické zvuky a zámeny, pokrok, štatistiky, séria dní |
| **Hangul** | spoluhlásky, samohlásky, dvojhlásky – výslovnosť, slovenský ekvivalent, príklady, kvíz |
| **Tréner výslovnosti** | lekcie ㄱㄲㅋ, ㄷㄸㅌ, ㅂㅃㅍ, ㅈㅉㅊ, ㅅㅆ (+ bonus ㅓㅗㅜㅡ): teória, porovnanie, kvíz, minimálne páry, „rovnaké/rozdielne“, pokrok |
| **Asimilácia** | 받침, nazalizácia, spojenie, tenzifikácia, aspirácia, palatalizácia, lateralizácia, hovorené zmeny |
| **Tréning počúvania** | 5 typov cvičení × 3 úrovne, bez vizuálnych nápovied |
| **Slovná zásoba** | 6 kategórií, skutočná výslovnosť, príkladové vety, kvízy |

Kvízy sa prispôsobujú: zvuky, pri ktorých sa mýliš, sa objavujú častejšie. Po chybe sa automaticky
prehrá správny zvuk a tvoja voľba za sebou na porovnanie. Chyby sa dajú hneď zopakovať.

## Zvuk

Predvolene sa používa syntéza reči prehliadača (`speechSynthesis`, `ko-KR`). Najlepšie funguje Chrome alebo Edge.
Ak chceš použiť vlastné nahrávky, ulož ich do `public/audio/` a pridaj k položke v JSON pole `audio`:

```json
{ "ko": "달", "sk": "mesiac", "char": "ㄷ", "audio": "audio/dal.mp3" }
```

Ak nahrávka chýba alebo sa nenačíta, automaticky sa použije syntéza reči.

## Pridávanie obsahu (bez zmien kódu)

Všetok obsah je v `public/data/`. Po úprave spusti `npm run validate`.
V produkčnom builde sú súbory v `dist/data/` – dajú sa upravovať aj priamo na hostingu.

- **`pronunciation.json`** – lekcie trénera. Nová lekcia = nový objekt v `lessons`.
  `comparison[].syllables` musí mať rovnaký počet prvkov ako `chars` (poradie zodpovedá `chars`).
  Každá položka v `minimalSets` má `char` = zvuk, ktorým sa líši.
- **`assimilation.json`** – pravidlá a príklady. `actual` je skutočná výslovnosť (bez zátvoriek),
  `distractors` sú nesprávne možnosti do kvízu. `audioText` (voliteľné) = čo sa má prehrať,
  ak sa líši od písanej podoby (napr. hovorové tvary).
- **`hangul.json`** – skupiny znakov. `sound` = slabika, ktorá sa prehrá. `quizExclude` = znaky,
  ktoré znejú rovnako a nemajú byť v kvíze spolu (napr. ㅐ/ㅔ).
- **`vocabulary.json`** – kategórie a slová. `pron` = výslovnosť v Hangule.
- **`listening.json`** – úrovne, cvičenia a sady slabík pre rozpoznávanie zvukov.
  Nové cvičenie môže použiť existujúci `type` (`sounds`, `words`, `meaning`, `pairs`, `assimilation`)
  a obmedziť obsah cez `categories`, `rules` alebo `lessons`.

## Nasadenie na GitHub Pages

Repozitár obsahuje workflow `.github/workflows/deploy.yml`. Stačí:

1. pushnúť do vetvy `main`,
2. v GitHube zapnúť **Settings → Pages → Source: GitHub Actions**.

Aplikácia používa relatívne cesty (`base: './'`) a hash routing, takže funguje v akomkoľvek podadresári
a obnovenie stránky nikdy nevráti 404.

## Pokrok

Ukladá sa v `localStorage` (`naricingu:progress:v1`, `naricingu:settings`). V Nastaveniach sa dá
stiahnuť záloha, načítať ju na inom zariadení alebo pokrok vymazať.
