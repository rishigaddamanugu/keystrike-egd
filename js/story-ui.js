/**
 * Full-screen cinematics using GSAP (load gsap.min.js before app module).
 */

function qs(root, sel) {
  return root.querySelector(sel);
}

export function createCinematicController(rootEl) {
  const badgeEl = qs(rootEl, ".cinematic-badge");
  const titleEl = qs(rootEl, ".cinematic-title");
  const linesEl = qs(rootEl, ".cinematic-lines");
  const proseEl = qs(rootEl, ".cinematic-prose");
  const nextBtn = qs(rootEl, ".cinematic-next");
  const skipBtn = qs(rootEl, ".cinematic-skip");
  const gsap = () => window.gsap;
  let keyHandlerAttached = false;

  function onCinematicKeydown(e) {
    if (rootEl.hidden) return;
    if (e.key === "Enter") {
      const t = e.target;
      if (t === nextBtn || t === skipBtn) return;
      e.preventDefault();
      nextBtn.click();
    }
  }

  function attachKeyHandler() {
    if (keyHandlerAttached) return;
    document.addEventListener("keydown", onCinematicKeydown);
    keyHandlerAttached = true;
  }

  function detachKeyHandler() {
    if (!keyHandlerAttached) return;
    document.removeEventListener("keydown", onCinematicKeydown);
    keyHandlerAttached = false;
  }

  function hideAllModes() {
    linesEl.hidden = true;
    proseEl.hidden = true;
    linesEl.innerHTML = "";
    proseEl.innerHTML = "";
  }

  function open() {
    rootEl.hidden = false;
    document.body.classList.add("cinematic-on");
    attachKeyHandler();
  }

  function close() {
    rootEl.hidden = true;
    document.body.classList.remove("cinematic-on");
    titleEl.style.display = "";
    detachKeyHandler();
    gsap()?.killTweensOf([badgeEl, titleEl, linesEl, proseEl, nextBtn]);
  }

  /**
   * Sequential scenes: each has badge, title, lines[].
   * User clicks Continue to advance; Skip jumps to end.
   */
  function playSceneSequence(scenes, onComplete) {
    const g = gsap();
    if (!g) {
      onComplete();
      return;
    }

    open();
    hideAllModes();
    linesEl.hidden = false;

    let idx = 0;

    function renderScene() {
      nextBtn.textContent = "Continue";
      titleEl.style.display = "";
      const sc = scenes[idx];
      if (!sc) {
        close();
        onComplete();
        return;
      }

      /* Outro tween may leave opacity on the lines container - children would stay invisible */
      g.killTweensOf([...linesEl.querySelectorAll(".cinematic-line")]);
      g.killTweensOf([badgeEl, titleEl, linesEl, nextBtn]);
      g.set(linesEl, { clearProps: "opacity,transform,visibility" });
      g.set([badgeEl, titleEl], { clearProps: "opacity,transform" });

      badgeEl.textContent = sc.badge || "";
      titleEl.textContent = sc.title || "";
      linesEl.innerHTML = "";
      linesEl.hidden = false;
      sc.lines.forEach((line) => {
        const p = document.createElement("p");
        p.className = "cinematic-line";
        p.textContent = line;
        linesEl.appendChild(p);
      });

      g.set([badgeEl, titleEl], { opacity: 0, y: 18 });
      g.set(linesEl.querySelectorAll(".cinematic-line"), { opacity: 0, y: 14 });
      g.set(nextBtn, { opacity: 0 });

      const tl = g.timeline();
      tl.to(badgeEl, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" })
        .to(
          titleEl,
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
          "-=0.35"
        )
        .to(
          linesEl.querySelectorAll(".cinematic-line"),
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.22,
            ease: "power2.out",
          },
          "-=0.25"
        )
        .to(nextBtn, { opacity: 1, duration: 0.35 }, "-=0.1");
    }

    function onNext() {
      idx++;
      if (idx >= scenes.length) {
        close();
        onComplete();
        return;
      }
      const lineNodes = [...linesEl.querySelectorAll(".cinematic-line")];
      /* Do not tween linesEl itself - GSAP leaves opacity:0 on the parent and hides all later scenes */
      g.to([...lineNodes, titleEl, badgeEl], {
        opacity: 0,
        y: -12,
        duration: 0.35,
        ease: "power2.in",
        onComplete: renderScene,
      });
    }

    function onSkip() {
      close();
      onComplete();
    }

    nextBtn.onclick = onNext;
    skipBtn.onclick = onSkip;

    renderScene();
  }

  /** Chapter card: title, subtitle, paragraphs */
  function playChapter(data, onComplete) {
    const g = gsap();
    if (!g) {
      onComplete();
      return;
    }

    open();
    hideAllModes();
    proseEl.hidden = false;

    titleEl.style.display = "none";

    proseEl.innerHTML = "";
    const sub = document.createElement("p");
    sub.className = "cinematic-subtitle";
    sub.textContent = data.subtitle || "";
    const h = document.createElement("h2");
    h.className = "cinematic-chapter-title";
    h.textContent = data.title || "";
    proseEl.appendChild(h);
    proseEl.appendChild(sub);

    data.paragraphs.forEach((text) => {
      const p = document.createElement("p");
      p.className = "cinematic-para";
      p.textContent = text;
      proseEl.appendChild(p);
    });

    badgeEl.textContent = "SECURE CHANNEL // FBI XENOTECH";
    titleEl.textContent = "";

    g.set([h, sub], { opacity: 0, y: 20 });
    g.set(proseEl.querySelectorAll(".cinematic-para"), { opacity: 0, y: 16 });
    g.set(nextBtn, { opacity: 0 });

    const tl = g.timeline();
    tl.to(h, { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" })
      .to(
        sub,
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "-=0.35"
      )
      .to(
        proseEl.querySelectorAll(".cinematic-para"),
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.35,
          ease: "power2.out",
        },
        "-=0.2"
      )
      .to(nextBtn, { opacity: 1, duration: 0.4 });

    nextBtn.textContent = "Resume operations";
    nextBtn.onclick = () => {
      g.to(proseEl, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          close();
          proseEl.style.opacity = 1;
          onComplete();
        },
      });
    };
    skipBtn.onclick = () => {
      close();
      proseEl.style.opacity = 1;
      onComplete();
    };
  }

  /** Short boss briefing */
  function playBossBriefing(boss, onComplete) {
    playSceneSequence(
      [
        {
          badge: boss.codename,
          title: boss.title,
          lines: [boss.tagline, "Sync duel engaged. Your typing is the weapon lattice."],
        },
      ],
      onComplete
    );
  }

  return {
    playIntro: (scenes, cb) => playSceneSequence(scenes, cb),
    playChapter: (data, cb) => playChapter(data, cb),
    playBossBriefing: (boss, cb) => playBossBriefing(boss, cb),
    close,
    open,
  };
}
