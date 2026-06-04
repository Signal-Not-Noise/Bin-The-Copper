/**
 * Mobile: fixed viewport, analog stick, large action buttons
 */
const TouchInput = {
  active: false,
  analog: { x: 0, y: 0, magnitude: 0, active: false },
  joystickTouchId: null,

  isMobile() {
    return window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
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
      TouchInput.clearMovementKeys();
    };

    const applyStick = (clientX, clientY) => {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      maxRadius = rect.width * 0.36;

      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      knob.style.transform = `translate(${dx}px, ${dy}px)`;

      const nx = dx / maxRadius;
      const ny = dy / maxRadius;
      TouchInput.analog.x = nx;
      TouchInput.analog.y = ny;
      TouchInput.analog.magnitude = Math.min(1, dist / maxRadius);
      TouchInput.analog.active = dist > 10;

      TouchInput.clearMovementKeys();
      if (nx < -0.22) keys.ArrowLeft = true;
      if (nx > 0.22) keys.ArrowRight = true;
      if (ny < -0.38) keys.ArrowUp = true;
      if (ny > 0.38) keys.ArrowDown = true;
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

    // Mouse fallback for testing
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
        const t = e.target;
        if (t.closest('#joystick-zone') || t.closest('.touch-btn') || t.closest('#message-overlay')) {
          return;
        }
        e.preventDefault();
      },
      { passive: false }
    );

    window.addEventListener(
      'scroll',
      () => {
        if (TouchInput.active) window.scrollTo(0, 0);
      },
      { passive: true }
    );
  },

  init() {
    const panel = document.getElementById('touch-controls');
    const rotateHint = document.getElementById('rotate-hint');
    const controlsHint = document.getElementById('controls-hint');
    const messageHint = document.querySelector('#message-overlay .hint');
    const playArea = document.getElementById('play-area');

    TouchInput.initJoystick();
    TouchInput.lockViewport();

    panel?.querySelectorAll('.touch-btn[data-key]').forEach((btn) => TouchInput.bindActionButton(btn));

    const tapContinue = (e) => {
      if (typeof game !== 'undefined' && game.awaitingContinue) {
        e.preventDefault();
        game.onContinue();
        AudioEngine.ensureInit();
      }
    };
    messageOverlay?.addEventListener('click', tapContinue);
    messageOverlay?.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        tapContinue(e);
      },
      { passive: false }
    );

    const updateLayout = () => {
      const mobile = TouchInput.isMobile();
      document.body.classList.toggle('is-mobile', mobile);
      document.documentElement.classList.toggle('is-mobile', mobile);
      TouchInput.active = mobile;

      if (panel) panel.classList.toggle('visible', mobile);
      if (!mobile) resetStickIfNeeded();

      if (controlsHint) {
        controlsHint.textContent = mobile
          ? 'Left stick: move / jump / duck  |  Right: SWING & THROW  |  Tap to continue'
          : 'ARROWS: MOVE / JUMP / DUCK  |  Z: SWING  |  X: THROW  |  M: MUTE  |  WALK INTO YOUR BIN TO EQUIP';
      }
      if (messageHint) {
        messageHint.textContent = mobile ? 'TAP TO CONTINUE' : 'PRESS ENTER TO CONTINUE';
      }

      if (!mobile) {
        canvas.style.width = '';
        canvas.style.height = '';
        document.getElementById('game-container').style.width = '';
        return;
      }

      const hud = document.getElementById('hud-top');
      const hudH = hud?.offsetHeight ?? 0;
      const playH = window.innerHeight - hudH;
      if (playArea) {
        playArea.style.height = `${playH}px`;
      }

      const availW = window.innerWidth;
      const availH = playH;
      const scale = Math.min(availW / 960, availH / 540);
      const cssW = Math.floor(960 * scale);
      const cssH = Math.floor(540 * scale);

      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      if (rotateHint) {
        rotateHint.classList.toggle('visible', window.innerHeight > window.innerWidth);
      }

      window.scrollTo(0, 0);
    };

    function resetStickIfNeeded() {
      if (TouchInput.analog.active) {
        TouchInput.analog.active = false;
        TouchInput.clearMovementKeys();
        const knob = document.querySelector('.joystick-knob');
        if (knob) knob.style.transform = 'translate(0px, 0px)';
      }
    }

    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', () => setTimeout(updateLayout, 250));
    updateLayout();
  },
};

document.addEventListener('DOMContentLoaded', () => TouchInput.init());