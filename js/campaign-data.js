/** Unified sidebar: training modules + boss encounters */
export function buildCampaignList() {
  const items = [];
  for (let i = 0; i < 20; i++) {
    items.push({ kind: "module", moduleIndex: i });
    if (i === 5) items.push({ kind: "boss", bossId: 0 });
    if (i === 12) items.push({ kind: "boss", bossId: 1 });
    if (i === 19) items.push({ kind: "boss", bossId: 2 });
  }
  return items;
}

/** Full-screen intro: sequential beats (GSAP reveals) */
export const INTRO_SCENES = [
  {
    badge: "FEDERAL BUREAU OF INVESTIGATION",
    title: "CLASSIFIED BRIEFING",
    lines: [
      "Year 2047. Deep-space telemetry went dark — then the skies lit up.",
      "They are not here to negotiate. Their ships run on something we barely understand:",
      "glyph-charged lattices powered entirely by keystroke resonance.",
    ],
  },
  {
    badge: "THREAT ASSESSMENT // XENOTECH",
    title: "THE ALIEN ADVANTAGE",
    lines: [
      "Their grids and weapons are roughly ten times more efficient than ours.",
      "Every strike is keyed to typing velocity and precision — speed is firepower; accuracy is targeting.",
      "Earth defense is buying time. You are the adaptation program.",
    ],
  },
  {
    badge: "OPERATION: KEYSTRIKE",
    title: "YOUR MISSION",
    lines: [
      "You will learn their foreign input protocols — mapped to our QWERTY lattice for now.",
      "Complete each training node flawlessly. Survive three war-grade sync duels.",
      "When the final carrier falls silent, we take their typing tech — or we lose the planet.",
    ],
  },
];

/** Story chapters between acts (after boss victories, before next tier) */
export const CHAPTER_AFTER_BOSS = {
  0: {
    title: "ACT I — FIRST CONTACT",
    subtitle: "The relay splinters",
    paragraphs: [
      "You punched through the scout node's outer shell. Raw alien ciphertext flooded the channel — then stabilized into something your hands almost recognize.",
      "HQ is screaming for a full dump. The enemy already retasked a hunter wing toward your grid signature.",
      "The war just learned your name. Keep typing — the next lock is deeper.",
    ],
  },
  1: {
    title: "ACT II — DEEP SYNC",
    subtitle: "They escalate",
    paragraphs: [
      "That wasn't a glitch — it was a handshake. The hive felt you mirror their rhythm.",
      "Their battle lattice is rewriting local physics. Every correct pulse you send buys a city block another minute of power.",
      "One more bastion stands between their flagship and continental command.",
    ],
  },
  2: {
    title: "ACT III — LAST CARRIER",
    subtitle: "Endgame",
    paragraphs: [
      "The final carrier unfurls like a wound in the sky. Its weapon trees drink from the same typing wells you have been learning to steal.",
      "This is the sync duel that decides if Earth adopts their approach — or vanishes trying.",
      "No backup keystrokes. No second Earth. Finish the lattice.",
    ],
  },
};

export const BOSSES = [
  {
    id: 0,
    codename: "SIGNAL: ORB-9",
    title: "Scout Lattice Guardian",
    tagline: "First alien keystrike node — fragile but lethal if you fumble.",
    bossMaxHp: 100,
    playerMaxHp: 100,
    phases: [
      { text: "sync breach alpha lock grid nine" },
      { text: "alien pulse routed through our shell" },
      { text: "hold the line agent keystrike holds" },
    ],
  },
  {
    id: 1,
    codename: "SIGNAL: TOWER-PRIME",
    title: "Bastion Typing Core",
    tagline: "Heavy interference — speed feeds your weapon lattice; errors cost blood.",
    bossMaxHp: 140,
    playerMaxHp: 100,
    phases: [
      { text: "continental relay under xenotech siege now" },
      { text: "typing velocity converts to strike yield confirm" },
      { text: "accuracy keeps targeting locked do not drift agent" },
    ],
  },
  {
    id: 2,
    codename: "SIGNAL: MOTHERSHIP",
    title: "Carrier Command Duel",
    tagline: "Final sync. Their flagship waits for one clean lattice collapse.",
    bossMaxHp: 180,
    playerMaxHp: 100,
    phases: [
      { text: "the flagship drinks keystrokes to aim its burning arc" },
      { text: "we mirror their foreign typing tech until it becomes ours" },
      { text: "speed is power accuracy is truth end this war keystrike" },
    ],
  },
];
