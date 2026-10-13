# NariCingu – tréner kórejskej výslovnosti

Webová aplikácia pre slovenských študentov kórejčiny. Nezameriava sa na slovíčka, ale na **sluch**:
rozlíšiť ㄱ / ㄲ / ㅋ, pochopiť asimiláciu (한국말 → [한궁말]) a rozumieť skutočnej reči.

**🌐 Aplikácia: https://jakubsel.github.io/NariCingu/**

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

## Pokrok

Ukladá sa v `localStorage` (`naricingu:progress:v1`, `naricingu:settings`). V Nastaveniach sa dá
stiahnuť záloha, načítať ju na inom zariadení alebo pokrok vymazať.

## Licencia

© 2026 JakubSel. Všetky práva vyhradené. Kód je verejný iba na nahliadnutie – bez písomného súhlasu
autora ho nie je dovolené používať, kopírovať, upravovať ani šíriť. Používanie
[aplikácie](https://jakubsel.github.io/NariCingu/) na osobné učenie je povolené. Podrobnosti v [LICENSE](LICENSE).
