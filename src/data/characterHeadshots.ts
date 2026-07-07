export type CharacterHeadshot = {
  id: string;
  image: string;
};

const HEADSHOT_COUNT = 8;

export const CHARACTER_HEADSHOTS: CharacterHeadshot[] = Array.from(
  { length: HEADSHOT_COUNT },
  (_, i) => ({
    id: `prof_${i + 1}`,
    image: `/storyboards/character_headshots/prof_${i + 1}.png`
  })
);

export function getCharacterHeadshot(id: string): CharacterHeadshot | undefined {
  return CHARACTER_HEADSHOTS.find((h) => h.id === id);
}
