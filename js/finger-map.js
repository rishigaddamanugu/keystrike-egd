/**
 * US QWERTY touch-typing: character → finger id.
 * LP LR LM LI | RI RM RR RP | TH (thumbs, space)
 */
export const FINGER = {
  LP: "LP",
  LR: "LR",
  LM: "LM",
  LI: "LI",
  RI: "RI",
  RM: "RM",
  RR: "RR",
  RP: "RP",
  TH: "TH",
};

/** Printable characters → finger (covers level text) */
const CHAR_TO_FINGER = {
  "`": "LP",
  "~": "LP",
  1: "LP",
  "!": "LP",
  q: "LP",
  Q: "LP",
  a: "LP",
  A: "LP",
  z: "LP",
  Z: "LP",

  2: "LR",
  "@": "LR",
  w: "LR",
  W: "LR",
  s: "LR",
  S: "LR",
  x: "LR",
  X: "LR",

  3: "LM",
  "#": "LM",
  e: "LM",
  E: "LM",
  d: "LM",
  D: "LM",
  c: "LM",
  C: "LM",

  4: "LI",
  $: "LI",
  r: "LI",
  R: "LI",
  f: "LI",
  F: "LI",
  v: "LI",
  V: "LI",
  5: "LI",
  "%": "LI",
  t: "LI",
  T: "LI",
  g: "LI",
  G: "LI",
  b: "LI",
  B: "LI",

  6: "RI",
  "^": "RI",
  y: "RI",
  Y: "RI",
  h: "RI",
  H: "RI",
  n: "RI",
  N: "RI",
  7: "RI",
  "&": "RI",
  u: "RI",
  U: "RI",
  j: "RI",
  J: "RI",
  m: "RI",
  M: "RI",

  8: "RM",
  "*": "RM",
  i: "RM",
  I: "RM",
  k: "RM",
  K: "RM",
  ",": "RM",
  "<": "RM",

  9: "RR",
  "(": "RR",
  o: "RR",
  O: "RR",
  l: "RR",
  L: "RR",
  ".": "RR",
  ">": "RR",

  0: "RP",
  ")": "RP",
  p: "RP",
  P: "RP",
  ";": "RP",
  ":": "RP",
  "'": "RP",
  '"': "RP",
  "/": "RP",
  "?": "RP",
  "[": "RP",
  "{": "RP",
  "]": "RP",
  "}": "RP",
  "\\": "RP",
  "|": "RP",
  "-": "RP",
  _: "RP",
  "=": "RP",
  "+": "RP",

  " ": "TH",
};

export function fingerForChar(ch) {
  if (ch === undefined || ch === null) return null;
  if (Object.prototype.hasOwnProperty.call(CHAR_TO_FINGER, ch))
    return CHAR_TO_FINGER[ch];
  if (typeof ch === "string" && ch.length === 1 && /[a-z]/i.test(ch)) {
    const low = ch.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(CHAR_TO_FINGER, low))
      return CHAR_TO_FINGER[low];
  }
  return null;
}

/**
 * Keyboard rows: k = unshifted label, s = shifted symbol (if different).
 * f = finger for home reference (unshifted).
 */
export const KEYBOARD_LAYOUT = [
  {
    row: [
      { k: "`", s: "~", f: "LP" },
      { k: "1", s: "!", f: "LP" },
      { k: "2", s: "@", f: "LR" },
      { k: "3", s: "#", f: "LM" },
      { k: "4", s: "$", f: "LI" },
      { k: "5", s: "%", f: "LI" },
      { k: "6", s: "^", f: "RI" },
      { k: "7", s: "&", f: "RI" },
      { k: "8", s: "*", f: "RM" },
      { k: "9", s: "(", f: "RR" },
      { k: "0", s: ")", f: "RP" },
      { k: "-", s: "_", f: "RP" },
      { k: "=", s: "+", f: "RP" },
    ],
  },
  {
    row: [
      { k: "q", f: "LP" },
      { k: "w", f: "LR" },
      { k: "e", f: "LM" },
      { k: "r", f: "LI" },
      { k: "t", f: "LI" },
      { k: "y", f: "RI" },
      { k: "u", f: "RI" },
      { k: "i", f: "RM" },
      { k: "o", f: "RR" },
      { k: "p", f: "RP" },
      { k: "[", s: "{", f: "RP" },
      { k: "]", s: "}", f: "RP" },
      { k: "\\", s: "|", f: "RP" },
    ],
  },
  {
    row: [
      { k: "a", f: "LP" },
      { k: "s", f: "LR" },
      { k: "d", f: "LM" },
      { k: "f", f: "LM" },
      { k: "g", f: "LI" },
      { k: "h", f: "RI" },
      { k: "j", f: "RI" },
      { k: "k", f: "RM" },
      { k: "l", f: "RR" },
      { k: ";", s: ":", f: "RP" },
      { k: "'", s: '"', f: "RP" },
    ],
  },
  {
    row: [
      { k: "z", f: "LP" },
      { k: "x", f: "LR" },
      { k: "c", f: "LM" },
      { k: "v", f: "LI" },
      { k: "b", f: "LI" },
      { k: "n", f: "RI" },
      { k: "m", f: "RI" },
      { k: ",", s: "<", f: "RM" },
      { k: ".", s: ">", f: "RR" },
      { k: "/", s: "?", f: "RP" },
    ],
  },
  {
    row: [{ k: " ", label: "space", f: "TH", wide: true }],
  },
];

/** Whether a rendered key element is the physical key for typed character ch */
export function keyElementMatchesChar(el, ch) {
  if (ch == null) return false;
  if (ch === " " && el.dataset.key === " ") return true;
  const base = el.dataset.key;
  const shift = el.dataset.shift;
  if (shift && ch === shift) return true;
  if (ch === base) return true;
  if (typeof base === "string" && base.length === 1 && /[a-z]/.test(base)) {
    if (typeof ch === "string" && ch.length === 1 && ch.toLowerCase() === base)
      return true;
  }
  return false;
}
