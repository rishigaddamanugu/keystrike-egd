/**
 * Visual feedback: canvas particles, GSAP motion, floating text, confetti.
 * Expects #gameFxCanvas, #fxLayer, window.gsap, window.confetti (optional).
 */

const COLORS = {
  hit: ["#5eead4", "#a78bfa", "#22d3ee", "#f0abfc"],
  wrong: ["#f87171", "#fb923c"],
  shield: "#60a5fa",
};

let canvas;
let ctx;
let particles = [];
let rafId = 0;
let orbSpinTween;
let lastComboFx = 0;
let lastWpmPulseAt = 0;

function g() {
  return window.gsap;
}

function spawnParticles(x, y, palette, count = 14) {
  for (let i = 0; i < count; i++) {
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const sp = 2 + Math.random() * 6;
    particles.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 2,
      life: 1,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 1.5 + Math.random() * 3,
      drag: 0.96,
    });
  }
}

function loop() {
  if (!ctx || !canvas) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  particles = particles.filter((p) => {
    p.life -= 0.018 + Math.random() * 0.01;
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + 0.12;
    p.x += p.vx;
    p.y += p.vy;
    if (p.life <= 0) return false;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    return true;
  });
  ctx.globalAlpha = 1;
  rafId = requestAnimationFrame(loop);
}

function elCenter(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function floatText(x, y, text, className) {
  const layer = document.getElementById("fxLayer");
  if (!layer) return;
  const d = document.createElement("div");
  d.className = `fx-float ${className || ""}`;
  d.textContent = text;
  d.style.left = `${x}px`;
  d.style.top = `${y}px`;
  layer.appendChild(d);
  const gs = g();
  if (gs) {
    gs.fromTo(
      d,
      { opacity: 0, y: y + 10, scale: 0.6 },
      {
        opacity: 1,
        y: y - 28,
        scale: 1,
        duration: 0.35,
        ease: "back.out(2)",
      }
    );
    gs.to(d, {
      opacity: 0,
      y: y - 56,
      duration: 0.55,
      delay: 0.35,
      ease: "power2.in",
      onComplete: () => d.remove(),
    });
  } else {
    setTimeout(() => d.remove(), 900);
  }
}

function screenFlash(className) {
  const layer = document.getElementById("fxLayer");
  if (!layer) return;
  const v = document.createElement("div");
  v.className = `fx-screen-flash ${className}`;
  layer.appendChild(v);
  const gs = g();
  if (gs) {
    gs.fromTo(
      v,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.06,
        yoyo: true,
        repeat: 1,
        onComplete: () => v.remove(),
      }
    );
  } else {
    setTimeout(() => v.remove(), 150);
  }
}

function energyBolt(from, to) {
  if (!from || !to) return;
  const layer = document.getElementById("fxLayer");
  if (!layer) return;
  const b = document.createElement("div");
  b.className = "fx-bolt";
  layer.appendChild(b);
  const gs = g();
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const h = Math.min(dist * 0.55, 140);
  b.style.height = `${h}px`;
  const angle =
    (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 90;
  if (gs) {
    const tl = gs.timeline({ onComplete: () => b.remove() });
    tl.set(b, {
      left: from.x,
      top: from.y,
      xPercent: -50,
      yPercent: -100,
      rotation: angle,
      opacity: 1,
      scaleY: 0.12,
    });
    tl.to(b, {
      left: to.x,
      top: to.y,
      scaleY: 1,
      opacity: 0.92,
      duration: 0.11,
      ease: "power2.out",
    });
    tl.to(b, {
      opacity: 0,
      scaleY: 1.2,
      duration: 0.1,
      ease: "power2.in",
    });
  } else {
    b.remove();
  }
}

function shakePanel(selector) {
  const gs = g();
  const el = document.querySelector(selector);
  if (!gs || !el) return;
  gs.fromTo(
    el,
    { x: 0 },
    {
      x: 6,
      duration: 0.04,
      yoyo: true,
      repeat: 7,
      ease: "power1.inOut",
      onComplete: () => gs.set(el, { x: 0 }),
    }
  );
}

function pulseHudValue(el) {
  const gs = g();
  if (!gs || !el) return;
  gs.fromTo(
    el,
    { scale: 1 },
    { scale: 1.18, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" }
  );
}

export const gameFx = {
  init() {
    cancelAnimationFrame(rafId);
    canvas = document.getElementById("gameFxCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
    loop();
  },

  resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  },

  /** Training: correct key */
  trainingHit() {
    const cur = document.querySelector("#prompt .current");
    const key = document.querySelector(".key.next");
    const target = document.querySelector(".brand-mark--war");
    const from = elCenter(cur) || elCenter(key) || { x: innerWidth / 2, y: innerHeight / 2 };
    spawnParticles(from.x, from.y, COLORS.hit, 10);
    const to = elCenter(target) || { x: innerWidth - 80, y: 80 };
    energyBolt(from, to);
    const gs = g();
    if (key && gs) {
      gs.fromTo(
        key,
        { scale: 1 },
        { scale: 1.14, duration: 0.08, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    }
  },

  /** Training: wrong key */
  trainingMiss() {
    const cur = document.querySelector("#prompt .current");
    const p = elCenter(cur) || { x: innerWidth / 2, y: innerHeight / 2 };
    spawnParticles(p.x, p.y, COLORS.wrong, 8);
    screenFlash("fx-screen-flash--bad");
    shakePanel("#lessonFocus");
  },

  /** Boss: correct — bolt to orb + particles */
  bossHit() {
    const cur = document.querySelector("#prompt .current");
    const key = document.querySelector(".key.next");
    const orb = document.getElementById("bossOrb");
    const from = elCenter(cur) || elCenter(key) || { x: innerWidth / 2, y: innerHeight / 2 };
    const to = elCenter(orb) || { x: innerWidth / 2, y: 160 };
    spawnParticles(from.x, from.y, COLORS.hit, 12);
    energyBolt(from, to);
    spawnParticles(to.x, to.y, COLORS.hit, 16);
    const gs = g();
    if (orb && gs) {
      gs.fromTo(
        orb,
        { scale: 1 },
        {
          scale: 1.14,
          duration: 0.08,
          yoyo: true,
          repeat: 1,
          ease: "power4.out",
        }
      );
    }
    if (key && gs) {
      gs.fromTo(
        key,
        { scale: 1 },
        { scale: 1.12, duration: 0.07, yoyo: true, repeat: 1, ease: "power3.out" }
      );
    }
  },

  /** Boss: wrong — shield damage feel */
  bossMiss(damage) {
    const orb = document.getElementById("bossOrb");
    const p = elCenter(orb) || { x: innerWidth / 2, y: 200 };
    spawnParticles(p.x, p.y, COLORS.wrong, 14);
    screenFlash("fx-screen-flash--bad");
    shakePanel("#lessonFocus");
    shakePanel(".boss-arena");
    floatText(
      innerWidth / 2 - 40,
      innerHeight * 0.35,
      damage ? `−${damage} SHIELD` : "MISS",
      "fx-float--bad"
    );
    const gs = g();
    if (orb && gs) {
      gs.to(orb, {
        filter: "hue-rotate(90deg) brightness(1.4)",
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => gs.set(orb, { filter: "none" }),
      });
    }
  },

  /** Boss HP bar elastic tick */
  bossBarPulse(fillEl) {
    const gs = g();
    if (!gs || !fillEl) return;
    gs.fromTo(
      fillEl,
      { filter: "brightness(1.35)" },
      { filter: "brightness(1)", duration: 0.25 }
    );
  },

  shieldBarPulse(fillEl) {
    const gs = g();
    if (!gs || !fillEl) return;
    gs.fromTo(
      fillEl,
      { filter: "brightness(1.4) saturate(1.3)" },
      { filter: "brightness(1) saturate(1)", duration: 0.3 }
    );
  },

  comboMilestone(combo) {
    if (combo < 5) return;
    const milestone = Math.floor(combo / 5) * 5;
    if (milestone <= lastComboFx) return;
    lastComboFx = milestone;
    floatText(
      innerWidth / 2,
      innerHeight * 0.42,
      `COMBO ×${milestone}`,
      "fx-float--combo"
    );
    spawnParticles(innerWidth / 2, innerHeight * 0.4, COLORS.hit, 28);
    const gs = g();
    const line = document.getElementById("bossComboLine");
    if (line && gs) {
      gs.fromTo(
        line,
        { scale: 1 },
        { scale: 1.08, duration: 0.15, yoyo: true, repeat: 3 }
      );
    }
  },

  resetComboTracking() {
    lastComboFx = 0;
  },

  startBossOrbIdle() {
    const gs = g();
    const orb = document.getElementById("bossOrb");
    if (!gs || !orb) return;
    if (orbSpinTween) orbSpinTween.kill();
    orbSpinTween = gs.to(orb, {
      rotation: 360,
      duration: 28,
      repeat: -1,
      ease: "none",
    });
  },

  stopBossOrbIdle() {
    if (orbSpinTween) {
      orbSpinTween.kill();
      orbSpinTween = null;
    }
    const gs = g();
    const orb = document.getElementById("bossOrb");
    if (gs && orb) gs.set(orb, { rotation: 0 });
  },

  trainingVictory() {
    const fn = window.confetti;
    if (typeof fn === "function") {
      fn({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#5eead4", "#a78bfa", "#22d3ee", "#fbbf24"],
      });
      setTimeout(() => {
        fn({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ["#c084fc", "#5eead4"],
        });
      }, 180);
    }
    screenFlash("fx-screen-flash--good");
  },

  bossVictory(bossId) {
    const fn = window.confetti;
    if (typeof fn === "function") {
      const burst = () =>
        fn({
          particleCount: bossId === 2 ? 160 : 110,
          spread: 360,
          startVelocity: bossId === 2 ? 55 : 40,
          ticks: 200,
          origin: { x: 0.5, y: 0.45 },
          colors:
            bossId === 2
              ? ["#fbbf24", "#f87171", "#a78bfa", "#5eead4", "#fff"]
              : ["#5eead4", "#a78bfa", "#f472b6"],
        });
      burst();
      setTimeout(burst, 250);
      if (bossId === 2) setTimeout(burst, 500);
    }
    screenFlash("fx-screen-flash--good");
  },

  pulseWpm(el) {
    const now = performance.now();
    if (now - lastWpmPulseAt < 180) return;
    lastWpmPulseAt = now;
    pulseHudValue(el);
  },
};
