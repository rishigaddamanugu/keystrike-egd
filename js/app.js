import {
  fingerForChar,
  KEYBOARD_LAYOUT,
  keyElementMatchesChar,
} from "./finger-map.js";
import { LEVELS } from "./levels.js";
import {
  buildCampaignList,
  INTRO_SCENES,
  CHAPTER_AFTER_BOSS,
  BOSSES,
} from "./campaign-data.js";
import { BossFight } from "./boss-fight.js";
import { createCinematicController } from "./story-ui.js";
import { gameFx } from "./game-fx.js";

const STORAGE_KEY = "keystrike-progress-v2";
const LEGACY_KEY = "keystrike-progress-v1";

const FINGER_LABELS = {
  LP: "Left pinky",
  LR: "Left ring",
  LM: "Left middle",
  LI: "Left index",
  RI: "Right index",
  RM: "Right middle",
  RR: "Right ring",
  RP: "Right pinky",
  TH: "Thumbs — space bar",
};

function shiftComboForChar(ch) {
  for (const section of KEYBOARD_LAYOUT) {
    for (const def of section.row) {
      if (def.s && def.s === ch) {
        const base = def.k === " " ? "space" : def.k;
        return `Shift + ${base}`;
      }
    }
  }
  return null;
}

let progress = loadProgress();
let mode = "training";
let levelIndex = 0;
let activeBossId = null;
let bossRunner = null;
let charIndex = 0;
let errors = 0;
let startedAt = null;
let completed = false;
let audioCtx = null;
let campaignList = buildCampaignList();
let selectedKey = "m-0";
let prevBossHp = null;
let prevPlayerHp = null;

function clampLevelIndex(i) {
  return Math.max(0, Math.min(LEVELS.length - 1, i));
}

function modulesDoneThrough(lastIdx) {
  for (let j = 0; j <= lastIdx; j++) {
    if (!progress.done.has(LEVELS[j].id)) return false;
  }
  return true;
}

function migrateBosses(raw) {
  const beat = [false, false, false];
  if (Array.isArray(raw.bossesBeat) && raw.bossesBeat.length >= 3) {
    beat[0] = !!raw.bossesBeat[0];
    beat[1] = !!raw.bossesBeat[1];
    beat[2] = !!raw.bossesBeat[2];
  } else {
    const done = new Set(raw.done || []);
    if ([1, 2, 3, 4, 5, 6].every((id) => done.has(id)) && done.has(7))
      beat[0] = true;
    if (beat[0] && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].every((id) => done.has(id)))
      beat[1] = true;
    if (beat[1] && done.has(20)) beat[2] = true;
  }
  return beat;
}

function loadProgress() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const maxUnlocked = clampLevelIndex(p.maxUnlocked ?? 0);
      const done = new Set(
        Array.isArray(p.done) ? p.done.filter((n) => n >= 1 && n <= 20) : []
      );
      const bossesBeat = migrateBosses(p);
      const seenIntro = !!p.seenIntro;
      const lastSel =
        typeof p.lastSel === "string" && p.lastSel.length > 0 ? p.lastSel : "m-0";
      const pr = {
        maxUnlocked,
        done,
        bossesBeat,
        seenIntro,
        lastSel,
      };
      applyGateCaps(pr);
      return pr;
    }
  } catch (_) {
    /* ignore */
  }
  return {
    maxUnlocked: 0,
    done: new Set(),
    bossesBeat: [false, false, false],
    seenIntro: false,
    lastSel: "m-0",
  };
}

function applyGateCaps(p = progress) {
  let cap = 19;
  if (!p.bossesBeat[1]) cap = 12;
  if (!p.bossesBeat[0]) cap = 5;
  p.maxUnlocked = Math.min(p.maxUnlocked, cap);
}

function saveProgress() {
  applyGateCaps();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      maxUnlocked: progress.maxUnlocked,
      done: [...progress.done],
      bossesBeat: progress.bossesBeat,
      seenIntro: progress.seenIntro,
      lastSel: selectedKey,
    })
  );
}

function moduleUnlocked(i) {
  if (i > progress.maxUnlocked) return false;
  if (i >= 6 && !progress.bossesBeat[0]) return false;
  if (i >= 13 && !progress.bossesBeat[1]) return false;
  return true;
}

function bossUnlocked(bid) {
  if (bid === 0) return modulesDoneThrough(5);
  if (bid === 1) return progress.bossesBeat[0] && modulesDoneThrough(12);
  if (bid === 2) return progress.bossesBeat[1] && modulesDoneThrough(19);
  return false;
}

function currentLevel() {
  return LEVELS[levelIndex];
}

function getActiveText() {
  if (mode === "boss" && bossRunner) return bossRunner.getText();
  return currentLevel().text;
}

function normalizeKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.key === " ") return " ";
  if (e.key.length === 1) return e.key;
  return null;
}

const els = {
  levelList: document.getElementById("levelList"),
  levelPill: document.getElementById("levelPill"),
  lessonTitle: document.getElementById("lessonTitle"),
  lessonBlurb: document.getElementById("lessonBlurb"),
  prompt: document.getElementById("prompt"),
  progressFill: document.getElementById("progressFill"),
  hudWpm: document.getElementById("hudWpm"),
  hudAcc: document.getElementById("hudAcc"),
  hudErr: document.getElementById("hudErr"),
  fingerHint: document.getElementById("fingerHint"),
  keyboard: document.getElementById("keyboard"),
  handLeft: document.getElementById("handLeft"),
  handRight: document.getElementById("handRight"),
  completeModal: document.getElementById("completeModal"),
  completeTitle: document.getElementById("completeTitle"),
  completeBody: document.getElementById("completeBody"),
  btnNextLevel: document.getElementById("btnNextLevel"),
  btnReplay: document.getElementById("btnReplay"),
  topStats: document.getElementById("topStats"),
  lessonFocus: document.getElementById("lessonFocus"),
  btnFocusLesson: document.getElementById("btnFocusLesson"),
  bossArena: document.getElementById("bossArena"),
  bossCodename: document.getElementById("bossCodename"),
  bossFightTitle: document.getElementById("bossFightTitle"),
  bossPhasePill: document.getElementById("bossPhasePill"),
  bossHpFill: document.getElementById("bossHpFill"),
  playerHpFill: document.getElementById("playerHpFill"),
  bossComboLine: document.getElementById("bossComboLine"),
  missionRuleTraining: document.getElementById("missionRuleTraining"),
  missionRuleBoss: document.getElementById("missionRuleBoss"),
};

const cinematic = createCinematicController(
  document.getElementById("cinematicRoot")
);

function renderHands() {
  const leftSvg = `
  <svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18 158 Q58 188 102 158 L102 212 L18 212 Z" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.07)" stroke-width="1" />
    <path class="finger" data-f="LP" d="M24 152 L20 88 L36 82 L40 148 Z" />
    <path class="finger" data-f="LR" d="M40 148 L36 68 L50 64 L56 142 Z" />
    <path class="finger" data-f="LM" d="M56 142 L50 54 L66 50 L72 136 Z" />
    <path class="finger" data-f="LI" d="M72 136 L64 48 L82 46 L90 130 Z" />
    <ellipse class="thumb" data-f="TH" cx="96" cy="178" rx="16" ry="11" />
  </svg>`;
  const rightSvg = `
  <svg viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18 158 Q58 188 102 158 L102 212 L18 212 Z" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.07)" stroke-width="1" />
    <path class="finger" data-f="RI" d="M48 130 L56 46 L74 48 L66 136 Z" />
    <path class="finger" data-f="RM" d="M64 136 L70 50 L86 54 L80 142 Z" />
    <path class="finger" data-f="RR" d="M80 142 L86 64 L100 68 L94 148 Z" />
    <path class="finger" data-f="RP" d="M94 148 L100 82 L116 88 L110 154 Z" />
    <ellipse class="thumb" data-f="TH" cx="24" cy="178" rx="16" ry="11" />
  </svg>`;
  els.handLeft.innerHTML = leftSvg;
  els.handRight.innerHTML = rightSvg;
}

function renderKeyboard() {
  els.keyboard.innerHTML = "";
  KEYBOARD_LAYOUT.forEach((section) => {
    const row = document.createElement("div");
    row.className = "kb-row";
    section.row.forEach((def) => {
      const key = document.createElement("div");
      const ch = def.k;
      const label =
        def.label || (ch === " " ? "space" : def.s ? `${ch}\n${def.s}` : ch);
      key.className = `key finger-${def.f}`;
      if (def.wide) key.classList.add("wide");
      key.dataset.key = ch === " " ? " " : String(ch);
      if (def.s) key.dataset.shift = def.s;
      if (def.s && ch !== " ") {
        key.innerHTML = `<span>${ch}</span><span style="opacity:.55;font-size:.58rem">${def.s}</span>`;
        key.style.flexDirection = "column";
        key.style.lineHeight = "1.1";
        key.style.gap = "1px";
      } else {
        key.textContent = label;
      }
      row.appendChild(key);
    });
    els.keyboard.appendChild(row);
  });
}

function updateFingerAndKeyboardHighlights() {
  const text = getActiveText();
  const nextCh = charIndex < text.length ? text[charIndex] : null;
  const f = nextCh != null ? fingerForChar(nextCh) : null;

  const handParts = document.querySelectorAll(
    "#handLeft .finger, #handLeft .thumb, #handRight .finger, #handRight .thumb"
  );
  handParts.forEach((el) => {
    const fid = el.dataset.f;
    if (f === "TH") el.classList.toggle("active", fid === "TH");
    else el.classList.toggle("active", fid === f);
  });

  document.querySelectorAll(".key").forEach((k) => {
    k.classList.remove("next");
    if (nextCh != null && keyElementMatchesChar(k, nextCh)) {
      k.classList.add("next");
    }
  });

  if (nextCh == null) {
    els.fingerHint.textContent = "";
    return;
  }

  const fingerLine = f
    ? `${FINGER_LABELS[f] || f}`
    : "Use the highlighted key on the board.";
  const keyLabel =
    nextCh === " " ? "space" : nextCh === "\n" ? "Enter" : `“${nextCh}”`;
  const shift = shiftComboForChar(nextCh);
  els.fingerHint.innerHTML = shift
    ? `<strong>${fingerLine}</strong><br><span class="hint-sub">${shift} for ${keyLabel}</span>`
    : `<strong>${fingerLine}</strong><br><span class="hint-sub">Press ${keyLabel}</span>`;
}

function renderPrompt() {
  const text = getActiveText();
  els.prompt.innerHTML = "";
  for (let i = 0; i < text.length; i++) {
    const span = document.createElement("span");
    const c = text[i];
    span.textContent = c === " " ? "\u00a0" : c;
    if (i < charIndex) span.classList.add("done");
    else if (i === charIndex) span.classList.add("current");
    els.prompt.appendChild(span);
  }
  const pct = text.length ? (charIndex / text.length) * 100 : 0;
  els.progressFill.style.width = `${pct}%`;

  if (mode === "boss" && bossRunner) {
    const st = {
      wpm: 0,
      errors: bossRunner.errors,
      typed: bossRunner._typedCorrect,
    };
    const elapsedMin =
      bossRunner.startedAt && bossRunner._typedCorrect > 0
        ? (performance.now() - bossRunner.startedAt) / 60000
        : 0;
    st.wpm =
      elapsedMin > 0.04
        ? Math.round(bossRunner._typedCorrect / 5 / elapsedMin)
        : 0;
    const gross = st.typed + st.errors;
    const acc = gross > 0 ? Math.round((st.typed / gross) * 1000) / 10 : 100;
    els.hudWpm.textContent = bossRunner.startedAt ? String(st.wpm) : "—";
    els.hudAcc.textContent = bossRunner.startedAt ? `${acc}%` : "—";
    els.hudErr.textContent = String(st.errors);
    return;
  }

  const elapsedMin = startedAt ? (performance.now() - startedAt) / 60000 : 0;
  const gross = charIndex + errors;
  const wpm =
    elapsedMin > 0.04 ? Math.round(charIndex / 5 / elapsedMin) : 0;
  const acc =
    gross > 0 ? Math.round((charIndex / gross) * 1000) / 10 : 100;
  els.hudWpm.textContent = startedAt ? String(wpm) : "—";
  els.hudAcc.textContent = startedAt ? `${acc}%` : "—";
  els.hudErr.textContent = String(errors);
}

function pulseWrong() {
  const cur = els.prompt.querySelector(".current");
  if (!cur) return;
  cur.classList.remove("wrong-pulse");
  void cur.offsetWidth;
  cur.classList.add("wrong-pulse");
}

function playTone(freq, dur = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();

    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.connect(g);
    g.connect(audioCtx.destination);
    o.frequency.value = freq;
    const t0 = audioCtx.currentTime;
    g.gain.setValueAtTime(0.035, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.start(t0);
    o.stop(t0 + dur);
  } catch (_) {
    /* ignore */
  }
}

function focusLesson() {
  els.lessonFocus.focus({ preventScroll: true });
}

function setTrainingUI() {
  els.bossArena.hidden = true;
  els.missionRuleTraining.hidden = false;
  els.missionRuleBoss.hidden = true;
  els.lessonBlurb.style.display = "";
  document.getElementById("missionRule").classList.remove("mission-rule-boss");
}

function setBossUI(def) {
  els.bossArena.hidden = false;
  els.missionRuleTraining.hidden = true;
  els.missionRuleBoss.hidden = false;
  document.getElementById("missionRule").classList.add("mission-rule-boss");
  els.lessonBlurb.style.display = "none";
  els.bossCodename.textContent = def.codename;
  els.bossFightTitle.textContent = def.title;
  els.levelPill.textContent = "Boss encounter";
  els.lessonTitle.textContent = "Sync duel";
}

function exitBossMode() {
  gameFx.stopBossOrbIdle();
  mode = "training";
  activeBossId = null;
  bossRunner = null;
  charIndex = 0;
  errors = 0;
  startedAt = null;
  completed = false;
  prevBossHp = null;
  prevPlayerHp = null;
  setTrainingUI();
}

function onBossUiUpdate(st) {
  if (prevBossHp !== null && st.bossHp < prevBossHp - 0.5) {
    gameFx.bossBarPulse(els.bossHpFill);
  }
  if (prevPlayerHp !== null && st.playerHp < prevPlayerHp) {
    gameFx.shieldBarPulse(els.playerHpFill);
  }
  prevBossHp = st.bossHp;
  prevPlayerHp = st.playerHp;

  const bp = (st.bossHp / st.bossMaxHp) * 100;
  const pp = (st.playerHp / st.playerMaxHp) * 100;
  els.bossHpFill.style.width = `${Math.max(0, Math.min(100, bp))}%`;
  els.playerHpFill.style.width = `${Math.max(0, Math.min(100, pp))}%`;
  els.bossPhasePill.textContent = `Phase ${st.phase + 1} / ${st.phaseCount}`;
  charIndex = st.charIndex;
  if (st.combo > 2) {
    els.bossComboLine.hidden = false;
    els.bossComboLine.textContent = `Combo ×${st.combo} — faster typing amplifies lattice fracture`;
  } else {
    els.bossComboLine.hidden = true;
  }
  gameFx.comboMilestone(st.combo);
  renderPrompt();
  updateFingerAndKeyboardHighlights();
}

function beginBossFight(bossId) {
  const def = BOSSES[bossId];
  mode = "boss";
  activeBossId = bossId;
  selectedKey = `b-${bossId}`;
  charIndex = 0;
  errors = 0;
  startedAt = null;
  completed = false;
  prevBossHp = null;
  prevPlayerHp = null;
  els.completeModal.hidden = true;
  setBossUI(def);
  gameFx.resetComboTracking();
  gameFx.startBossOrbIdle();
  bossRunner = new BossFight(def, {
    onUpdate: onBossUiUpdate,
    playTone,
  });
  bossRunner.start();
  renderCampaignSidebar();
  saveProgress();
  renderPrompt();
  updateFingerAndKeyboardHighlights();
  requestAnimationFrame(() => focusLesson());
}

function openBossWithBriefing(bossId) {
  if (!bossUnlocked(bossId)) return;
  cinematic.playBossBriefing(BOSSES[bossId], () => beginBossFight(bossId));
}

function startTraining(idx) {
  if (!moduleUnlocked(idx)) return;
  if (mode === "boss") exitBossMode();
  gameFx.stopBossOrbIdle();
  mode = "training";
  levelIndex = idx;
  selectedKey = `m-${idx}`;
  charIndex = 0;
  errors = 0;
  startedAt = null;
  completed = false;
  els.completeModal.hidden = true;
  setTrainingUI();
  const L = currentLevel();
  els.levelPill.textContent = `Training ${L.id}`;
  els.lessonTitle.textContent = L.title;
  els.lessonBlurb.textContent = L.blurb;
  saveProgress();
  renderCampaignSidebar();
  renderPrompt();
  updateFingerAndKeyboardHighlights();
  requestAnimationFrame(() => focusLesson());
}

function renderCampaignSidebar() {
  els.levelList.innerHTML = "";
  campaignList.forEach((item) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "level-btn";

    if (item.kind === "module") {
      const i = item.moduleIndex;
      const L = LEVELS[i];
      const key = `m-${i}`;
      const unlocked = moduleUnlocked(i);
      if (!unlocked) btn.classList.add("locked");
      if (selectedKey === key) btn.classList.add("active");
      if (progress.done.has(L.id)) btn.classList.add("done");
      btn.innerHTML = `<span class="num">${L.id}</span><span>${L.title}</span>`;
      btn.addEventListener("click", () => {
        if (unlocked) startTraining(i);
      });
    } else {
      const bid = item.bossId;
      const B = BOSSES[bid];
      const key = `b-${bid}`;
      const unlocked = bossUnlocked(bid);
      btn.classList.add("boss-btn");
      if (!unlocked) btn.classList.add("locked");
      if (selectedKey === key) btn.classList.add("active");
      if (progress.bossesBeat[bid]) btn.classList.add("done");
      btn.innerHTML = `<span class="num">⚡</span><span>${B.title}</span>`;
      btn.addEventListener("click", () => {
        if (unlocked) openBossWithBriefing(bid);
      });
    }

    li.appendChild(btn);
    els.levelList.appendChild(li);
  });

  const doneMods = progress.done.size;
  const bosses = progress.bossesBeat.filter(Boolean).length;
  els.topStats.textContent = `${doneMods} / ${LEVELS.length} training cleared · ${bosses} / 3 bosses neutralized`;
}

function afterPerfectTraining() {
  const L = currentLevel();
  progress.done.add(L.id);
  const i = levelIndex;

  if (i === 5 && !progress.bossesBeat[0]) {
    progress.maxUnlocked = Math.max(progress.maxUnlocked, 5);
  } else if (i === 12 && !progress.bossesBeat[1]) {
    progress.maxUnlocked = Math.max(progress.maxUnlocked, 12);
  } else if (i === 19 && !progress.bossesBeat[2]) {
    progress.maxUnlocked = Math.max(progress.maxUnlocked, 19);
  } else {
    progress.maxUnlocked = Math.max(progress.maxUnlocked, i + 1);
  }
  applyGateCaps();
  saveProgress();
}

function completeLevel() {
  if (completed) return;
  if (errors !== 0) return;
  completed = true;
  els.completeModal.dataset.outcome = "trainingWin";
  afterPerfectTraining();

  const L = currentLevel();
  const elapsed = startedAt ? (performance.now() - startedAt) / 1000 : 0;
  const wpm =
    elapsed > 0
      ? Math.round(L.text.replace(/\s+/g, " ").length / 5 / (elapsed / 60))
      : 0;

  els.completeModal.classList.remove("modal--imperfect");
  els.completeTitle.textContent = "Training node secured";
  let extra = "";
  if (levelIndex === 5 && !progress.bossesBeat[0])
    extra = " Boss encounter ORB-9 is live in the mission list — clear it to unlock deeper sectors.";
  else if (levelIndex === 12 && !progress.bossesBeat[1])
    extra = " Bastion core TOWER-PRIME awaits in the mission list.";
  else if (levelIndex === 19 && !progress.bossesBeat[2])
    extra = " Final carrier duel unlocked — this is the war’s endgame.";
  els.completeBody.textContent = `Perfect run — zero mistakes. “${L.title}” at about ${wpm} WPM.${extra}`;

  els.completeModal.hidden = false;
  const hasNext =
    levelIndex < LEVELS.length - 1 ||
    (levelIndex === 5 && !progress.bossesBeat[0]) ||
    (levelIndex === 12 && !progress.bossesBeat[1]);
  els.btnNextLevel.style.display =
    levelIndex < LEVELS.length - 1 ? "inline-block" : "none";
  if (levelIndex === 5 && !progress.bossesBeat[0])
    els.btnNextLevel.style.display = "none";
  if (levelIndex === 12 && !progress.bossesBeat[1])
    els.btnNextLevel.style.display = "none";
  if (levelIndex === 19 && !progress.bossesBeat[2])
    els.btnNextLevel.style.display = "none";

  els.btnReplay.textContent = "Replay";
  renderCampaignSidebar();
  gameFx.trainingVictory();
  playTone(660, 0.1);
  setTimeout(() => playTone(880, 0.12), 80);
}

function showImperfectCompletion() {
  if (completed) return;
  completed = true;
  els.completeModal.dataset.outcome = "trainingFail";
  const L = currentLevel();
  els.completeModal.classList.add("modal--imperfect");
  els.completeTitle.textContent = "Perfect run required";
  els.completeBody.textContent = `You reached the end of “${L.title}” with ${errors} wrong key${errors === 1 ? "" : "s"}. Clear this node with zero mistakes — take as long as you need.`;
  els.btnNextLevel.style.display = "none";
  els.btnReplay.textContent = "Try again";
  els.completeModal.hidden = false;
  playTone(180, 0.12);
}

function handleBossWin() {
  const bid = activeBossId;
  if (bid == null) return;
  gameFx.stopBossOrbIdle();
  gameFx.bossVictory(bid);
  progress.bossesBeat[bid] = true;
  if (bid === 0) progress.maxUnlocked = Math.max(progress.maxUnlocked, 6);
  if (bid === 1) progress.maxUnlocked = Math.max(progress.maxUnlocked, 13);
  if (bid === 2) progress.maxUnlocked = 19;
  applyGateCaps();
  saveProgress();
  bossRunner = null;
  activeBossId = null;
  mode = "training";
  charIndex = 0;
  completed = true;
  setTrainingUI();

  const chapter = CHAPTER_AFTER_BOSS[bid];
  cinematic.playChapter(chapter, () => {
    els.completeModal.classList.remove("modal--imperfect");
    els.completeModal.dataset.outcome = "bossWin";
    els.completeTitle.textContent =
      bid === 2 ? "War lattice collapsed" : "Boss neutralized";
    els.completeBody.textContent =
      bid === 2
        ? "Their flagship lost sync. Earth adopts the keystrike lattice — you held the line."
        : "Enemy node fractured. New training sectors are online. The invasion adapts — so do we.";
    els.btnNextLevel.style.display = "none";
    els.btnReplay.textContent = "Continue";
    els.completeModal.hidden = false;
    renderCampaignSidebar();
    playTone(520, 0.08);
    setTimeout(() => playTone(720, 0.1), 100);
  });
}

function handleBossLose() {
  gameFx.stopBossOrbIdle();
  completed = true;
  els.completeModal.dataset.outcome = "bossLose";
  els.completeModal.classList.add("modal--imperfect");
  els.completeTitle.textContent = "Shield collapsed";
  els.completeBody.textContent =
    "Your shield hit zero. The alien lattice outpaced your corrections — stabilize your accuracy and try the sync duel again.";
  els.btnNextLevel.style.display = "none";
  els.btnReplay.textContent = "Re-engage";
  els.completeModal.hidden = false;
  playTone(120, 0.2);
}

function onKeyDown(e) {
  if (!els.completeModal.hidden) {
    if (e.key === "Enter") {
      const t = e.target;
      if (t === els.btnNextLevel || t === els.btnReplay) return;
      e.preventDefault();
      if (els.btnNextLevel.style.display !== "none") els.btnNextLevel.click();
      else els.btnReplay.click();
    }
    return;
  }

  if (mode === "boss" && bossRunner) {
    const result = bossRunner.handleKeyDown(e);
    if (result === "win" || result === "continue") {
      gameFx.bossHit();
    }
    if (result === "win") {
      handleBossWin();
    } else if (result === "lose") {
      handleBossLose();
    } else if (result === "error") {
      gameFx.bossMiss(10 + bossRunner.phase * 4);
      els.lessonFocus.classList.remove("boss-hit");
      void els.lessonFocus.offsetWidth;
      els.lessonFocus.classList.add("boss-hit");
      pulseWrong();
    }
    return;
  }

  const printable = normalizeKey(e);
  if (printable === null) return;

  const text = currentLevel().text;
  if (charIndex >= text.length) return;

  e.preventDefault();

  const expected = text[charIndex];
  if (startedAt === null) startedAt = performance.now();

  if (printable === expected) {
    playTone(720, 0.04);
    gameFx.trainingHit();
    charIndex++;
    renderPrompt();
    gameFx.pulseWpm(els.hudWpm);
    if (charIndex >= text.length) {
      updateFingerAndKeyboardHighlights();
      if (errors === 0) {
        completeLevel();
      } else {
        showImperfectCompletion();
      }
      return;
    }
    updateFingerAndKeyboardHighlights();
  } else {
    errors++;
    playTone(160, 0.1);
    gameFx.trainingMiss();
    pulseWrong();
    renderPrompt();
  }
}

function restoreSelection() {
  const key = progress.lastSel || "m-0";
  if (key.startsWith("m-")) {
    const idx = parseInt(key.slice(2), 10);
    if (!Number.isNaN(idx) && moduleUnlocked(idx)) {
      startTraining(idx);
      return;
    }
  }
  if (key.startsWith("b-")) {
    const bid = parseInt(key.slice(2), 10);
    if (!Number.isNaN(bid) && bossUnlocked(bid)) {
      beginBossFight(bid);
      return;
    }
  }
  startTraining(0);
}

function init() {
  gameFx.init();
  renderHands();
  renderKeyboard();

  const runApp = () => {
    renderCampaignSidebar();
    restoreSelection();
  };

  if (!progress.seenIntro && window.gsap) {
    cinematic.playIntro(INTRO_SCENES, () => {
      progress.seenIntro = true;
      saveProgress();
      runApp();
    });
  } else {
    if (!progress.seenIntro) {
      progress.seenIntro = true;
      saveProgress();
    }
    runApp();
  }

  document.addEventListener("keydown", onKeyDown);
  els.btnFocusLesson.addEventListener("click", () => {
    focusLesson();
    playTone(440, 0.05);
  });

  els.btnNextLevel.addEventListener("click", () => {
    if (mode === "training" && levelIndex < LEVELS.length - 1) {
      startTraining(levelIndex + 1);
    }
    els.completeModal.hidden = true;
    focusLesson();
  });

  els.btnReplay.addEventListener("click", () => {
    const outcome = els.completeModal.dataset.outcome;
    els.completeModal.hidden = true;
    els.completeModal.dataset.outcome = "";
    if (outcome === "bossWin") {
      let nextMod = 0;
      if (progress.bossesBeat[2]) nextMod = 19;
      else if (progress.bossesBeat[1]) nextMod = 13;
      else if (progress.bossesBeat[0]) nextMod = 6;
      if (moduleUnlocked(nextMod)) startTraining(nextMod);
      else startTraining(Math.min(nextMod, progress.maxUnlocked));
      focusLesson();
      return;
    }
    if (outcome === "bossLose" && activeBossId != null) {
      beginBossFight(activeBossId);
      focusLesson();
      return;
    }
    if (mode === "boss" && bossRunner) {
      beginBossFight(activeBossId);
    } else if (mode === "training") {
      startTraining(levelIndex);
    }
    focusLesson();
  });
}

init();
