export interface SampleDocument {
  id: string;
  title: string;
  category: string;
  sourceLang: string;
  targetLang: string;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'sample-novel-fantasy',
    title: 'The Chronicles of Eldoria: Chapter 1',
    category: 'Fantasy Novel',
    sourceLang: 'en',
    targetLang: 'ur',
    text: `Chapter 1: The Whispering Pines

Alex looked toward the dark forest. The autumn wind whistled through the ancient canopy of Eldoria, carrying the scent of damp moss and impending storm.

"We need to leave now," Kael whispered, his hand tightening around the hilt of Nightfang. The obsidian dagger pulsed with a faint violet hum, sensing the disturbance in the veil.

"Not until we find the talisman," Alex replied, stepping over a tangle of thorny briars. His heart hammered against his ribs. Five leagues south, the vanguard of the Iron Dominion was already burning the border villages. If the Sunken Vault fell into their hands, the entire kingdom would crumble before sunrise.

Suddenly, the shadows between two towering cedars detached themselves from the darkness. A guttural growl vibrated through the earth. Three shadow wolves, their eyes glowing like dying embers, crept into the moonlight.

"Get behind me!" Kael barked. He channeled the ether within his meridians, activating his signature technique—Shadow Burst.

A shockwave of dark energy erupted from his palm, hurling the lead wolf against a granite boulder. The air crackled with raw magical ozone.

Alex drew his short sword, his knuckles pale. "There are more of them coming from the ridge!"

"Then we make our stand here," Kael said with a grim smile. "Remember what the Grandmaster taught us in Valenor: fear is merely the illusion that fate cannot be rewritten."`,
  },
  {
    id: 'sample-novel-mystery',
    title: 'The Clockmaker of Vienna: Chapter 1',
    category: 'Mystery / Historical',
    sourceLang: 'en',
    targetLang: 'ur',
    text: `Chapter 1: Midnight on Herrengasse

The rain over Vienna was relentless, turning the cobblestone avenues into dark mirrors reflecting the amber glow of gaslamps.

Inspector Marcus Vance adjusted the collar of his woolen trench coat as he ducked beneath the arched entryway of number fourteen. Inside, the rhythmic ticking of forty antique clocks created an eerie, hypnotic cadence.

"He was found at ten past nine, Herr Inspector," Sergeant Bauer murmured, pointing a gloved finger toward the mahogany workbench in the parlor.

Slumped across the brass gears of a celestial automaton was Heinrich Vogel. In his cold, stiffened fingers, the old master horologist clutched a silver pocket watch whose hands had been deliberately pried loose and arranged into an inverted cross.

"A message," Marcus said softly, examining the peculiar engraving on the watch casing. "Not a robbery. Look at the gold sovereigns still sitting in the open drawer."

"Who would murder a harmless craftsman?" Bauer asked, glancing uneasily at the pendulum swinging above them.

"Someone who knew that Vogel wasn't just repairing clocks," Marcus replied, gently lifting a leather-bound journal hidden beneath the floorboards. "He was calculating the countdown to an assassination."`,
  },
];
