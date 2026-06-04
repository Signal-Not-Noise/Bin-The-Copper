/**
 * Mobile: responsive canvas scale + touch → keyboard mapping
 */
const TouchInput = {
  active: false,

  isMobile() {
    return window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
  },

  setKey(code, down) {
    keys[code] = down;
  },

  bindButton(btn) {
    const code = btn.dataset.key;
    if (!code) return;

    const down = (e) => {
      e.preventDefault();
      TouchInput.setKey(code, true);
      AudioEngine.ensureInit();
    };
    const up = (e) => {
      e.preventDefault();
      TouchInput.setKey(code, false);
    };

    btn.addEventListener('touchstart', down, { passive: false });
    btn.addEventListener('touchend', up, { passive: false });
    btn.addEventListener('touchcancel', up, { passive: false });
    btn.addEventListener('mousedown', down);
    btn.addEventListener('mouseup', up);
    btn.addEventListener('mouseleave', up);
  },

  init() {
    const panel = document.getElementById('touch-controls');
    const rotateHint = document.getElementById('rotate-hint');
    const controlsHint = document.getElementById('controls-hint');
    const messageHint = document.querySelector('#message-overlay .hint');

    const updateLayout = () => {
      const mobile = TouchInput.isMobile();
      document.body.classList.toggle('is-mobile', mobile);
      TouchInput.active = mobile;

      if (panel) panel.classList.toggle('visible', mobile);

      if (controlsHint) {
        controlsHint.textContent = mobile
          ? 'D-PAD: MOVE / JUMP / DUCK  |  SWING & THROW buttons  |  TAP SCREEN TO CONTINUE'
          : 'ARROWS: MOVE / JUMP / DUCK  |  Z: SWING  |  X: THROW  |  M: MUTE  |  WALK INTO YOUR BIN TO EQUIP';
      }
      if (messageHint) {
        messageHint.textContent = mobile ? 'TAP TO CONTINUE' : 'PRESS ENTER TO CONTINUE';
      }

      const container = document.getElementById('game-container');
      const hud = document.getElementById('hud-top');
      const touchH = panel && mobile ? panel.offsetHeight : 0;
      const hudH = hud ? hud.offsetHeight : 0;
      const footer = document.getElementById('controls-hint');
      const footerH = footer && !mobile ? footer.offsetHeight : (mobile ? 0 : 0);

      const availW = window.innerWidth - 8;
      const availH = window.innerHeight - hudH - touchH - footerH - 16;
      const scale = Math.min(availW / 960, availH / 540, 2);
      const cssW = Math.floor(960 * scale);
      const cssH = Math.floor(540 * scale);

      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      if (container) {
        container.style.width = `${cssW}px`;
      }

      if (rotateHint && mobile) {
        const portrait = window.innerHeight > window.innerWidth;
        rotateHint.classList.toggle('visible', portrait);
      } else if (rotateHint) {
        rotateHint.classList.remove('visible');
      }
    };

    panel?.querySelectorAll('[data-key]').forEach((btn) => TouchInput.bindButton(btn));

    const tapContinue = (e) => {
      if (typeof game !== 'undefined' && game.awaitingContinue) {
        e.preventDefault();
        game.onContinue();
        AudioEngine.ensureInit();
      }
    };
    messageOverlay?.addEventListener('click', tapContinue);
    messageOverlay?.addEventListener('touchend', tapContinue, { passive: false });

    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', () => setTimeout(updateLayout, 200));
    updateLayout();
  },
};

document.addEventListener('DOMContentLoaded', () => TouchInput.init());