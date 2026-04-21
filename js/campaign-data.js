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
      "Year 2047. First contact is confirmed.",
      "Alien ships use a typing-based control system that powers their weapons.",
      "Our team is learning that system through training missions.",
    ],
  },
  {
    badge: "THREAT ASSESSMENT // XENOTECH",
    title: "THE ALIEN ADVANTAGE",
    lines: [
      "Their system is much more efficient than ours.",
      "Speed increases output. Accuracy controls targeting.",
      "Your training prepares you to use the same input style.",
    ],
  },
  {
    badge: "OPERATION: KEYSTRIKE",
    title: "YOUR MISSION",
    lines: [
      "Complete training modules with clean typing.",
      "Defeat three boss nodes to unlock the full system.",
      "Your typing skill powers offense and defense.",
    ],
  },
];

/** Story chapters between acts (after boss victories, before next tier) */
export const CHAPTER_AFTER_BOSS = {
  0: {
    title: "ACT I - FIRST CONTACT",
    subtitle: "Relay secured",
    paragraphs: [
      "You cleared the first scout node and recovered usable signal data.",
      "Command has opened the next training block.",
      "Keep going. Harder systems are ahead.",
    ],
  },
  1: {
    title: "ACT II - DEEP SYNC",
    subtitle: "System pressure rising",
    paragraphs: [
      "The enemy network is adapting to your typing rhythm.",
      "Your clean inputs keep defensive systems online.",
      "One final command node remains.",
    ],
  },
  2: {
    title: "ACT III - LAST CARRIER",
    subtitle: "Final operation",
    paragraphs: [
      "The final carrier is online and active.",
      "This is the last sync duel in the campaign.",
      "Finish the sequence to complete the mission.",
    ],
  },
};

export const BOSSES = [
  {
    id: 0,
    codename: "SIGNAL: ORB-9",
    title: "Scout Lattice Guardian",
    tagline: "First boss node. Learn the timing and stay accurate.",
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
    tagline: "Second boss node. Speed helps, but errors are costly.",
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
