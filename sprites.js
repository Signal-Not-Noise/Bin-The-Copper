/**
 * Detailed pixel-style character sprites for Bin The Copper
 */

const SKIN = '#f0c9b8';
const SKIN_SHADOW = '#d4a088';
const SKIN_HI = '#ffe8dc';

function drawUnionJackVest(c, x, y, w, h) {
  c.save();
  c.translate(x, y);
  c.fillStyle = '#012169';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(w, h);
  c.moveTo(w, 0);
  c.lineTo(0, h);
  c.stroke();
  c.strokeStyle = '#c8102e';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(w, h);
  c.moveTo(w, 0);
  c.lineTo(0, h);
  c.stroke();
  const cx = w / 2;
  const cy = h / 2;
  c.fillStyle = '#c8102e';
  c.fillRect(cx - 3, 0, 6, h);
  c.fillRect(0, cy - 3, w, 6);
  c.fillStyle = '#ffffff';
  c.fillRect(cx - 1, 0, 2, h);
  c.fillRect(0, cy - 1, w, 2);
  c.strokeStyle = '#012169';
  c.lineWidth = 1;
  c.strokeRect(0, 0, w, h);
  c.restore();
}

function drawSkinhead(c, f) {
  const duck = f.ducking;
  const yOff = duck ? 32 : 0;
  const walk = f.pose === 'walk' ? Math.sin(f.animFrame * 0.25) * 3 : 0;
  const atk = f.attacking ? (14 - f.attackTimer) / 14 : 0;

  c.save();
  c.translate(walk, yOff);

  // --- Boots (Dr Martens style) ---
  c.fillStyle = '#0d0d0d';
  c.fillRect(-20, -6, 16, 10);
  c.fillRect(4, -6, 16, 10);
  c.fillStyle = '#f4d03f';
  c.fillRect(-18, -4, 12, 2);
  c.fillRect(6, -4, 12, 2);
  c.fillStyle = '#1a1a1a';
  c.fillRect(-18, -28, 14, 24);
  c.fillRect(4, -28, 14, 24);
  c.fillStyle = '#2a2a2a';
  c.fillRect(-16, -26, 10, 4);
  c.fillRect(6, -26, 10, 4);

  // --- Red tight trousers ---
  c.fillStyle = '#9b2226';
  c.fillRect(-17, -72, 34, 46);
  c.fillStyle = '#c1121f';
  c.fillRect(-15, -70, 30, 42);
  c.fillStyle = '#e5383b';
  c.fillRect(-12, -68, 8, 38);
  c.fillRect(4, -68, 8, 38);
  c.strokeStyle = '#7f1015';
  c.lineWidth = 1;
  c.strokeRect(-15, -70, 30, 42);

  // --- Braces ---
  c.strokeStyle = '#1d3557';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-12, -108);
  c.lineTo(-10, -42);
  c.moveTo(12, -108);
  c.lineTo(10, -42);
  c.stroke();
  c.fillStyle = '#ffd166';
  c.fillRect(-12, -44, 6, 5);
  c.fillRect(6, -44, 6, 5);

  // --- Union Jack vest (sleeveless) ---
  drawUnionJackVest(c, -20, -118, 40, 44);
  c.fillStyle = SKIN;
  c.fillRect(-22, -118, 6, 18);
  c.fillRect(16, -118, 6, 18);

  // --- Neck & head ---
  c.fillStyle = SKIN_SHADOW;
  c.fillRect(-6, -128, 12, 12);
  c.fillStyle = SKIN;
  c.fillRect(-11, -158, 22, 32);
  c.fillStyle = SKIN_HI;
  c.fillRect(-4, -152, 8, 10);
  // Ears
  c.fillStyle = SKIN_SHADOW;
  c.fillRect(-14, -148, 4, 8);
  c.fillRect(10, -148, 4, 8);
  // Shaved head
  c.fillStyle = '#e8c4b0';
  c.beginPath();
  c.ellipse(0, -168, 15, 14, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#c9a090';
  c.fillRect(-8, -172, 16, 4);
  // Brow / eyes
  c.fillStyle = '#3d2314';
  c.fillRect(-8, -156, 5, 3);
  c.fillRect(3, -156, 5, 3);
  c.fillStyle = '#fff';
  c.fillRect(-7, -155, 2, 2);
  c.fillRect(4, -155, 2, 2);
  // Nose / mouth (tough expression)
  c.fillStyle = SKIN_SHADOW;
  c.fillRect(-2, -150, 4, 5);
  c.strokeStyle = '#8b5a4a';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-4, -142);
  c.lineTo(4, -142);
  c.stroke();
  // Neck tattoo
  c.fillStyle = '#222';
  c.font = '5px monospace';
  c.fillText('ENGLAND', -14, -132);

  // Attack lean
  if (atk > 0) {
    c.rotate(0.15 * atk);
  }

  c.restore();
}

function drawCopper(c, f) {
  const duck = f.ducking;
  const yOff = duck ? 32 : 0;
  const walk = f.pose === 'walk' ? Math.sin(f.animFrame * 0.25) * 3 : 0;

  c.save();
  c.translate(walk, yOff);

  // --- Black police boots ---
  c.fillStyle = '#0a0a0a';
  c.fillRect(-18, -6, 15, 10);
  c.fillRect(3, -6, 15, 10);
  c.fillStyle = '#1a1a1a';
  c.fillRect(-16, -30, 13, 26);
  c.fillRect(4, -30, 13, 26);

  // --- Dark uniform trousers ---
  c.fillStyle = '#0d1b2a';
  c.fillRect(-16, -76, 32, 48);
  c.fillStyle = '#1b263b';
  c.fillRect(-14, -74, 28, 44);
  c.strokeStyle = '#415a77';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, -74);
  c.lineTo(0, -30);
  c.stroke();
  // Belt
  c.fillStyle = '#222';
  c.fillRect(-16, -78, 32, 5);
  c.fillStyle = '#c9a227';
  c.fillRect(-4, -77, 8, 3);

  // --- White shirt + tie ---
  c.fillStyle = '#f8f9fa';
  c.fillRect(-14, -118, 28, 42);
  c.fillStyle = '#e9ecef';
  c.fillRect(-10, -112, 20, 34);
  c.fillStyle = '#0d0d0d';
  c.beginPath();
  c.moveTo(0, -116);
  c.lineTo(-4, -88);
  c.lineTo(4, -88);
  c.closePath();
  c.fill();
  c.fillStyle = '#1d3557';
  c.fillRect(-18, -120, 36, 14);
  c.fillStyle = '#457b9d';
  c.fillRect(-16, -118, 32, 6);
  // Epaulettes
  c.fillStyle = '#ffd166';
  c.fillRect(-20, -118, 5, 8);
  c.fillRect(15, -118, 5, 8);
  // Badge
  c.fillStyle = '#ffd166';
  c.beginPath();
  c.arc(10, -100, 7, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#012169';
  c.font = 'bold 6px Arial';
  c.textAlign = 'center';
  c.fillText('PC', 10, -97);
  // Radio
  c.fillStyle = '#222';
  c.fillRect(-22, -108, 6, 14);
  c.fillStyle = '#333';
  c.fillRect(-21, -106, 4, 4);

  // --- Head ---
  c.fillStyle = SKIN;
  c.fillRect(-11, -152, 22, 28);
  c.fillStyle = SKIN_HI;
  c.fillRect(-4, -146, 8, 10);
  c.fillStyle = SKIN_SHADOW;
  c.fillRect(-6, -132, 12, 8);
  // Ears
  c.fillRect(-14, -144, 4, 8);
  c.fillRect(10, -144, 4, 8);
  // Eyes
  c.fillStyle = '#2d1810';
  c.fillRect(-7, -142, 5, 4);
  c.fillRect(2, -142, 5, 4);
  // Custodian helmet
  c.fillStyle = '#0d0d0d';
  c.beginPath();
  c.moveTo(-18, -158);
  c.lineTo(18, -158);
  c.lineTo(14, -172);
  c.lineTo(-14, -172);
  c.closePath();
  c.fill();
  c.fillStyle = '#1a1a1a';
  c.fillRect(-12, -176, 24, 6);
  c.fillStyle = '#2a2a2a';
  c.fillRect(-16, -158, 32, 4);
  c.fillStyle = '#c9a227';
  c.fillRect(-6, -168, 12, 3);
  // Chin strap
  c.strokeStyle = '#333';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-12, -155);
  c.lineTo(-8, -138);
  c.moveTo(12, -155);
  c.lineTo(8, -138);
  c.stroke();

  c.restore();
}

/** UK council wheelie bin — tapered body, black lid, rear wheels */
function drawUKWheelieBin(c, x, y, owner, scale, lidOpen) {
  const isPlayer = owner === 'player';
  const bodyTop = (isPlayer ? 38 : 36) * scale;
  const bodyBot = (isPlayer ? 28 : 26) * scale;
  const h = 52 * scale;
  const bodyColor = isPlayer ? '#008037' : '#1c1c1c';
  const bodyHi = isPlayer ? '#00a34c' : '#3a3a3a';
  const bodyLo = isPlayer ? '#005c28' : '#0a0a0a';
  const lidColor = '#141414';
  const stripeColor = isPlayer ? null : '#005eb8';

  c.save();
  c.translate(x, y);

  // Rear wheels (UK bins: two wheels at back)
  c.fillStyle = '#0a0a0a';
  c.strokeStyle = '#333';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(-bodyBot * 0.35, 4 * scale, 7 * scale, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.beginPath();
  c.arc(bodyBot * 0.35, 4 * scale, 7 * scale, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = '#555';
  c.beginPath();
  c.arc(-bodyBot * 0.35, 4 * scale, 3 * scale, 0, Math.PI * 2);
  c.arc(bodyBot * 0.35, 4 * scale, 3 * scale, 0, Math.PI * 2);
  c.fill();

  // Tapered body (wider at top — typical UK moulding)
  c.fillStyle = bodyLo;
  c.beginPath();
  c.moveTo(-bodyBot / 2, 0);
  c.lineTo(bodyBot / 2, 0);
  c.lineTo(bodyTop / 2, -h);
  c.lineTo(-bodyTop / 2, -h);
  c.closePath();
  c.fill();

  c.fillStyle = bodyColor;
  c.beginPath();
  c.moveTo(-bodyBot / 2 + 2, -2);
  c.lineTo(bodyBot / 2 - 2, -2);
  c.lineTo(bodyTop / 2 - 2, -h + 2);
  c.lineTo(-bodyTop / 2 + 2, -h + 2);
  c.closePath();
  c.fill();

  c.fillStyle = bodyHi;
  c.fillRect(-bodyTop / 2 + 4, -h + 4, 8 * scale, h - 8);

  // Cop bin: blue recycling band (UK blue bin style accent)
  if (stripeColor) {
    c.fillStyle = stripeColor;
    c.fillRect(-bodyTop / 2 + 3, -h * 0.55, bodyTop - 6, 14 * scale);
    c.fillStyle = '#fff';
    c.font = `bold ${5 * scale}px Arial`;
    c.textAlign = 'center';
    c.fillText('♻', 0, -h * 0.45);
  } else {
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.font = `bold ${5 * scale}px Arial`;
    c.textAlign = 'center';
    c.fillText('WASTE', 0, -h * 0.45);
  }

  // Rim under lid
  c.fillStyle = '#222';
  c.fillRect(-bodyTop / 2, -h - 2 * scale, bodyTop, 3 * scale);

  // Black hinged lid
  c.fillStyle = lidColor;
  if (lidOpen) {
    c.save();
    c.translate(-bodyTop / 2, -h - 4 * scale);
    c.rotate(-0.55);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(bodyTop, 0);
    c.lineTo(bodyTop - 2, -12 * scale);
    c.lineTo(2, -10 * scale);
    c.closePath();
    c.fill();
    c.restore();
  } else {
    c.beginPath();
    c.moveTo(-bodyTop / 2 - 2, -h - 4 * scale);
    c.lineTo(bodyTop / 2 + 2, -h - 4 * scale);
    c.quadraticCurveTo(0, -h - 16 * scale, -bodyTop / 2 - 2, -h - 4 * scale);
    c.fill();
    c.fillStyle = '#2a2a2a';
    c.fillRect(-bodyTop / 2 + 4, -h - 6 * scale, bodyTop - 8, 3 * scale);
  }

  // Lid handle
  c.strokeStyle = '#666';
  c.lineWidth = 2 * scale;
  c.beginPath();
  c.arc(0, -h - (lidOpen ? 18 : 10) * scale, 5 * scale, 0, Math.PI);
  c.stroke();

  // Front lip / bar
  c.fillStyle = '#333';
  c.fillRect(-6 * scale, -h * 0.15, 12 * scale, 4 * scale);

  c.restore();
}

function drawWheelieBinDetailed(c, x, y, color, scale, lidOpen, owner) {
  const o = owner || (color === '#2d6a4f' || color === '#008037' ? 'player' : 'cop');
  drawUKWheelieBin(c, x, y, o, scale, lidOpen);
}

function shadeColorHex(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `rgb(${r},${g},${b})`;
}

function drawWheelieBinGraphic(c, x, y, ownerOrColor, scale, owner) {
  const o = owner || (ownerOrColor === 'player' || ownerOrColor === 'cop' ? ownerOrColor : 'player');
  drawUKWheelieBin(c, x, y, o, scale, false);
}

function drawHitSpark(c, x, y, frame) {
  c.save();
  c.translate(x, y);
  c.strokeStyle = '#ffeb3b';
  c.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + frame * 0.3;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(a) * (18 + frame), Math.sin(a) * (18 + frame));
    c.stroke();
  }
  c.fillStyle = '#fff';
  c.font = 'bold 14px Arial';
  c.textAlign = 'center';
  c.fillText('WHACK!', 0, -8);
  c.restore();
}