// Texty čítačky. Aplikácia je len po slovensky, preto je tu iba jeden slovník;
// useT() ostáva, aby sa dal neskôr doplniť ďalší jazyk bez zmien v komponentoch.

const sk = {
  title: 'Príbehy',
  tagline: 'Počúvaj, čítaj a sleduj, ako sa kórejčina naozaj vyslovuje.',
  all: 'Všetky',
  favorites: 'Obľúbené',
  levelFilter: 'Úroveň',
  emptyTitle: 'Zatiaľ tu nie je žiadny príbeh',
  emptyBody: 'Príbehy pribudnú čoskoro.',
  noMatch: 'Tomuto filtru nezodpovedá žiadny príbeh.',
  loading: 'Načítavam…',
  loadError: 'Nepodarilo sa načítať zoznam príbehov',
  storyError: 'Príbeh sa nepodarilo načítať',
  sentences: (n: number) => `${n} ${n === 1 ? 'veta' : n > 1 && n < 5 ? 'vety' : 'viet'}`,
  completed: 'Dočítané',
  notStarted: 'Nové',
  back: 'Príbehy',
  translation: 'Preklad',
  pronunciation: 'Výslovnosť',
  play: 'Prehrať',
  pause: 'Pozastaviť',
  prev: 'Predchádzajúca veta',
  next: 'Ďalšia veta',
  restart: 'Od začiatku',
  loop: 'Opakovať vetu',
  speed: 'Rýchlosť',
  seek: 'Pozícia v nahrávke',
  favoriteAdd: 'Pridať do obľúbených',
  favoriteRemove: 'Odobrať z obľúbených',
  resume: (t: string) => `Pokračuješ od ${t}`,
  demo: 'Ukážka bez hlasu',
  shortcuts: 'Medzerník prehrá/pozastaví, šípky prepínajú vety, R opakuje vetu, T preklad, P výslovnosť.',
  // Rovnaké názvy ako v sekcii Asimilácia (public/data/assimilation.json).
  rules: {
    liaison: 'spojenie',
    double_final: 'dvojitý 받침',
    final: 'koncová spoluhláska (받침)',
    nasalization: 'nazalizácia',
    liquidization: 'lateralizácia',
    aspiration: 'aspirácia',
    tensification: 'tenzifikácia',
    palatalization: 'palatalizácia',
    h_deletion: 'zánik ㅎ',
    vowel: 'samohláska ㅢ',
  } as Record<string, string>,
  ruleLink: (name: string) => `Vysvetlenie pravidla: ${name}`,
};

export type T = typeof sk;

export function useT(): T {
  return sk;
}
