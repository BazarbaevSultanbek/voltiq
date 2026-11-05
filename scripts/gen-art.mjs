// Generates stylised studio-style product renders (SVG) used by the seed catalog.
import { writeFileSync, mkdirSync } from "node:fs";
const out = new URL("../public/products/", import.meta.url);
mkdirSync(out, { recursive: true });

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mix = (h, t, k) => { const a = hex(h), b = hex(t); return toHex(a.map((v, i) => v + (b[i] - v) * k)); };
const L = (h, k) => mix(h, "#ffffff", k);
const D = (h, k) => mix(h, "#000000", k);

export const COLORS = {
  black: "#1f2026", white: "#eceae4", orange: "#ff5b14", lime: "#b7e02c", blue: "#3d7bff",
  pink: "#ff5c8a", purple: "#7c5cff", green: "#1fa37a", gray: "#8a8f99", sand: "#d8c3a0", red: "#e8334a", teal: "#18a7b5",
};

const defs = (c) => `
<defs>
  <radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${L(c, 0.86)}"/><stop offset="1" stop-color="${L(c, 0.62)}"/></radialGradient>
  <linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${L(c, 0.25)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${D(c, 0.35)}"/></linearGradient>
  <linearGradient id="mv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L(c, 0.3)}"/><stop offset="1" stop-color="${D(c, 0.3)}"/></linearGradient>
  <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa0a8"/><stop offset=".5" stop-color="#e9ecef"/><stop offset="1" stop-color="#8b9098"/></linearGradient>
  <linearGradient id="scr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#20232c"/><stop offset="1" stop-color="#0b0c10"/></linearGradient>
  <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="${D(c, 0.6)}" flood-opacity=".28"/></filter>
</defs>
<rect width="600" height="600" fill="url(#bg)"/>
<circle cx="470" cy="110" r="140" fill="#fff" opacity=".25"/>
<ellipse cx="300" cy="500" rx="190" ry="26" fill="${D(c, 0.55)}" opacity=".22" filter="url(#sh)"/>`;

const K = {
  charger: (c) => `<g filter="url(#ds)">
    <rect x="215" y="170" width="170" height="250" rx="34" fill="url(#m)"/>
    <rect x="215" y="170" width="170" height="250" rx="34" fill="url(#gl)"/>
    <rect x="262" y="120" width="18" height="60" rx="5" fill="url(#metal)"/><rect x="320" y="120" width="18" height="60" rx="5" fill="url(#metal)"/>
    <rect x="270" y="350" width="60" height="16" rx="8" fill="${D(c, 0.6)}"/><rect x="278" y="304" width="44" height="14" rx="7" fill="${D(c, 0.6)}"/>
    <text x="300" y="260" font-family="Arial" font-weight="900" font-size="30" text-anchor="middle" fill="${L(c, 0.7)}" opacity=".85">65W</text></g>`,
  cable: (c) => `<g filter="url(#ds)" fill="none" stroke-linecap="round">
    <path d="M150 380 C 150 200, 450 200, 450 330 S 250 450, 260 300 S 420 160, 470 210" stroke="${D(c, 0.25)}" stroke-width="22"/>
    <path d="M150 380 C 150 200, 450 200, 450 330 S 250 450, 260 300 S 420 160, 470 210" stroke="url(#m)" stroke-width="16"/>
    <path d="M150 380 C 150 200, 450 200, 450 330" stroke="#fff" stroke-opacity=".35" stroke-width="4"/></g>
    <g filter="url(#ds)"><rect x="128" y="372" width="44" height="80" rx="12" fill="url(#mv)"/><rect x="140" y="446" width="20" height="34" rx="4" fill="url(#metal)"/>
    <rect x="455" y="160" width="44" height="74" rx="12" fill="url(#mv)" transform="rotate(40 477 197)"/></g>`,
  powerbank: (c) => `<g filter="url(#ds)">
    <rect x="190" y="130" width="220" height="330" rx="40" fill="url(#m)"/><rect x="190" y="130" width="220" height="330" rx="40" fill="url(#gl)"/>
    <rect x="232" y="180" width="136" height="70" rx="16" fill="url(#scr)"/>
    <text x="300" y="228" font-family="Arial" font-weight="900" font-size="34" text-anchor="middle" fill="#c8f43c">98%</text>
    <rect x="270" y="440" width="60" height="10" rx="5" fill="${D(c, 0.6)}"/>
    <path d="M300 300 l-22 44 h20 l-10 40 l36-54 h-22 l12-30z" fill="${L(c, 0.75)}" opacity=".9"/></g>`,
  case: (c) => `<g filter="url(#ds)">
    <rect x="200" y="100" width="210" height="400" rx="46" fill="url(#m)" transform="rotate(-8 300 300)"/>
    <rect x="200" y="100" width="210" height="400" rx="46" fill="url(#gl)" transform="rotate(-8 300 300)"/>
    <g transform="rotate(-8 300 300)"><rect x="222" y="122" width="96" height="104" rx="26" fill="${D(c, 0.3)}"/>
    <circle cx="248" cy="150" r="17" fill="#15161b" stroke="${D(c, 0.5)}" stroke-width="5"/><circle cx="248" cy="198" r="17" fill="#15161b" stroke="${D(c, 0.5)}" stroke-width="5"/>
    <circle cx="292" cy="174" r="17" fill="#15161b" stroke="${D(c, 0.5)}" stroke-width="5"/><circle cx="300" cy="330" r="46" fill="none" stroke="${L(c, 0.35)}" stroke-width="4" opacity=".6"/></g></g>`,
  protector: (c) => `<g filter="url(#ds)">
    <rect x="180" y="110" width="220" height="400" rx="40" fill="#1a1c22" transform="rotate(-6 300 300)"/>
    <rect x="200" y="90" width="220" height="400" rx="40" fill="${L(c, 0.6)}" fill-opacity=".35" stroke="#fff" stroke-width="3" transform="rotate(6 300 300)"/>
    <path d="M220 110 L380 110 L250 470 L210 470z" fill="#fff" opacity=".35" transform="rotate(6 300 300)"/>
    <text x="320" y="320" font-family="Arial" font-weight="900" font-size="46" text-anchor="middle" fill="${D(c, 0.3)}" transform="rotate(6 300 300)">9H</text></g>`,
  earbuds: (c) => `<g filter="url(#ds)">
    <rect x="170" y="250" width="260" height="200" rx="90" fill="url(#m)"/><rect x="170" y="250" width="260" height="200" rx="90" fill="url(#gl)"/>
    <path d="M172 330 H428" stroke="${D(c, 0.3)}" stroke-width="3"/><circle cx="300" cy="392" r="6" fill="#c8f43c"/>
    <g transform="translate(222 120) rotate(-18)"><ellipse cx="34" cy="50" rx="40" ry="44" fill="url(#mv)"/><rect x="20" y="70" width="28" height="100" rx="14" fill="url(#mv)"/><ellipse cx="24" cy="40" rx="16" ry="14" fill="${D(c, 0.5)}"/></g>
    <g transform="translate(330 110) rotate(18)"><ellipse cx="34" cy="50" rx="40" ry="44" fill="url(#mv)"/><rect x="20" y="70" width="28" height="100" rx="14" fill="url(#mv)"/><ellipse cx="44" cy="40" rx="16" ry="14" fill="${D(c, 0.5)}"/></g></g>`,
  headphones: (c) => `<g filter="url(#ds)" fill="none">
    <path d="M170 330 C 170 130, 430 130, 430 330" stroke="${D(c, 0.3)}" stroke-width="34" stroke-linecap="round"/>
    <path d="M170 330 C 170 130, 430 130, 430 330" stroke="url(#mv)" stroke-width="24" stroke-linecap="round"/></g>
    <g filter="url(#ds)"><rect x="128" y="290" width="104" height="170" rx="46" fill="url(#m)"/><rect x="368" y="290" width="104" height="170" rx="46" fill="url(#m)"/>
    <rect x="128" y="290" width="104" height="170" rx="46" fill="url(#gl)"/><rect x="200" y="310" width="34" height="130" rx="16" fill="${D(c, 0.45)}"/><rect x="366" y="310" width="34" height="130" rx="16" fill="${D(c, 0.45)}"/></g>`,
  headset: (c) => K.headphones(c) + `<path d="M180 430 C 190 500, 260 500, 290 486" stroke="${D(c, 0.4)}" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="296" cy="484" r="14" fill="#15161b"/><circle cx="440" cy="380" r="10" fill="#c8f43c"/>`,
  mount: (c) => `<g filter="url(#ds)">
    <rect x="276" y="300" width="48" height="180" rx="14" fill="url(#metal)"/><ellipse cx="300" cy="480" rx="110" ry="24" fill="url(#mv)"/>
    <circle cx="300" cy="300" r="34" fill="${D(c, 0.3)}"/>
    <rect x="186" y="110" width="228" height="190" rx="30" fill="url(#m)"/><rect x="186" y="110" width="228" height="190" rx="30" fill="url(#gl)"/>
    <rect x="166" y="160" width="30" height="90" rx="12" fill="${D(c, 0.35)}"/><rect x="404" y="160" width="30" height="90" rx="12" fill="${D(c, 0.35)}"/>
    <circle cx="300" cy="205" r="44" fill="none" stroke="${L(c, 0.5)}" stroke-width="6" opacity=".7"/></g>`,
  watchband: (c) => `<g filter="url(#ds)">
    <rect x="245" y="70" width="110" height="470" rx="40" fill="url(#mv)"/>
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="300" cy="${400 + i * 26}" r="6" fill="${D(c, 0.5)}"/>`).join("")}
    <rect x="200" y="200" width="200" height="220" rx="56" fill="url(#metal)"/><rect x="214" y="214" width="172" height="192" rx="46" fill="url(#scr)"/>
    <text x="300" y="320" font-family="Arial" font-weight="800" font-size="46" text-anchor="middle" fill="#fff">10:09</text>
    <circle cx="300" cy="352" r="7" fill="${c}"/><rect x="400" y="268" width="14" height="44" rx="6" fill="url(#metal)"/></g>`,
  keyboard: (c) => `<g filter="url(#ds)" transform="translate(0 30) skewX(-14) translate(70 0)">
    <rect x="80" y="210" width="400" height="190" rx="26" fill="url(#m)"/><rect x="80" y="210" width="400" height="190" rx="26" fill="url(#gl)"/>
    ${Array.from({ length: 4 }, (_, r) => Array.from({ length: 10 }, (_, k) => `<rect x="${100 + k * 37}" y="${228 + r * 38}" width="30" height="30" rx="7" fill="${(r + k) % 7 === 0 ? "#ff5b14" : L(c, 0.85)}" stroke="${D(c, 0.25)}" stroke-width="2"/>`).join("")).join("")}
    <rect x="170" y="380" width="220" height="12" rx="6" fill="${L(c, 0.85)}"/></g>`,
  mouse: (c) => `<g filter="url(#ds)">
    <path d="M300 110 C 400 110, 420 220, 420 320 C 420 440, 360 490, 300 490 C 240 490, 180 440, 180 320 C 180 220, 200 110, 300 110z" fill="url(#m)"/>
    <path d="M300 110 C 400 110, 420 220, 420 320 C 420 440, 360 490, 300 490 C 240 490, 180 440, 180 320 C 180 220, 200 110, 300 110z" fill="url(#gl)"/>
    <path d="M300 112 V 260" stroke="${D(c, 0.45)}" stroke-width="4"/><rect x="288" y="160" width="24" height="56" rx="12" fill="${D(c, 0.55)}"/>
    <path d="M195 300 C 240 330, 360 330, 405 300" stroke="#ff5b14" stroke-width="5" fill="none" opacity=".9"/></g>`,
  mousepad: (c) => `<g filter="url(#ds)" transform="translate(300 330) skewX(-20) translate(-300 -330)">
    <rect x="110" y="230" width="380" height="210" rx="22" fill="url(#m)"/><rect x="110" y="230" width="380" height="210" rx="22" fill="none" stroke="${D(c, 0.4)}" stroke-width="8"/>
    <path d="M130 410 C 200 300, 300 380, 470 260" stroke="${L(c, 0.5)}" stroke-width="10" fill="none" opacity=".6"/></g>
    ${K.mouse("#1f2026").replace('filter="url(#ds)"', 'filter="url(#ds)" transform="translate(250 190) scale(.42)"')}`,
  webcam: (c) => `<g filter="url(#ds)">
    <path d="M220 330 L190 470 H410 L380 330z" fill="url(#mv)"/><rect x="170" y="460" width="260" height="20" rx="10" fill="${D(c, 0.4)}"/>
    <rect x="130" y="170" width="340" height="170" rx="85" fill="url(#m)"/><rect x="130" y="170" width="340" height="170" rx="85" fill="url(#gl)"/>
    <circle cx="300" cy="255" r="62" fill="#0b0c10"/><circle cx="300" cy="255" r="44" fill="url(#scr)" stroke="#3a3e4a" stroke-width="6"/>
    <circle cx="284" cy="238" r="12" fill="#fff" opacity=".5"/><circle cx="410" cy="255" r="8" fill="#c8f43c"/></g>`,
  mic: (c) => `<g filter="url(#ds)">
    <ellipse cx="300" cy="480" rx="100" ry="22" fill="url(#mv)"/><rect x="290" y="360" width="20" height="120" fill="url(#metal)"/>
    <path d="M220 270 C 220 380, 380 380, 380 270" stroke="url(#metal)" stroke-width="14" fill="none"/>
    <rect x="236" y="100" width="128" height="250" rx="64" fill="url(#m)"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M246 ${140 + i * 22} H354" stroke="${D(c, 0.35)}" stroke-width="5" stroke-linecap="round"/>`).join("")}
    <rect x="236" y="100" width="128" height="250" rx="64" fill="url(#gl)"/></g>`,
  hub: (c) => `<g filter="url(#ds)">
    <rect x="130" y="240" width="340" height="120" rx="34" fill="url(#m)"/><rect x="130" y="240" width="340" height="120" rx="34" fill="url(#gl)"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${168 + i * 62}" y="282" width="46" height="18" rx="5" fill="#15161b"/>`).join("")}
    <rect x="420" y="282" width="20" height="36" rx="5" fill="#15161b"/><circle cx="160" cy="330" r="5" fill="#c8f43c"/>
    <path d="M130 300 C 80 300, 90 180, 160 170" stroke="${D(c, 0.3)}" stroke-width="16" fill="none" stroke-linecap="round"/>
    <rect x="148" y="140" width="40" height="56" rx="10" fill="url(#mv)"/></g>`,
  ssd: (c) => `<g filter="url(#ds)" transform="rotate(-10 300 300)">
    <rect x="160" y="140" width="280" height="330" rx="30" fill="url(#m)"/><rect x="160" y="140" width="280" height="330" rx="30" fill="url(#gl)"/>
    <rect x="182" y="162" width="236" height="286" rx="20" fill="none" stroke="${L(c, 0.4)}" stroke-width="3" opacity=".6"/>
    <text x="300" y="320" font-family="Arial" font-weight="900" font-size="58" text-anchor="middle" fill="${L(c, 0.8)}">2TB</text>
    <text x="300" y="360" font-family="Arial" font-weight="700" font-size="20" text-anchor="middle" fill="${L(c, 0.7)}" letter-spacing="6">NVMe SSD</text>
    <rect x="270" y="456" width="60" height="16" rx="4" fill="#15161b"/></g>`,
  flashdrive: (c) => `<g filter="url(#ds)" transform="rotate(-30 300 300)">
    <rect x="200" y="210" width="230" height="110" rx="26" fill="url(#m)"/><rect x="200" y="210" width="230" height="110" rx="26" fill="url(#gl)"/>
    <rect x="140" y="232" width="70" height="66" rx="8" fill="url(#metal)"/><rect x="156" y="248" width="16" height="12" fill="#555"/><rect x="156" y="270" width="16" height="12" fill="#555"/>
    <circle cx="395" cy="265" r="14" fill="none" stroke="${D(c, 0.4)}" stroke-width="7"/></g>`,
  laptopstand: (c) => `<g filter="url(#ds)">
    <path d="M150 460 L250 230 H290 L190 460z" fill="url(#metal)"/><path d="M450 460 L350 230 H310 L410 460z" fill="url(#metal)"/>
    <path d="M140 250 L460 190 L470 214 L150 274z" fill="url(#mv)"/>
    <path d="M170 236 L430 186 L400 60 L160 104z" fill="#2a2c33"/><path d="M180 228 L420 182 L394 74 L170 114z" fill="url(#scr)"/>
    <path d="M180 228 L300 205 L230 100 L170 114z" fill="#fff" opacity=".07"/><rect x="152" y="252" width="320" height="10" fill="${c}" transform="rotate(-10 300 255)"/></g>`,
  controller: (c) => `<g filter="url(#ds)">
    <path d="M190 220 H410 C 480 220, 520 330, 510 400 C 500 470, 440 470, 410 420 L 380 380 H220 L190 420 C 160 470, 100 470, 90 400 C 80 330, 120 220, 190 220z" fill="url(#m)"/>
    <path d="M190 220 H410 C 480 220, 520 330, 510 400" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="4"/>
    <path d="M170 290 v50 M145 315 h50" stroke="#15161b" stroke-width="18" stroke-linecap="round"/>
    <circle cx="420" cy="290" r="13" fill="#ff5b14"/><circle cx="450" cy="318" r="13" fill="#c8f43c"/><circle cx="390" cy="318" r="13" fill="#3d7bff"/><circle cx="420" cy="346" r="13" fill="#ff5c8a"/>
    <circle cx="250" cy="360" r="26" fill="#15161b"/><circle cx="350" cy="360" r="26" fill="#15161b"/></g>`,
  lightbar: (c) => `<g filter="url(#ds)">
    <rect x="130" y="300" width="340" height="190" rx="18" fill="#2a2c33"/><rect x="142" y="312" width="316" height="166" rx="10" fill="url(#scr)"/>
    <path d="M150 140 H450 L400 300 H200z" fill="${L(c, 0.5)}" opacity=".35"/>
    <rect x="140" y="110" width="320" height="40" rx="20" fill="url(#m)"/><rect x="160" y="142" width="280" height="8" rx="4" fill="#fff8d6"/>
    <rect x="285" y="150" width="30" height="160" fill="url(#metal)"/></g>`,
  ringlight: (c) => `<g filter="url(#ds)">
    <rect x="292" y="330" width="16" height="160" fill="url(#metal)"/><path d="M300 480 L230 500 M300 480 L370 500 M300 480 V505" stroke="${D(c, 0.3)}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="300" cy="230" r="140" fill="none" stroke="url(#m)" stroke-width="44"/><circle cx="300" cy="230" r="140" fill="none" stroke="#fffbe6" stroke-width="14" opacity=".9"/>
    <rect x="262" y="180" width="76" height="140" rx="14" fill="#1a1c22"/><circle cx="300" cy="200" r="8" fill="#3a3e4a"/></g>`,
  wireless: (c) => `<g filter="url(#ds)">
    <ellipse cx="300" cy="380" rx="170" ry="70" fill="${D(c, 0.35)}"/><ellipse cx="300" cy="364" rx="170" ry="70" fill="url(#m)"/>
    <ellipse cx="300" cy="364" rx="120" ry="46" fill="none" stroke="${L(c, 0.5)}" stroke-width="5" opacity=".7"/>
    <path d="M300 250 v-60 M250 270 a70 70 0 0 1 100 0 M220 240 a110 110 0 0 1 160 0" stroke="#ff5b14" stroke-width="9" fill="none" stroke-linecap="round"/>
    <circle cx="300" cy="420" r="5" fill="#c8f43c"/></g>`,
  carcharger: (c) => `<g filter="url(#ds)" transform="rotate(-20 300 300)">
    <rect x="250" y="110" width="100" height="70" rx="16" fill="url(#m)"/><rect x="262" y="128" width="76" height="14" rx="4" fill="#15161b"/><rect x="262" y="152" width="76" height="14" rx="4" fill="#15161b"/>
    <path d="M262 180 H338 L322 420 H278z" fill="url(#metal)"/><rect x="270" y="420" width="60" height="34" rx="8" fill="url(#mv)"/>
    <path d="M232 260 h-26 M394 260 h-26" stroke="url(#metal)" stroke-width="16" stroke-linecap="round"/></g>`,
};

export const KINDS = Object.keys(K);
for (const [kind, fn] of Object.entries(K)) {
  for (const [cname, c] of Object.entries(COLORS)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">${defs(c)}${fn(c)}</svg>`;
    writeFileSync(new URL(`${kind}-${cname}.svg`, out), svg);
  }
}
console.log(`generated ${KINDS.length * Object.keys(COLORS).length} renders`);
