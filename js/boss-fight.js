/**
 * Boss duel: type all phase lines. Wrong keys cost HP. Speed scales damage to boss meter (visual + feel).
 */
export class BossFight {
  constructor(def, hooks) {
    this.def = def;
    this.onUpdate = hooks.onUpdate;
    this.playTone = hooks.playTone || (() => {});
    this.phase = 0;
    this.charIndex = 0;
    this.playerHp = def.playerMaxHp;
    this.errors = 0;
    this.combo = 0;
    this.startedAt = null;
    this._typedCorrect = 0;
    this._bossDamageAccum = 0;
    this._totalChars = def.phases.reduce((a, p) => a + p.text.length, 0);
  }

  getText() {
    return this.def.phases[this.phase]?.text ?? "";
  }

  _wpm() {
    if (!this.startedAt || this._typedCorrect < 2) return 0;
    const min = (performance.now() - this.startedAt) / 60000;
    if (min < 0.02) return 0;
    return Math.round(this._typedCorrect / 5 / min);
  }

  _damageForKeystroke() {
    const wpm = this._wpm();
    const speedMult = 0.55 + Math.min(wpm / 90, 1.45);
    const comboMult = 1 + Math.min(this.combo, 25) * 0.025;
    const base = (this.def.bossMaxHp / Math.max(this._totalChars, 1)) * 1.2;
    return base * speedMult * comboMult;
  }

  _emit() {
    const text = this.getText();
    const bossHpRemaining = Math.max(
      0,
      this.def.bossMaxHp - this._bossDamageAccum
    );
    this.onUpdate({
      phase: this.phase,
      phaseCount: this.def.phases.length,
      charIndex: this.charIndex,
      text,
      playerHp: this.playerHp,
      playerMaxHp: this.def.playerMaxHp,
      bossHp: bossHpRemaining,
      bossMaxHp: this.def.bossMaxHp,
      wpm: this._wpm(),
      combo: this.combo,
      errors: this.errors,
    });
  }

  start() {
    this.phase = 0;
    this.charIndex = 0;
    this.playerHp = this.def.playerMaxHp;
    this.errors = 0;
    this.combo = 0;
    this.startedAt = null;
    this._typedCorrect = 0;
    this._bossDamageAccum = 0;
    this._emit();
  }

  normalizeKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return null;
    if (e.key === " ") return " ";
    if (e.key.length === 1) return e.key;
    return null;
  }

  handleKeyDown(e) {
    const printable = this.normalizeKey(e);
    if (printable === null) return false;

    const text = this.getText();
    if (text.length === 0) return false;
    if (this.charIndex >= text.length) return false;

    e.preventDefault();

    const expected = text[this.charIndex];
    if (this.startedAt === null) this.startedAt = performance.now();

    if (printable === expected) {
      this.combo++;
      this._typedCorrect++;
      this._bossDamageAccum += this._damageForKeystroke();
      if (this._bossDamageAccum > this.def.bossMaxHp)
        this._bossDamageAccum = this.def.bossMaxHp;
      this.charIndex++;
      this.playTone(780, 0.04);

      const finishedLine = this.charIndex >= text.length;
      if (finishedLine) {
        const lastPhase = this.phase >= this.def.phases.length - 1;
        if (lastPhase) {
          this._emit();
          return "win";
        }
        this.phase++;
        this.charIndex = 0;
      }

      this._emit();
      return "continue";
    }

    this.errors++;
    this.combo = 0;
    const hit = 10 + this.phase * 4;
    this.playerHp = Math.max(0, this.playerHp - hit);
    this.playTone(140, 0.12);
    this._emit();
    if (this.playerHp <= 0) return "lose";
    return "error";
  }
}
