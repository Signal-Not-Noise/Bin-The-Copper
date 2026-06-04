/**
 * Mobile: fixed thumbstick (left), HIT/THROW (right), locked viewport
 */
const TouchInput = {
  active: false,
  analog: { x: 0, y: 0, magnitude: 0, active: false },
  joystickTouchId: null,

  isMobile() {
    const touchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;
    const narrowScreen = window.innerWidth <= 1024;
    const shortScreen = window.innerHeight <= 700 && window.innerWidth <= 1200;
    return touchDevice && (narrowScreen || shortScreen) || window.innerWidth <= 768;
  },

  enableTouchUI() {
    const panel = document.getElementById('touch-controls');
    TouchInput.active = true;
    document.body.classList.add('is-mobile');
    document.documentElement.classList.add('is-mobile');
    if (panel) {
      panel.classList.add('visible');
      panel.setAttribute('aria-hidden', 'false');
    }
  },

  setKey(code, down) {
    keys[code] = down;
  },

  clearMovementKeys() {
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    keys.ArrowDown = false;
  },

  bindActionButton(btn) {
    const code = btn.dataset.key;
    if (!code) return;

    const down = (e) => {
      e.preventDefault();
      e.stopPropagation();
      TouchInput.setKey(code, true);
      AudioEngine.ensureInit();
    };
    const up = (e) => {
      e.preventDefault();
      e.stopPropagation();
      TouchInput.setKey(code, false);
    };

    btn.addEventListener('touchstart', down, { passive: false });
    btn.addEventListener('touchend', up, { passive: false });
    btn.addEventListener('touchcancel', up, { passive: false });
    btn.addEventListener('mousedown', down);
    btn.addEventListener('mouseup', up);
    btn.addEventListener('mouseleave', up);
  },

  initJoystick() {
    const zone = document.getElementById('joystick-zone');
    const base = zone?.querySelector('.joystick-base');
    const knob = zone?.querySelector('.joystick-knob');
    if (!zone || !base || !knob) return;

    let maxRadius = 52;

    const resetStick = () => {
      TouchInput.analog.x = 0;
      TouchInput.analog.y = 0;
      TouchInput.analog.magnitude = 0;
      TouchInput.analog.active = false;
      TouchInput.joystickTouchId = null;
      knob.style.transform = 'translate(0px, 0px)';
      zone.classList.remove('stick-active');
      TouchInput.clearMovementKeys();
    };

    const applyStick = (clientX, clientY) => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      maxRadius = rect.width * 0.38;

      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      zone.classList.add('stick-active');

      const nx = dx / maxRadius;
      const ny = dy / maxRadius;
      TouchInput.analog.x = nx;
      TouchInput.analog.y = ny;
      TouchInput.analog.magnitude = Math.min(1, dist / maxRadius);
      TouchInput.analog.active = dist > 8;

      TouchInput.clearMovementKeys();
      if (nx < -0.2) keys.ArrowLeft = true;
      if (nx > 0.2) keys.ArrowRight = true;
      if (ny < -0.35) keys.ArrowUp = true;
      if (ny > 0.35) keys.ArrowDown = true;
    };

    const findTouch = (e, id) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === id) return t;
      }
      return null;
    };

    zone.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        TouchInput.enableTouchUI();
        AudioEngine.ensureInit();
        if (TouchInput.joystickTouchId !== null) return;
        const t = e.changedTouches[0];
        TouchInput.joystickTouchId = t.identifier;
        applyStick(t.clientX, t.clientY);
      },
      { passive: false }
    );

    zone.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (TouchInput.joystickTouchId === null) return;
        const t = findTouch(e, TouchInput.joystickTouchId);
        if (t) applyStick(t.clientX, t.clientY);
      },
      { passive: false }
    );

    const endTouch = (e) => {
      if (TouchInput.joystickTouchId === null) return;
      const t = findTouch(e, TouchInput.joystickTouchId);
      if (t || e.type === 'touchcancel') resetStick();
    };

    zone.addEventListener('touchend', endTouch, { passive: false });
    zone.addEventListener('touchcancel', endTouch, { passive: false });

    let mouseDown = false;
    zone.addEventListener('mousedown', (e) => {
      mouseDown = true;
      applyStick(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      if (mouseDown) applyStick(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (mouseDown) {
        mouseDown = false;
        resetStick();
      }
    });
  },

  lockViewport() {
    document.addEventListener(
      'touchmove',
      (e) => {
        if (!TouchInput.active) return;
        const el = e.target;
        if (
          el.closest('#joystick-zone') ||
          el.closest('.touch-actions') ||
          el.closest('#message-overlay')
        ) {
          return;
        }
        e.preventDefault();
      },
      { passive: false }
    );

    window.addEventListener('scroll', () => {
      if (TouchInput.active) window.scrollTo(0, 0);
    });
  },

  init() {
    const panel = document.getElementById('touch-controls');
    const controlsHint = document.getElementById('controls-hint');
    const messageHint = document.querySelector('#message-overlay .hint');
    const playArea = document.getElementById('play-area');

    TouchInput.initJoystick();
    TouchInput.lockViewport();
    panel?.querySelectorAll('.touch-btn[data-key]').forEach((btn) => TouchInput.bindActionButton(btn));

    // First touch on phone always enables controls (fixes hidden UI)
    document.addEventListener(
      'touchstart',
      () => {
        if (TouchInput.isMobile()) TouchInput.enableTouchUI();
        AudioEngine.ensureInit();
      },
      { passive: true }
    );

    const tapContinue = (e) => {
      if (typeof game !== 'undefined' && game.awaitingContinue) {
        e.preventDefault();
        game.onContinue();
        AudioEngine.ensureInit();
      }
    };
    messageOverlay?.addEventListener('click', tapContinue);
    messageOverlay?.addEventListener('touchend', tapContinue, { passive: false });

    const resetStickVisual = () => {
      TouchInput.analog.active = false;
      TouchInput.clearMovementKeys();
      const knob = document.querySelector('.joystick-knob');
      const zone = document.getElementById('joystick-zone');
      if (knob) knob.style.transform = 'translate(0px, 0px)';
      zone?.classList.remove('stick-active');
    };

    const updateLayout = () => {
      const mobile = TouchInput.isMobile();

      if (!mobile) {
        TouchInput.active = false;
        document.body.classList.remove('is-mobile');
        document.documentElement.classList.remove('is-mobile');
        panel?.classList.remove('visible');
        panel?.setAttribute('aria-hidden', 'true');
        canvas.style.width = '';
        canvas.style.height = '';
        document.getElementById('game-container').style.width = '';
        if (playArea) playArea.style.height = '';
        return;
      }

      TouchInput.enableTouchUI();

      if (controlsHint) {
        controlsHint.textContent =
          'Thumbstick left — HIT & THROW right — tap screen to continue';
      }
      if (messageHint) {
        messageHint.textContent = 'TAP TO CONTINUE';
      }

      const hud = document.getElementById('hud-top');
      const hudH = hud?.offsetHeight ?? 0;
      const playH = window.innerHeight - hudH;
      if (playArea) playArea.style.height = `${playH}px`;

      const availW = window.innerWidth;
      const availH = playH;
      const scale = Math.min(availW / 960, availH / 540);
      canvas.style.width = `${Math.floor(960 * scale)}px`;
      canvas.style.height = `${Math.floor(540 * scale)}px`;

      const rotateHint = document.getElementById('rotate-hint');
      if (rotateHint) {
        rotateHint.classList.toggle('visible', window.innerHeight > window.innerWidth);
      }

      window.scrollTo(0, 0);
    };

    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', () => setTimeout(updateLayout, 300));
    updateLayout();
  },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TouchInput.init());
} else {
  TouchInput.init();
}