// ============================================================
// ui.js — Interface · Coruche Digital
// ============================================================

const UI = {

  // ─── SCREENS ────────────────────────────────────────────
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
    if (name === 'game') requestAnimationFrame(() => this.drawBoard());
  },

  // ─── HEADER ─────────────────────────────────────────────
  updateHeader() {
    const el = document.getElementById('hdr-team');
    if (el) {
      el.textContent = G.teamName;
      const logoEl = document.getElementById('hdr-shop-logo');
      if (logoEl) {
        logoEl.src = G.shopLogo || 'logo.png';
        logoEl.style.display = '';
      }
    }
    const badge = document.getElementById('hdr-round');
    if (badge) {
      badge.textContent = G.round === 1 ? 'Ronda 1 — Cartas de Tempo' : 'Ronda 2 — Desafios & Perguntas';
      badge.className   = 'round-badge ' + (G.round === 1 ? 'r1' : 'r2');
    }
    this.updateTimer();
    this.updatePoints();
    this.updateTurns();
  },

  updateTimer() {
    const el   = document.getElementById('hdr-timer');
    const warn = document.getElementById('hdr-warning');
    if (!el) return;
    const s = G.secsLeft;
    el.textContent = fmtTime(s);
    // Update timers in challenge overlays
    const tStr = '⏱ ' + fmtTime(s);
    ['drop-game-timer','body-game-timer','memory-game-timer','spot-game-timer'].forEach(id => {
      const t = document.getElementById(id);
      if (t) t.textContent = tStr;
    });
    if (!G.cfg) { el.className = 'timer'; return; }
    el.className = 'timer' + (s <= G.cfg.dangerSeconds ? ' danger' : s <= G.cfg.warningSeconds ? ' warn' : '');
    if (warn) {
      if (s <= G.cfg.dangerSeconds) {
        warn.textContent = '⚠️ Menos de ' + G.cfg.dangerSeconds + 's!';
        warn.className   = 'timer-warn danger';
      } else if (s <= G.cfg.warningSeconds) {
        warn.textContent = '⏳ Menos de ' + Math.round(G.cfg.warningSeconds / 60) + ' min!';
        warn.className   = 'timer-warn warn';
      } else {
        warn.textContent = '';
        warn.className   = 'timer-warn';
      }
    }
  },

  updatePoints() {
    const el = document.getElementById('hdr-points');
    if (el) el.textContent = G.points + ' pts';
  },

  updateTurns() {
    const el = document.getElementById('hdr-throws');
    if (!el) return;
    const t = G.round === 1 ? G.throwsR1 : G.throwsR2;
    el.textContent = t + ' / ' + G.totalPlayers;
  },

  // ─── PAUSE ──────────────────────────────────────────────
  showPause(on) {
    const ov  = document.getElementById('overlay-pause');
    const btn = document.getElementById('btn-pause');
    if (ov)  ov.style.display = on ? 'flex' : 'none';
    if (btn) btn.textContent  = on ? '▶ Continuar' : '⏸ Pausa';
  },

  // ─── RANKING ────────────────────────────────────────────
  _rankingCache:   [],
  _rankingCacheTs: 0,
  _gameEnded:      false,

  async updateRanking() {
    const el = document.getElementById('ranking-list');
    if (!el) return;
    const now = Date.now();
    if (now - this._rankingCacheTs > 30000) {
      this._rankingCache   = await DB.todayGames();
      this._rankingCacheTs = now;
    }
    this._renderRanking(el);
  },

  async refreshRanking() {
    const el = document.getElementById('ranking-list');
    if (!el) return;
    this._rankingCache   = await DB.todayGames();
    this._rankingCacheTs = Date.now();
    this._renderRanking(el);
  },

  _renderRanking(el) {
    const historical = this._rankingCache || [];
    const isPlaying  = G.teamName && !this._gameEnded;
    let combined     = historical.filter(g => !g.isCurrentTeam);

    if (isPlaying && G.teamName) {
      combined.push({
        id:            'current',
        teamName:      G.teamName,
        shopLogo:      G.shopLogo || 'logo.png',
        points:        G.points,
        fake:          false,
        isCurrentTeam: true,
      });
    }

    combined.sort((a, b) => b.points - a.points);

    if (!combined.length) {
      el.innerHTML = '<div class="ranking-empty">Os resultados de hoje aparecem aqui</div>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];

    combined.forEach((g, i) => {
      const medal     = medals[i] || (i + 1) + 'º';
      const isCurrent = !!g.isCurrentTeam;
      const rowId     = 'rank-row-' + (g.id || 'current');
      const logoSrc   = g.shopLogo || 'logo.png';

      let row = el.querySelector('[data-rank-id="' + rowId + '"]');

      if (!row) {
        row = document.createElement('div');
        row.dataset.rankId = rowId;

        const posSpan  = document.createElement('span');
        posSpan.className = 'rank-pos';

        const logoSpan = document.createElement('span');
        logoSpan.className = 'rank-logo';
        const img = document.createElement('img');
        img.src = logoSrc;
        img.className = 'ranking-logo';
        img.alt = '';
        logoSpan.appendChild(img);

        const infoDiv  = document.createElement('div');
        infoDiv.className = 'rank-info';

        const nameSpan = document.createElement('span');
        nameSpan.className   = 'rank-name';
        nameSpan.textContent = g.teamName;
        infoDiv.appendChild(nameSpan);

        if (g.fake) {
          const fakeTag = document.createElement('span');
          fakeTag.className   = 'rank-fake-tag';
          fakeTag.textContent = 'exemplo';
          infoDiv.appendChild(fakeTag);
        }

        if (isCurrent) {
          const liveTag = document.createElement('span');
          liveTag.className   = 'rank-live-tag';
          liveTag.textContent = 'AO VIVO';
          infoDiv.appendChild(liveTag);
        }

        const ptsSpan = document.createElement('span');
        ptsSpan.className = 'rank-pts';

        row.appendChild(posSpan);
        row.appendChild(logoSpan);
        row.appendChild(infoDiv);
        row.appendChild(ptsSpan);
        el.appendChild(row);
      }

      // Update medal and points
      const prevPts = row.querySelector('.rank-pts').textContent || '';
      const newPts  = String(g.points);

      row.querySelector('.rank-pos').textContent = medal;

      const ptsEl = row.querySelector('.rank-pts');
      ptsEl.textContent = '';
      ptsEl.appendChild(document.createTextNode(g.points));
      const small = document.createElement('small');
      small.textContent = 'pts';
      ptsEl.appendChild(small);

      // Apply class
      const baseClass = 'ranking-row'
        + (g.fake    ? ' fake'         : '')
        + (isCurrent ? ' current-team' : '');

      if (isCurrent && prevPts !== newPts && prevPts !== '') {
        row.className = baseClass + ' score-bump moving-up';
        setTimeout(() => { row.className = baseClass; }, 500);
      } else {
        row.className = baseClass;
      }

      row.style.order = i;
    });

    // Remove stale rows
    el.querySelectorAll('[data-rank-id]').forEach(row => {
      const id = row.dataset.rankId;
      const exists = combined.some(g => 'rank-row-' + (g.id || 'current') === id);
      if (!exists) row.remove();
    });

    el.style.display       = 'flex';
    el.style.flexDirection = 'column';
  },

  // ─── DICE ───────────────────────────────────────────────
  promptDice(childNum, total) {
    const msg = document.getElementById('dice-msg');
    if (msg) msg.textContent = '🎲 Criança ' + childNum + ' de ' + total + ' — lança o dado!';
    const sec = document.getElementById('dice-section');
    if (sec) sec.style.display = '';
    document.querySelectorAll('.die-btn').forEach(b => b.classList.remove('active'));
    const roll = document.getElementById('btn-roll');
    if (roll) { roll.disabled = true; roll.dataset.val = ''; }
  },

  hideDice() {
    const sec = document.getElementById('dice-section');
    if (sec) sec.style.display = 'none';
  },

  // ─── BOARD ──────────────────────────────────────────────
  drawBoard() {
    const wrap = document.getElementById('board-wrap');
    if (!wrap) return;
    const svg  = document.getElementById('board-svg');
    const psvg = document.getElementById('pawn-svg');
    if (!svg) return;
    const VB = 600;
    svg.setAttribute('viewBox',  '0 0 ' + VB + ' ' + VB);
    // pawn-svg shares the same viewBox — coordinates in board units, scaling is automatic
    if (psvg) {
      psvg.setAttribute('viewBox', '0 0 ' + VB + ' ' + VB);
      psvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
    const CR = 72;
    const CW = Math.floor((VB - 2 * CR) / 7);
    const CH = CR;
    svg.innerHTML = this._boardHTML(VB, CR, CW, CH);
    if (G.teamName) requestAnimationFrame(() => PAWN.draw(G.pos));
  },

  _buildLayout(VB, CR, CW, CH) {
    const L = new Array(32);
    L[0]  = { x: 0,        y: VB - CR,       w: CR, h: CR,  dir: 'corner' };
    for (let i = 1; i <= 7; i++) L[i]      = { x: 0,             y: VB - CR - i * CW, w: CH, h: CW, dir: 'right' };
    L[8]  = { x: 0,        y: 0,             w: CR, h: CR,  dir: 'corner' };
    for (let i = 1; i <= 7; i++) L[8 + i]  = { x: CR + (i-1)*CW, y: 0,                w: CW, h: CH, dir: 'down'  };
    L[16] = { x: VB - CR,  y: 0,             w: CR, h: CR,  dir: 'corner' };
    for (let i = 1; i <= 7; i++) L[16 + i] = { x: VB - CH,       y: CR + (i-1)*CW,    w: CH, h: CW, dir: 'left'  };
    L[24] = { x: VB - CR,  y: VB - CR,       w: CR, h: CR,  dir: 'corner' };
    for (let i = 1; i <= 7; i++) L[24 + i] = { x: VB - CR - i*CW, y: VB - CH,         w: CW, h: CH, dir: 'up'    };
    return L;
  },

  _boardHTML(VB, CR, CW, CH) {
    const layout  = this._buildLayout(VB, CR, CW, CH);
    const ix = CH, iy = CH, iw = VB - 2 * CH, ih = VB - 2 * CH;
    const cx = ix + iw / 2, cy = iy + ih / 2;
    const isLight = document.documentElement.dataset.theme === 'light';

    const TYPE_STYLE = isLight ? {
      corner:    { bg: '#ffffff', stroke: '#008f5e', icon: '🎲' },
      challenge: { bg: '#ffffff', stroke: '#0f5cc8', icon: '⚡' },
      question:  { bg: '#ffffff', stroke: '#7020c8', icon: '❓' },
    } : {
      corner:    { bg: '#0a2010', stroke: '#00e5a0', icon: '🎲' },
      challenge: { bg: '#0a1530', stroke: '#1a8cff', icon: '⚡' },
      question:  { bg: '#18082a', stroke: '#c77dff', icon: '❓' },
    };

    const cellsHTML = BOARD.map((cell, i) => {
      const L     = layout[i];
      if (!L) return '';
      const st    = TYPE_STYLE[cell.type] || TYPE_STYLE.challenge;
      const cx2   = L.x + L.w / 2;
      const cy2   = L.y + L.h / 2;
      const minD  = Math.min(L.w, L.h);
      const isC   = L.dir === 'corner';
      const isCur = i === G.pos;
      const rot   = { right: 90, left: -90, up: 180, down: 0 }[L.dir] || 0;

      const sw = Math.round(minD * 0.16);
      const so = isLight ? '0.35' : '0.2';
      const strips = {
        right: '<rect x="' + (L.x+L.w-sw) + '" y="' + L.y + '" width="' + sw + '" height="' + L.h + '" fill="' + st.stroke + '" opacity="' + so + '"/>',
        left:  '<rect x="' + L.x           + '" y="' + L.y + '" width="' + sw + '" height="' + L.h + '" fill="' + st.stroke + '" opacity="' + so + '"/>',
        down:  '<rect x="' + L.x + '" y="' + (L.y+L.h-sw) + '" width="' + L.w + '" height="' + sw + '" fill="' + st.stroke + '" opacity="' + so + '"/>',
        up:    '<rect x="' + L.x + '" y="' + L.y           + '" width="' + L.w + '" height="' + sw + '" fill="' + st.stroke + '" opacity="' + so + '"/>',
      };

      const iconSize = Math.round(minD * (isC ? 0.3 : 0.38));
      const textContent = isC
        ? '<text x="' + cx2 + '" y="' + (cy2 - minD*0.1) + '" text-anchor="middle" dominant-baseline="middle" font-size="' + iconSize + 'px">' + st.icon + '</text>'
          + '<text x="' + cx2 + '" y="' + (cy2 + minD*0.28) + '" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="' + Math.round(minD*0.1) + 'px" fill="' + st.stroke + '">RODA DE NOVO</text>'
        : '<g transform="rotate(' + rot + ',' + cx2 + ',' + cy2 + ')">'
          + '<text x="' + cx2 + '" y="' + cy2 + '" text-anchor="middle" dominant-baseline="middle" font-size="' + iconSize + 'px">' + st.icon + '</text>'
          + '</g>';

      // Highlight current cell with thicker border only
      const sw2 = isCur ? 3 : (isLight ? 2 : 1.5);
      return '<g>'
        + '<rect x="' + L.x + '" y="' + L.y + '" width="' + L.w + '" height="' + L.h + '" fill="' + st.bg + '" stroke="' + st.stroke + '" stroke-width="' + sw2 + '"/>'
        + (!isC ? (strips[L.dir] || '') : '')
        + textContent
        + '</g>';
    }).join('');

    const centerHTML = this._centerHTML(ix, iy, iw, ih, cx, cy, isLight);
    const boardBg    = isLight ? '#dce6ff' : '#080d1a';
    const centerBg   = isLight ? '#eef2ff' : '#090e1c';
    const centerStr  = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.04)';

    return '<rect x="0" y="0" width="' + VB + '" height="' + VB + '" fill="' + boardBg + '"/>'
      + '<rect x="' + ix + '" y="' + iy + '" width="' + iw + '" height="' + ih + '" rx="8" fill="' + centerBg + '" stroke="' + centerStr + '" stroke-width="1"/>'
      + centerHTML
      + cellsHTML;
  },

  _centerHTML(ix, iy, iw, ih, cx, cy, isLight) {
    const logoW  = Math.round(iw * 0.62);
    const logoH  = Math.round(logoW * 0.44);
    const logoX  = cx - logoW / 2;
    const logoY  = iy + Math.round(ih * 0.02);
    const deckH  = Math.round(ih * 0.48);
    const deckW  = Math.round(deckH * 0.72);
    const gap    = Math.round(iw * 0.06);
    const deckY  = logoY + logoH + Math.round(ih * 0.02);
    const deck1X = Math.round(cx - gap / 2 - deckW);
    const deck2X = Math.round(cx + gap / 2);
    const labelY = deckY + deckH + Math.round(deckH * 0.1);
    const labelFs = Math.round(deckH * 0.1);
    const col1   = isLight ? '#1472e8' : 'rgba(90,171,255,0.85)';
    const col2   = isLight ? '#8b44e8' : 'rgba(199,125,255,0.85)';

    return '<image href="logo.png" x="' + logoX + '" y="' + logoY + '" width="' + logoW + '" height="' + logoH + '" preserveAspectRatio="xMidYMid meet" opacity="0.65"/>'
      + this._unoCard(deck1X, deckY, deckW, deckH, 'challenge')
      + this._unoCard(deck2X, deckY, deckW, deckH, 'question')
      + '<text x="' + (deck1X + deckW/2) + '" y="' + labelY + '" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="' + labelFs + 'px" fill="' + col1 + '">Desafios</text>'
      + '<text x="' + (deck2X + deckW/2) + '" y="' + labelY + '" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="' + labelFs + 'px" fill="' + col2 + '">Perguntas</text>';
  },

  _unoCard(x, y, w, h, type) {
    const isC  = type === 'challenge';
    const edge = isC ? '#1a8cff' : '#c77dff';
    const bg   = isC ? '#0a1830' : '#1a0828';
    const r    = Math.round(w * 0.12);
    const img  = isC ? 'card-challenge.png' : 'card-question.png';
    const uid  = 'uc-' + type;

    let stack = '';
    for (let i = 3; i >= 1; i--) {
      const op = (0.1 + i * 0.08).toFixed(2);
      stack += '<rect x="' + (x+i*4) + '" y="' + (y-i*3) + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + bg + '" stroke="' + edge + '" stroke-width="1" opacity="' + op + '"/>';
    }

    return '<g>'
      + stack
      + '<defs><clipPath id="' + uid + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '"/></clipPath></defs>'
      + '<image href="' + img + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid meet" clip-path="url(#' + uid + ')"/>'
      + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="none" stroke="' + edge + '" stroke-width="2.5"/>'
      + '</g>';
  },

  // ─── SHOP PICKER ────────────────────────────────────────
  showShopPicker(shops) {
    const cfg = DB.loadConfig();
    document.getElementById('picker-players').value = cfg.playersPerTeam;
    document.getElementById('picker-minutes').value = cfg.gameMinutes;

    const container = document.getElementById('shop-cards');
    container.innerHTML = '';
    document.getElementById('picker-name-step').style.display = 'none';
    container.style.display = '';
    document.querySelector('.picker-title').textContent = 'Escolhe o vosso símbolo!';

    shops.forEach(shop => {
      const card = document.createElement('div');
      card.className = 'shop-card shop-card-logo-only';
      card.onclick   = () => uiPickShop(shop.id);

      const logoDiv = document.createElement('div');
      logoDiv.className = 'shop-card-logo';
      const img = document.createElement('img');
      img.src = shop.logo || 'logo.png';
      img.alt = '';
      logoDiv.appendChild(img);
      card.appendChild(logoDiv);
      container.appendChild(card);
    });

    window._pickerShops = shops;
    this.showOverlay('overlay-picker');
  },

  // ─── R1 CARDS ───────────────────────────────────────────
  showR1Cards() {
    this.hideDice();
    const flip = Math.random() < 0.5;
    const leftImg  = document.getElementById('r1-left-img');
    const rightImg = document.getElementById('r1-right-img');
    if (leftImg)  leftImg.src  = flip ? 'card-challenge.png' : 'card-question.png';
    if (rightImg) rightImg.src = flip ? 'card-question.png'  : 'card-challenge.png';

    ['left', 'right'].forEach(s => {
      document.getElementById('r1-' + s + '-inner').classList.remove('flipped');
      document.getElementById('r1-' + s + '-front').innerHTML = '';
    });
    document.getElementById('r1-result').textContent     = '';
    document.getElementById('r1-result').className       = 'r1-result';
    document.getElementById('btn-r1-next').style.display = 'none';
    document.getElementById('r1-left').onclick  = () => uiR1ChooseCard('left');
    document.getElementById('r1-right').onclick = () => uiR1ChooseCard('right');
    document.getElementById('r1-left').classList.remove('chosen', 'disabled');
    document.getElementById('r1-right').classList.remove('chosen', 'disabled');
    this.showOverlay('overlay-r1');
  },

  showR1Result(card, cb) {
    const res = document.getElementById('r1-result');
    res.textContent = card.isBonus
      ? '+' + card.secs + ' segundos ganhos! ⭐'
      : '-' + card.secs + ' segundos perdidos! ⏱️';
    res.className = 'r1-result ' + (card.isBonus ? 'win' : 'lose');
    const btn = document.getElementById('btn-r1-next');
    btn.style.display = '';
    btn.onclick = () => { this.hideOverlay('overlay-r1'); cb(); };
  },

  // ─── ROUND 2 INTRO ──────────────────────────────────────
  showRound2Intro(cb) {
    document.getElementById('r2intro-time').textContent = fmtTime(G.secsLeft);
    document.getElementById('btn-r2intro').onclick = () => {
      this.hideOverlay('overlay-r2intro');
      cb();
    };
    this.showOverlay('overlay-r2intro');
  },

  // ─── R2 CARD ────────────────────────────────────────────
  showCard() {
    this.hideDice();
    const isC    = G.cardDeck === 'challenge';
    const item   = G.cardItem;
    const qType  = item.type || 'text'; // 'multiple', 'numeric', 'text'

    document.getElementById('r2-card-box').className     = 'r2-card-box ' + (isC ? 'challenge' : 'question');
    document.getElementById('r2-deck-label').textContent = isC ? '⚡ Desafio' : '❓ Pergunta';
    document.getElementById('r2-card-text').textContent  = item.text;
    document.getElementById('r2-card-hint').textContent  = isC ? (item.hint || '') : '';
    document.getElementById('r2-card-pts').textContent   = '+' + (isC ? G.cfg.pointsChallenge : G.cfg.pointsQuestion) + ' pts';
    document.getElementById('r2-result-text').textContent = '';
    document.getElementById('r2-result-text').className  = 'r2-result';
    document.getElementById('r2-answer-btns').innerHTML  = '';
    document.getElementById('btn-r2-close').style.display = 'none';
    document.getElementById('btn-r2-done').style.display  = isC ? '' : 'none';
    document.getElementById('btn-r2-repeat').style.display = '';

    // Main image (for questions with a single illustrative image)
    const imgWrap = document.getElementById('r2-card-image-wrap');
    const imgEl   = document.getElementById('r2-card-image');
    if (!isC && item.image) {
      imgEl.src = item.image;
      imgWrap.style.display = '';
    } else {
      imgWrap.style.display = 'none';
    }

    // Hide all interactive sections first
    document.getElementById('r2-options').style.display = 'none';
    document.getElementById('r2-slot').style.display    = 'none';

    if (!isC) {
      if (qType === 'multiple') {
        this._showMultipleOptions(item);
      } else if (qType === 'numeric') {
        this._showSlotMachine(item);
      }
    }

    this.updateCardTimer();
    document.getElementById('r2-timer-arc').style.stroke = isC ? '#1a8cff' : '#c77dff';
    this.showOverlay('overlay-r2');
  },

  _showMultipleOptions(item) {
    const opts = typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || []);
    const container = document.getElementById('r2-options');
    container.innerHTML = '';
    container.style.display = '';

    opts.forEach((opt, i) => {
      const btn = document.createElement('div');
      btn.className   = 'r2-option';
      btn.dataset.idx = i;

      // Option image if present
      if (opt.image) {
        const img = document.createElement('img');
        img.src       = opt.image;
        img.className = 'r2-option-img';
        btn.appendChild(img);
      }

      const label = document.createElement('div');
      label.className = 'r2-option-label';

      const badge = document.createElement('span');
      badge.className   = 'r2-option-badge';
      badge.textContent = opt.label;
      label.appendChild(badge);

      const txt = document.createElement('span');
      txt.className   = 'r2-option-text';
      txt.textContent = opt.text;
      label.appendChild(txt);

      btn.appendChild(label);
      btn.onclick = () => uiSelectOption(i);
      container.appendChild(btn);
    });
  },

  _showSlotMachine(item) {
    document.getElementById('r2-slot').style.display = '';
    const inp = document.getElementById('slot-number');
    if (inp) inp.value = 1;
    document.getElementById('slot-lever').disabled = false;
    // Build initial reel (neutral: up / check / down)
    const reel = document.getElementById('slot-reel');
    if (reel) {
      reel.style.transition = 'none';
      reel.style.transform  = 'translateY(0)';
      reel.innerHTML =
        '<div class="slot-item slot-up">▲ É maior</div>' +
        '<div class="slot-item slot-check">✓ Correcto!</div>' +
        '<div class="slot-item slot-down">▼ É menor</div>';
    }
    const resEl = document.getElementById('r2-result-text');
    if (resEl) { resEl.textContent = ''; resEl.className = 'r2-result'; }
    window._slotValue = 1;
    window._slotItem  = item;
  },

  updateCardTimer() {
    const cur   = Math.max(0, G.cardSecsLeft);
    const total = G.cfg.cardTime;
    document.getElementById('r2-secs').textContent = cur;
    const arc  = document.getElementById('r2-timer-arc');
    const circ = 2 * Math.PI * 50;
    arc.style.strokeDasharray  = circ;
    arc.style.strokeDashoffset = circ * (1 - cur / total);
    if (cur <= 5) arc.style.stroke = '#ff3d5a';
  },

  cardTimeOut() {
    const setDisp = (id, val) => { const e = document.getElementById(id); if (e) e.style.display = val; };
    document.getElementById('r2-result-text').textContent = 'Tempo esgotado!';
    document.getElementById('r2-result-text').className   = 'r2-result lose';
    setDisp('btn-r2-done',   'none');
    setDisp('btn-r2-reveal', 'none');
    setDisp('btn-r2-repeat', 'none');
    const btns = document.getElementById('r2-answer-btns');
    if (btns) btns.innerHTML = '';
    // Show correct answer visually based on question type
    if (G.cardDeck === 'question' && G.cardItem) {
      const qType = G.cardItem.type || 'text';
      if (qType === 'multiple') {
        const correctIdx = G.cardItem.answer_index;
        document.querySelectorAll('.r2-option').forEach((el, i) => {
          el.onclick = null;
          if (i === correctIdx) el.classList.add('r2-option-correct');
          else el.classList.add('r2-option-dim');
        });
      } else if (qType === 'numeric') {
        const res = document.getElementById('r2-result-text');
        res.textContent = 'A resposta era: ' + G.cardItem.answer_number;
        res.className   = 'r2-result lose';
      }
    }
    const btn = document.getElementById('btn-r2-close');
    btn.style.display = '';
    btn.onclick = () => { this.hideOverlay('overlay-r2'); r2CardClosed(); };
  },

  showCardResult(correct, pts, cb) {
    const setText = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    const setDisp = (id, val) => { const e = document.getElementById(id); if (e) e.style.display = val; };
    setText('r2-result-text', correct ? '+' + pts + ' pontos! 🎉' : 'Resposta errada. Continuem!');
    const res = document.getElementById('r2-result-text');
    if (res) res.className = 'r2-result ' + (correct ? 'win' : 'lose');
    setDisp('btn-r2-done',   'none');
    setDisp('btn-r2-reveal', 'none');  // may not exist — guarded
    setDisp('btn-r2-repeat', 'none');
    const btns = document.getElementById('r2-answer-btns');
    if (btns) btns.innerHTML = '';
    if (correct) triggerConfetti();
    const btn = document.getElementById('btn-r2-close');
    if (btn) {
      btn.style.display = '';
      btn.onclick = () => { this.hideOverlay('overlay-r2'); cb(); };
    } else {
      // fallback — close immediately
      this.hideOverlay('overlay-r2');
      cb();
    }
  },

  // ─── AGAIN ──────────────────────────────────────────────
  showAgain(cb) {
    this.hideDice();
    document.getElementById('btn-again').onclick = () => { this.hideOverlay('overlay-again'); cb(); };
    this.showOverlay('overlay-again');
  },

  // ─── END ────────────────────────────────────────────────
  async showEnd() {
    if (!G.cfg) return;
    document.getElementById('end-title').textContent  = G.secsLeft > 0 ? 'Missão cumprida!' : 'O tempo acabou!';
    document.getElementById('end-time').textContent   = fmtTime(G.secsLeft);
    document.getElementById('end-points').textContent = G.points;
    const ranking  = await DB.todayRanking();
    const myRank   = ranking.findIndex(g => !g.fake && g.points === G.points);
    const ordinals = ['1ª','2ª','3ª','4ª','5ª','6ª','7ª','8ª','9ª','10ª'];
    const countEl  = document.getElementById('end-team-count');
    if (countEl) countEl.textContent = (ordinals[myRank] || (myRank + 1) + 'ª') + ' equipa hoje · ' + ranking.length + ' jogos';

    // Hero section — big logo + position + name for photo moment
    const medals = ['🥇','🥈','🥉'];
    const medal  = myRank >= 0 ? (medals[myRank] || (myRank + 1) + 'º') : '🏅';
    document.getElementById('end-hero-position').textContent = medal;
    document.getElementById('end-hero-logo').src             = G.shopLogo || 'logo.png';
    document.getElementById('end-hero-team').textContent     = G.teamName || '';
    document.getElementById('end-hero-pts').textContent      = G.points + ' pts';

    // Set date on end ranking header
    const dateEl = document.getElementById('end-ranking-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('pt-PT');

    // Render full ranking in the end panel
    const endList = document.getElementById('end-ranking-list');
    if (endList) {
      this._renderRanking(endList);
      // Find and highlight current team by matching name + points
      setTimeout(() => {
        const rows = endList.querySelectorAll('[data-rank-id]');
        rows.forEach(row => {
          const nameEl = row.querySelector('.rank-name');
          const ptsEl  = row.querySelector('.rank-pts');
          if (nameEl && nameEl.textContent.trim() === G.teamName) {
            row.classList.add('end-highlight');
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }, 400);
    }

    // Also update the side ranking panel
    this.updateRanking();
    this.showScreen('end');
  },

  // ─── HELPERS ────────────────────────────────────────────
  showOverlay(id) { const el = document.getElementById(id); if (el) el.style.display = 'flex'; },
  hideOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
    // Redraw pawn after overlay closes — layout may have shifted
    if (G.teamName) requestAnimationFrame(() => requestAnimationFrame(() => PAWN.draw(G.pos)));
  },
};

// ─── GLOBAL HANDLERS ──────────────────────────────────────
function uiR1ChooseCard(side) {
  const other = side === 'left' ? 'right' : 'left';
  document.getElementById('r1-left').onclick  = null;
  document.getElementById('r1-right').onclick = null;
  document.getElementById('r1-' + other).classList.add('disabled');
  document.getElementById('r1-' + side).classList.add('chosen');
  document.getElementById('r1-' + side + '-inner').classList.add('flipped');
  const card = side === 'left' ? G.r1Left : G.r1Right;
  setTimeout(() => {
    const front = document.getElementById('r1-' + side + '-front');
    const valSpan   = document.createElement('span');
    valSpan.className   = 'r1-val ' + (card.isBonus ? 'bonus' : 'malus');
    valSpan.textContent = (card.isBonus ? '+' : '-') + card.secs + 's';
    const lblSpan   = document.createElement('span');
    lblSpan.className   = 'r1-val-label';
    lblSpan.textContent = card.isBonus ? 'segundos ganhos!' : 'segundos perdidos';
    front.innerHTML = '';
    front.appendChild(valSpan);
    front.appendChild(lblSpan);
    r1Choose(side);
  }, 420);
}

function uiSelectDie(val) {
  document.querySelectorAll('.die-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.v) === val));
  const btn = document.getElementById('btn-roll');
  btn.disabled    = false;
  btn.dataset.val = val;
}

function uiRoll() {
  const btn = document.getElementById('btn-roll');
  const val = parseInt(btn.dataset.val);
  if (!val) return;
  btn.disabled    = true;
  btn.dataset.val = '';
  document.querySelectorAll('.die-btn').forEach(b => b.classList.remove('active'));
  gameRoll(val);
}

function uiPause() { gamePause(); }

function uiRevealAnswer() {
  // Only used for legacy text questions — multiple/numeric handled differently
  if (!G.cardItem) return;
  document.getElementById('r2-answer-text') && (document.getElementById('r2-answer-text').textContent = G.cardItem.answer || '');
}

function uiSelectOption(idx) {
  // Monitor taps an option — reveal correct/wrong
  const item = G.cardItem;
  const opts = typeof item.options === 'string' ? JSON.parse(item.options) : (item.options || []);
  const correctIdx = item.answer_index;

  // Disable all options
  document.querySelectorAll('.r2-option').forEach((el, i) => {
    el.onclick = null;
    if (i === correctIdx) {
      el.classList.add('r2-option-correct');
    } else if (i === idx && i !== correctIdx) {
      el.classList.add('r2-option-wrong');
    } else {
      el.classList.add('r2-option-dim');
    }
  });

  // Hide repeat, show continue
  document.getElementById('btn-r2-repeat').style.display = 'none';

  setTimeout(() => {
    const isCorrect = idx === correctIdx;
    r2QuestionAnswer(isCorrect);
  }, 800);
}

function uiPickShop(shopId) {
  const shop = (window._pickerShops || []).find(s => s.id === shopId);
  if (!shop) return;
  window._selectedShop = shop;
  document.querySelectorAll('.shop-card').forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  document.getElementById('shop-cards').style.display        = 'none';
  document.getElementById('picker-name-step').style.display  = '';
  document.querySelector('.picker-title').textContent        = 'Como se chama a vossa equipa?';
  document.querySelector('.picker-sub').style.display        = 'none';
  const cfg = DB.loadConfig();
  document.getElementById('picker-players').value = cfg.playersPerTeam;
  document.getElementById('picker-minutes').value = cfg.gameMinutes;
  setTimeout(() => document.getElementById('picker-team-name').focus(), 100);
}

function uiConfirmShop() {
  const shop    = window._selectedShop;
  const name    = document.getElementById('picker-team-name').value.trim();
  const players = parseInt(document.getElementById('picker-players').value) || G.cfg.playersPerTeam;
  const minutes = parseInt(document.getElementById('picker-minutes').value) || G.cfg.gameMinutes;
  if (!shop) return;
  if (!name) {
    document.getElementById('picker-team-name').focus();
    document.getElementById('picker-team-name').style.borderColor = '#ff3d5a';
    return;
  }
  UI.hideOverlay('overlay-picker');
  gamePickShop(shop, name, players, minutes);
}

function uiCancelShopPick() {
  window._selectedShop = null;
  document.getElementById('shop-cards').style.display       = '';
  document.getElementById('picker-name-step').style.display = 'none';
  document.querySelector('.picker-title').textContent       = 'Escolhe o vosso símbolo!';
  document.querySelector('.picker-sub').style.display       = '';
  document.getElementById('picker-team-name').value         = '';
  document.getElementById('picker-team-name').style.borderColor = '';
  document.querySelectorAll('.shop-card').forEach(c => c.classList.remove('selected'));
}

function uiNewTeam() { window.location.href = 'admin.html'; }

function uiGoToAdmin() {
  // Save game state if a game is active
  if (G.teamName && G.secsLeft > 0 && !UI._gameEnded) {
    const snapshot = {
      teamName:      G.teamName,
      shopId:        G.shopId,
      shopName:      G.shopName,
      shopLogo:      G.shopLogo,
      ownerName:     G.ownerName,
      totalPlayers:  G.totalPlayers,
      points:        G.points,
      round:         G.round,
      throwsR1:      G.throwsR1,
      throwsR2:      G.throwsR2,
      pos:           G.pos,
      secsLeft:      G.secsLeft,
      usedChallenges: G.usedChallenges,
      usedQuestions:  G.usedQuestions,
    };
    localStorage.setItem('crd_active_game', JSON.stringify(snapshot));
  }
  // Pause timer before leaving
  if (G._timerInterval) clearInterval(G._timerInterval);
  G.timerRunning = false;
  window.location.href = 'admin.html';
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── CONFETTI ─────────────────────────────────────────────
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = innerWidth;
  canvas.height = innerHeight;
  const P = Array.from({ length: 70 }, () => ({
    x:    Math.random() * canvas.width,
    y:    -20,
    w:    Math.random() * 10 + 5,
    h:    Math.random() * 6 + 3,
    c:    ['#00e5a0','#1a8cff','#c77dff','#ffb347','#ff4040'][Math.floor(Math.random() * 5)],
    sp:   Math.random() * 4 + 2,
    a:    Math.random() * 360,
    spin: (Math.random() - 0.5) * 8,
    dr:   (Math.random() - 0.5) * 2,
  }));
  let raf;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    P.forEach(p => {
      p.y += p.sp; p.x += p.dr; p.a += p.spin;
      if (p.y < canvas.height + 20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a * Math.PI / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (alive) raf = requestAnimationFrame(draw);
  })();
  setTimeout(() => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); }, 3500);
}

// ─── PAWN SYSTEM ──────────────────────────────────────────
// Separate SVG overlay so pawn animates independently of board redraws

const PAWN = {
  VB:       600,   // must match board viewBox
  CR:       72,
  CW:       0,     // calculated on init
  CH:       0,

  // Current pixel position (in board coordinate space)
  _x: 0,
  _y: 0,
  _animating: false,

  // Calculate centre of a board cell (same logic as _buildLayout)
  cellCentre(pos) {
    const VB = this.VB, CR = this.CR;
    const CW = Math.floor((VB - 2 * CR) / 7);
    const CH = CR;
    const L  = new Array(32);
    L[0]  = { x: 0,          y: VB - CR,        w: CR, h: CR };
    for (let i = 1; i <= 7; i++) L[i]      = { x: 0,              y: VB - CR - i * CW,  w: CH, h: CW };
    L[8]  = { x: 0,          y: 0,              w: CR, h: CR };
    for (let i = 1; i <= 7; i++) L[8 + i]  = { x: CR + (i-1)*CW,  y: 0,                 w: CW, h: CH };
    L[16] = { x: VB - CR,    y: 0,              w: CR, h: CR };
    for (let i = 1; i <= 7; i++) L[16 + i] = { x: VB - CH,        y: CR + (i-1)*CW,     w: CH, h: CW };
    L[24] = { x: VB - CR,    y: VB - CR,        w: CR, h: CR };
    for (let i = 1; i <= 7; i++) L[24 + i] = { x: VB - CR - i*CW, y: VB - CH,           w: CW, h: CH };
    const cell = L[pos];
    if (!cell) return { x: 0, y: 0 };
    return { x: cell.x + cell.w / 2, y: cell.y + cell.h / 2 };
  },

  // Board coords are used directly in SVG viewBox units (0-600)
  // No pixel conversion needed — SVG handles scaling
  toScreen(bx, by) {
    // Estimate visual scale for sizing the pawn (not for positioning)
    const psvg = document.getElementById('pawn-svg');
    const scale = psvg ? Math.min(psvg.clientWidth, psvg.clientHeight) / this.VB : 1;
    return { x: bx, y: by, scale: Math.max(0.5, scale) };
  },

  // Draw the pawn at a given board position immediately (no animation)
  draw(pos) {
    const psvg = document.getElementById('pawn-svg');
    if (!psvg) return;
    const bc    = this.cellCentre(pos);
    const scale = this.toScreen(bc.x, bc.y).scale;
    this._x = bc.x;
    this._y = bc.y;
    this._renderAt(bc.x, bc.y, scale);
  },

  // Render the pawn SVG at screen pixel position
  _renderAt(x, y, scale) {
    const psvg = document.getElementById('pawn-svg');
    if (!psvg) return;

    // Pawn size in screen pixels
    const R  = 22 * scale;   // logo circle radius
    const CY = R * 0.5;      // cone tip offset above centre

    const logo    = G.shopLogo  || 'logo.png';
    const isLight = document.documentElement.dataset.theme === 'light';
    const shadow  = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.55)';
    const coneCol = isLight ? '#ffffff' : '#1a2a42';
    const rimCol  = isLight ? '#c8d4ee' : '#2a4060';
    const textCol = isLight ? '#0a1530' : '#eef2ff';
    const strokeC = '#00e5a0';

    // Cone base width / height
    const bw = R * 1.1;  // base half-width
    const bh = R * 0.9;  // cone height

    // Shadow ellipse under base
    const shadowEl = '<ellipse cx="' + x + '" cy="' + (y + bh * 0.85) + '" rx="' + (bw * 0.9) + '" ry="' + (R * 0.18) + '" fill="' + shadow + '" opacity="0.6"/>';

    // Cone body (trapezoid → polygon)
    const tipX = x, tipY = y - CY - R * 1.1;
    const bl   = x - bw, br = x + bw, by2 = y + bh * 0.75;
    const cone = '<polygon points="'
      + tipX + ',' + tipY + ' '
      + bl   + ',' + by2  + ' '
      + br   + ',' + by2
      + '" fill="' + coneCol + '" stroke="' + strokeC + '" stroke-width="' + (1.5 * scale) + '"/>';

    // Rim (flat ellipse at cone base)
    const rim = '<ellipse cx="' + x + '" cy="' + by2 + '" rx="' + bw + '" ry="' + (R * 0.22) + '" fill="' + rimCol + '" stroke="' + strokeC + '" stroke-width="' + (1.5 * scale) + '"/>';

    // Logo circle background
    const cy2 = y - CY;
    const circBg = '<circle cx="' + x + '" cy="' + cy2 + '" r="' + (R + 2) + '" fill="' + coneCol + '" stroke="' + strokeC + '" stroke-width="' + (2 * scale) + '"/>';

    // Logo image clipped to circle
    const clipId = 'pawn-clip';
    const defs = '<defs><clipPath id="' + clipId + '"><circle cx="' + x + '" cy="' + cy2 + '" r="' + R + '"/></clipPath></defs>';
    const logoImg = '<image href="' + logo + '" x="' + (x - R) + '" y="' + (cy2 - R) + '" width="' + (R * 2) + '" height="' + (R * 2) + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + clipId + ')"/>';

    // Team name below cone
    const name     = G.teamName || '';
    const fontSize = Math.max(9, Math.round(11 * scale));
    const nameY    = by2 + R * 0.45;
    const maxChars = 14;
    const label    = name.length > maxChars ? name.slice(0, maxChars) + '…' : name;
    const nameBg   = '<rect x="' + (x - fontSize * 3.2) + '" y="' + (nameY - fontSize * 0.8) + '" width="' + (fontSize * 6.4) + '" height="' + (fontSize * 1.4) + '" rx="' + (fontSize * 0.35) + '" fill="' + (isLight ? 'rgba(255,255,255,0.85)' : 'rgba(10,18,40,0.75)') + '"/>';
    const nameText = '<text x="' + x + '" y="' + nameY + '" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="' + fontSize + 'px" fill="' + textCol + '">' + esc(label) + '</text>';

    psvg.innerHTML = defs + shadowEl + cone + rim + circBg + logoImg + nameBg + nameText;
  },

  // Animate pawn jumping from fromPos to toPos, one cell at a time
  async animate(fromPos, toPos) {
    if (this._animating) return;
    this._animating = true;
    const total = BOARD.length;
    let cur     = fromPos;

    while (cur !== toPos) {
      const next = (cur + 1) % total;
      await this._jumpTo(cur, next);
      cur = next;
    }

    // Final bounce on landing
    await this._bounce(toPos);
    this._animating = false;
  },

  // Jump from one cell to the adjacent one with arc motion
  _jumpTo(from, to) {
    return new Promise(resolve => {
      const DURATION = 140;
      const STEPS    = 12;
      const A_HEIGHT = 28;  // arc height in board units

      const bc0   = this.cellCentre(from);
      const bc1   = this.cellCentre(to);
      const scale = this.toScreen(bc0.x, bc0.y).scale;

      let step = 0;
      const interval = setInterval(() => {
        step++;
        const t   = step / STEPS;
        const arc = Math.sin(t * Math.PI) * A_HEIGHT;
        const x   = bc0.x + (bc1.x - bc0.x) * t;
        const y   = bc0.y + (bc1.y - bc0.y) * t - arc;
        this._renderAt(x, y, scale);
        if (step >= STEPS) {
          clearInterval(interval);
          resolve();
        }
      }, DURATION / STEPS);
    });
  },

  // Small bounce at landing position
  _bounce(pos) {
    return new Promise(resolve => {
      const STEPS    = 8;
      const DURATION = 200;
      const bc    = this.cellCentre(pos);
      const scale = this.toScreen(bc.x, bc.y).scale;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const t    = step / STEPS;
        const bump = Math.abs(Math.sin(t * Math.PI * 2)) * 8 * (1 - t);
        this._renderAt(bc.x, bc.y - bump, scale);
        if (step >= STEPS) {
          clearInterval(interval);
          this._renderAt(bc.x, bc.y, scale);
          resolve();
        }
      }, DURATION / STEPS);
    });
  },

  // Clear pawn (e.g. before game starts)
  clear() {
    const psvg = document.getElementById('pawn-svg');
    if (psvg) psvg.innerHTML = '';
  },
};

// ─── SLOT MACHINE ─────────────────────────────────────────
window._slotValue = 1;
window._slotItem  = null;
window._slotSpinning = false;

function slotIncrement() {
  if (window._slotSpinning) return;
  window._slotValue = (window._slotValue || 0) + 1;
  const inp = document.getElementById('slot-number');
  if (inp) inp.value = window._slotValue;
}

function slotDecrement() {
  if (window._slotSpinning) return;
  window._slotValue = Math.max(0, (window._slotValue || 1) - 1);
  const inp = document.getElementById('slot-number');
  if (inp) inp.value = window._slotValue;
}

function slotPull() {
  if (window._slotSpinning) return;
  const item   = window._slotItem || G.cardItem;
  const inp    = document.getElementById('slot-number');
  if (inp) window._slotValue = parseInt(inp.value) || 0;
  const guess  = window._slotValue;
  const answer = item.answer_number;
  const lever  = document.getElementById('slot-lever');
  const reel   = document.getElementById('slot-reel');

  const result    = guess === answer ? 'check' : (guess < answer ? 'up' : 'down');
  const itemH     = 80;
  const totalItems = 3;

  // Before each spin: reset reel position instantly (no transition)
  // and reorder items so the target is always in slot 1 (centre, offset 0 = -1*80 = -80px)
  // Items order: [above-target, TARGET, below-target]
  const items   = ['up', 'check', 'down'];
  const tIdx    = items.indexOf(result); // 0, 1, or 2
  // Rotate array so target is at index 1 (centre)
  const ordered = [
    items[(tIdx + items.length - 1) % items.length],
    result,
    items[(tIdx + 1) % items.length],
  ];
  const labels  = {
    up:    '<div class="slot-item slot-up">▲ É maior</div>',
    check: '<div class="slot-item slot-check">✓ Correcto!</div>',
    down:  '<div class="slot-item slot-down">▼ É menor</div>',
  };
  // Add extra copies above for spin illusion (5 full loops worth)
  const loops   = 5;
  let reelHTML  = '';
  for (let i = 0; i < loops * totalItems; i++) {
    reelHTML += labels[ordered[i % totalItems]];
  }
  // Add the final 3 items (target in centre = index loops*3 + 1)
  reelHTML += labels[ordered[0]] + labels[ordered[1]] + labels[ordered[2]];
  reel.innerHTML  = reelHTML;

  // Start above everything, no transition
  const totalRows  = loops * totalItems + totalItems;
  const startY     = 0; // top
  const landY      = -(loops * totalItems * itemH + itemH); // target row (index loops*3+1)
  reel.style.transition = 'none';
  reel.style.transform  = 'translateY(' + startY + 'px)';

  // Force reflow so transition reset takes effect
  reel.getBoundingClientRect();

  // Lever animation
  window._slotSpinning = true;
  lever.classList.add('lever-pulled');
  setTimeout(() => lever.classList.remove('lever-pulled'), 400);

  // Phase 1: fast spin to near target
  reel.style.transition = 'transform 0.9s cubic-bezier(0.15,0,0.6,1)';
  reel.style.transform  = 'translateY(' + (landY + itemH * 0.3) + 'px)';

  setTimeout(() => {
    // Phase 2: ease into target with slight bounce
    reel.style.transition = 'transform 0.35s cubic-bezier(0.34,1.4,0.64,1)';
    reel.style.transform  = 'translateY(' + landY + 'px)';

    setTimeout(() => {
      window._slotSpinning = false;
      const resEl = document.getElementById('r2-result-text');
      if (result === 'check') {
        resEl.textContent = '🎉 Correcto! A resposta é ' + answer + '!';
        resEl.className   = 'r2-result win';
        document.getElementById('btn-r2-close').style.display  = '';
        document.getElementById('btn-r2-close').onclick = () => {
          UI.hideOverlay('overlay-r2');
          G.points += G.cfg.pointsQuestion;
          UI.updatePoints();
          UI._renderRanking(document.getElementById('ranking-list'));
          stopCardTimer();
          setTimeout(() => afterThrow(), 50);
        };
        document.getElementById('btn-r2-repeat').style.display = 'none';
      } else {
        resEl.textContent = result === 'up'
          ? '▲ A resposta correcta é maior! Tenta de novo.'
          : '▼ A resposta correcta é menor! Tenta de novo.';
        resEl.className = 'r2-result hint';
        // No reel reset needed — next pull rebuilds the reel from scratch
      }
    }, 380);
  }, 920);
}

// ─── CHALLENGE: showCard dispatch ─────────────────────────
// Patch UI.showCard to route complex challenge types
const _origShowCard = UI.showCard.bind(UI);
UI.showCard = function() {
  if (G.cardDeck === 'challenge' && G.cardItem) {
    const type = G.cardItem.type || 'simple';
    if      (type === 'drop')   { showDropChallenge(G.cardItem);   return; }
    else if (type === 'body')   { showBodyChallenge(G.cardItem);   return; }
    else if (type === 'memory') { showMemoryChallenge(G.cardItem); return; }
    else if (type === 'spot')   { showSpotChallenge(G.cardItem);   return; }
    // 'simple' falls through to original
  }
  _origShowCard();
};

// ─── CHALLENGE: DROP ──────────────────────────────────────
let _drop = {};


// ─── CHALLENGE COUNTDOWN TIMER ────────────────────────────
let _chalTimer = null;
const CHAL_SECS = () => (G.cfg && G.cfg.chalTime) || 45;

function chalTimerStart(timerElId, onTimeout) {
  chalTimerStop();
  let secs = CHAL_SECS();
  const el = document.getElementById(timerElId);
  if (el) { el.textContent = secs; el.className = 'chal-timer-secs'; }
  _chalTimer = setInterval(() => {
    secs--;
    if (el) {
      el.textContent = secs;
      if (secs <= 10) el.className = 'chal-timer-secs urgent';
    }
    if (secs <= 0) {
      chalTimerStop();
      onTimeout();
    }
  }, 1000);
}

function chalTimerStop() {
  if (_chalTimer) { clearInterval(_chalTimer); _chalTimer = null; }
}

function showDropChallenge(item) {
  UI.hideDice();
  _drop = {
    item:       item,
    products:   [...item.products].sort(() => Math.random() - .5),
    idx:        0,
    score:      0,
    answered:   false,
    running:    false,
    timer:      null,
    cartItems:  [],
  };

  // Big shop hero
  document.getElementById('drop-shop-emoji-big').textContent = item.shopEmoji || '🛒';
  document.getElementById('drop-shop-name-big').textContent  = item.shop || '';

  document.getElementById('drop-score').textContent      = '0 pts';
  document.getElementById('drop-feedback').textContent   = '';
  document.getElementById('drop-feedback').className     = 'drop-feedback';
  document.getElementById('drop-progress').textContent   = '';
  document.getElementById('drop-cart-items').innerHTML   = '';
  document.getElementById('drop-cart-count').textContent = '0';
  document.getElementById('drop-product').style.display  = 'none';
  document.getElementById('drop-btns').style.display     = 'flex';
  document.getElementById('drop-btn-no').disabled        = true;
  document.getElementById('drop-btn-yes').disabled       = true;
  document.getElementById('drop-start-btn').style.display = '';
  document.getElementById('drop-close-btn').style.display = 'none';
  UI.showOverlay('overlay-drop');
}

function dropStart() {
  document.getElementById('drop-start-btn').style.display = 'none';
  document.getElementById('drop-btn-no').disabled  = false;
  document.getElementById('drop-btn-yes').disabled = false;
  _drop.running = true;
  // Double rAF ensures overlay is fully painted before we measure offsetHeight
  requestAnimationFrame(() => requestAnimationFrame(() => dropNextProduct()));
}

function dropNextProduct() {
  if (_drop.idx >= _drop.products.length) { dropFinish(); return; }

  const prod = _drop.products[_drop.idx];
  _drop.answered = false;
  _drop.currentProd = prod;

  const el = document.getElementById('drop-product');
  el.style.display = 'flex';
  el.style.top     = '-80px';
  document.getElementById('drop-product-emoji').textContent = prod.emoji;
  document.getElementById('drop-product-name').textContent  = prod.name;
  document.getElementById('drop-feedback').textContent = '';
  document.getElementById('drop-feedback').className   = 'drop-feedback';
  document.getElementById('drop-progress').textContent =
    'Produto ' + (_drop.idx + 1) + ' de ' + _drop.products.length;

  // Wait for paint before measuring arena height
  const arena    = document.getElementById('drop-arena');
  const arenaH   = arena.offsetHeight || 260;
  const duration = (_drop.item.dropSeconds || 8) * 1000;
  const steps    = 80;
  const stepSize = (arenaH + 80) / steps;
  let   step     = 0;

  clearInterval(_drop.timer);
  _drop.timer = setInterval(() => {
    step++;
    const top = -80 + step * stepSize;
    el.style.top = top + 'px';

    if (step >= steps) {
      clearInterval(_drop.timer);
      if (!_drop.answered) {
        // Time ran out without answer — count as miss if belongs
        if (_drop.currentProd.belongs) {
          _drop.score += _drop.item.pointsWrong;
          flashArena('wrong');
          document.getElementById('drop-feedback').textContent = '⏱ Tempo esgotado! Era da loja!';
          document.getElementById('drop-feedback').className   = 'drop-feedback wrong';
        }
        _drop.idx++;
        setTimeout(dropNextProduct, 1000);
      }
    }
  }, duration / steps);
}

function dropAnswer(yes) {
  if (_drop.answered) return;
  _drop.answered = true;
  clearInterval(_drop.timer);

  const prod     = _drop.currentProd;
  const correct  = (yes === prod.belongs);
  const el       = document.getElementById('drop-product');
  const feedback = document.getElementById('drop-feedback');
  const score    = document.getElementById('drop-score');

  if (correct && yes) {
    // Right — goes to cart
    _drop.score += _drop.item.pointsCorrect;
    _drop.cartItems.push(prod.emoji);
    const cartEl = document.getElementById('drop-cart-items');
    const span   = document.createElement('span');
    span.className   = 'drop-cart-item';
    span.textContent = prod.emoji;
    cartEl.appendChild(span);
    // Update cart count
    const countEl = document.getElementById('drop-cart-count');
    if (countEl) countEl.textContent = _drop.cartItems.length + ' / ' + _drop.item.products.filter(p => p.belongs).length;
    // Bounce cart panel
    const panel = document.getElementById('drop-cart-panel');
    if (panel) { panel.classList.remove('cart-bounce'); void panel.offsetWidth; panel.classList.add('cart-bounce'); setTimeout(() => panel.classList.remove('cart-bounce'), 400); }
    // Animate to cart
    el.style.transition = 'top .4s ease-in';
    el.style.top = ((document.getElementById('drop-arena') ? document.getElementById('drop-arena').offsetHeight || 260 : 260) - 60) + 'px';
    flashArena('right');
    feedback.textContent = '✓ Correcto! +' + _drop.item.pointsCorrect + ' pts';
    feedback.className   = 'drop-feedback correct';feedback.className   = 'drop-feedback correct';
  } else if (correct && !yes) {
    // Right — correctly rejected
    _drop.score += _drop.item.pointsCorrect;
    el.style.transition = 'top .5s ease-in';
    el.style.top = ((document.getElementById('drop-arena') ? document.getElementById('drop-arena').offsetHeight || 260 : 260) + 10) + 'px';
    flashArena('right');
    feedback.textContent = '✓ Correcto! Não era da loja. +' + _drop.item.pointsCorrect + ' pts';
    feedback.className   = 'drop-feedback correct';
  } else {
    // Wrong
    _drop.score += _drop.item.pointsWrong;
    el.style.transition = 'top .8s ease-in';
    el.style.top = ((document.getElementById('drop-arena') ? document.getElementById('drop-arena').offsetHeight || 260 : 260) + 10) + 'px';
    flashArena('wrong');
    feedback.textContent = yes
      ? '✕ Errado! Não era da loja. ' + _drop.item.pointsWrong + ' pts'
      : '✕ Errado! Era da loja. ' + _drop.item.pointsWrong + ' pts';
    feedback.className = 'drop-feedback wrong';
  }

  document.getElementById('drop-score').textContent = Math.max(0, _drop.score) + ' pts';
  _drop.idx++;
  setTimeout(() => {
    el.style.transition = '';
    dropNextProduct();
  }, 1200);
}

function flashArena(type) {
  const arena = document.getElementById('drop-arena');
  arena.classList.remove('flash-wrong', 'flash-right');
  void arena.offsetWidth;
  arena.classList.add(type === 'wrong' ? 'flash-wrong' : 'flash-right');
  setTimeout(() => arena.classList.remove('flash-wrong', 'flash-right'), 500);
}

function dropFinish() {
  _drop.running = false;
  document.getElementById('drop-product').style.display  = 'none';
  document.getElementById('drop-btn-no').disabled        = true;
  document.getElementById('drop-btn-yes').disabled       = true;
  document.getElementById('drop-close-btn').style.display = '';
  document.getElementById('drop-btns').style.display     = 'none';
  const pts = Math.max(0, _drop.score);
  document.getElementById('drop-feedback').textContent = '🎉 Terminado! Fizeram ' + pts + ' pontos!';
  document.getElementById('drop-feedback').className   = 'drop-feedback correct';
  if (pts > 0) triggerConfetti();
}

function dropClose() {
  chalTimerStop();
  clearInterval(_drop.timer);
  UI.hideOverlay('overlay-drop');
  const pts = Math.max(0, _drop.score);
  if (pts > 0) {
    G.points += pts;
    UI.updatePoints();
    UI._renderRanking(document.getElementById('ranking-list'));
  }
  stopCardTimer();
  setTimeout(() => afterThrow(), 50);
}

// ─── CHALLENGE: BODY ──────────────────────────────────────
function showBodyChallenge(item) {
  UI.hideDice();
  document.getElementById('body-hint').textContent = item.hint || '';
  document.getElementById('body-word').textContent = item.word || '';
  document.getElementById('body-result').textContent = '';
  document.getElementById('body-result').className   = 'r2-result';
  document.getElementById('body-close-btn').style.display = 'none';

  const lettersEl = document.getElementById('body-letters');
  lettersEl.innerHTML = '';
  (item.letters || []).forEach(l => {
    const card = document.createElement('div');
    card.className = 'body-letter-card';
    card.innerHTML = '<div class="body-letter-big">' + l.letter + '</div>'
      + '<div class="body-letter-hint">' + (l.hint || '') + '</div>';
    lettersEl.appendChild(card);
  });

  UI.showOverlay('overlay-body');
  chalTimerStart('body-chal-timer', () => bodyClose());
}

function bodyDone() {
  const pts = G.cfg ? G.cfg.pointsChallenge : 20;
  document.getElementById('body-result').textContent = '🎉 Muito bem! +' + pts + ' pts';
  document.getElementById('body-result').className   = 'r2-result win';
  document.getElementById('body-close-btn').style.display = '';
  triggerConfetti();
}

function bodyRepeat() {
  document.getElementById('body-result').textContent = '';
}

function bodyClose() {
  chalTimerStop();
  UI.hideOverlay('overlay-body');
  G.points += G.cfg ? G.cfg.pointsChallenge : 20;
  UI.updatePoints();
  UI._renderRanking(document.getElementById('ranking-list'));
  stopCardTimer();
  setTimeout(() => afterThrow(), 50);
}

// ─── CHALLENGE: MEMORY ────────────────────────────────────
let _mem = {};

function showMemoryChallenge(item) {
  UI.hideDice();
  _mem = {
    item:          item,
    rowIdx:        0,
    selectedColor: null,
    answers:       [],  // array of chosen colours per product
    timer:         null,
    phase:         'show', // 'show' | 'paint' | 'result'
  };

  document.getElementById('memory-close-btn').style.display = 'none';
  document.getElementById('memory-result-wrap').style.display = 'none';
  document.getElementById('memory-palette').style.display     = 'none';
  memoryShowRow(0);
  UI.showOverlay('overlay-memory');
  chalTimerStart('memory-timer-label', () => memoryClose());
}

function memoryShowRow(rowIdx) {
  // Clear any running timer from previous row
  clearInterval(_mem.timer);
  _mem.timer = null;

  _mem.rowIdx        = rowIdx;
  _mem.phase         = 'show';
  _mem.answers       = [];
  _mem.selectedColor = null;
  if (rowIdx === 0) _mem._totalPts = 0; // reset total on first row

  const row      = _mem.item.rows[rowIdx];
  const secs     = _mem.item.showSeconds || 5;
  let   timeLeft = secs;

  document.getElementById('memory-phase-label').textContent = '👀 Memoriza as cores! (' + (rowIdx + 1) + '/' + _mem.item.rows.length + ')';
  document.getElementById('memory-timer-label').textContent = timeLeft + 's';
  document.getElementById('memory-result-wrap').style.display = 'none';
  document.getElementById('memory-palette').style.display     = 'none';
  document.getElementById('memory-close-btn').style.display   = 'none';

  memoryRenderProducts(row, true, null);

  _mem.timer = setInterval(() => {
    timeLeft--;
    document.getElementById('memory-timer-label').textContent = timeLeft + 's';
    if (timeLeft <= 0) {
      clearInterval(_mem.timer);
      _mem.timer = null;
      memoryStartPaint(row);
    }
  }, 1000);
}

function memoryStartPaint(row) {
  _mem.phase = 'paint';
  _mem.answers = new Array(row.length).fill(null);
  document.getElementById('memory-phase-label').textContent = '🎨 Pintam as cores!';
  document.getElementById('memory-timer-label').textContent = '';

  // Render products in B&W
  memoryRenderProducts(row, false, _mem.answers);

  // Render colour palette — shuffled so order is random
  const colours = [...new Set(row.map(p => p.color))].sort(() => Math.random() - 0.5);
  const colEl   = document.getElementById('memory-colours');
  colEl.innerHTML = '';
  colours.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'memory-colour-btn';
    btn.style.background = c;
    btn.dataset.color = c;
    btn.onclick = () => memorySelectColor(c);
    colEl.appendChild(btn);
  });
  document.getElementById('memory-palette').style.display = '';
}

function memorySelectColor(color) {
  _mem.selectedColor = color;
  document.querySelectorAll('.memory-colour-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.color === color);
  });
}

function memoryPaintProduct(idx) {
  if (_mem.phase !== 'paint') return;
  if (!_mem.selectedColor) {
    // Flash palette to indicate colour must be selected first
    const pal = document.getElementById('memory-palette');
    if (pal) { pal.style.outline = '2px solid var(--red)'; setTimeout(() => pal.style.outline = '', 600); }
    return;
  }
  _mem.answers[idx] = _mem.selectedColor;
  const row = _mem.item.rows[_mem.rowIdx];
  memoryRenderProducts(row, false, _mem.answers);

  // Check if all painted
  if (_mem.answers.every(a => a !== null)) {
    setTimeout(memoryShowResult, 600);
  }
}

function memoryRenderProducts(row, showColor, answers) {
  const el = document.getElementById('memory-products');
  el.innerHTML = '';
  row.forEach((prod, i) => {
    const div = document.createElement('div');
    div.className = 'memory-product' + (_mem.phase === 'paint' ? ' clickable' : '');
    div.onclick   = _mem.phase === 'paint' ? () => memoryPaintProduct(i) : null;

    // Image: show color version when memorising, b&w when painting
    const imgSrc = showColor
      ? (prod.imgColor || prod.emoji || '')
      : (prod.imgBw    || prod.emoji || '');

    if (imgSrc && imgSrc.startsWith('data:')) {
      const imgEl = document.createElement('img');
      imgEl.src = imgSrc;
      imgEl.className = 'memory-product-img';
      imgEl.alt = prod.name;
      div.appendChild(imgEl);
    } else {
      // Fallback to emoji
      const emojiEl = document.createElement('div');
      emojiEl.className   = 'memory-product-emoji';
      emojiEl.textContent = prod.emoji || '?';
      div.appendChild(emojiEl);
    }

    const swatch = document.createElement('div');
    const isPainted = !showColor && answers && answers[i];
    swatch.className = 'memory-product-swatch' + (showColor || isPainted ? '' : ' bw');
    swatch.style.background = showColor ? prod.color : (answers && answers[i] ? answers[i] : '#555');

    div.appendChild(swatch);
    el.appendChild(div);
  });
}

function memoryShowResult() {
  _mem.phase = 'result';
  const row     = _mem.item.rows[_mem.rowIdx];
  const answers = _mem.answers;
  let   correct = 0;

  document.getElementById('memory-palette').style.display  = 'none';
  document.getElementById('memory-result-wrap').style.display = '';
  document.getElementById('memory-phase-label').textContent = '📊 Resultado!';

  // Original row
  const origEl = document.getElementById('memory-original-row');
  origEl.innerHTML = '';
  row.forEach((prod, i) => {
    const s = document.createElement('div');
    s.className = 'memory-compare-swatch ' + (answers[i] === prod.color ? 'match' : 'wrong');
    s.style.background = prod.color;
    s.title = prod.name;
    origEl.appendChild(s);
  });

  // Answer row
  const ansEl = document.getElementById('memory-answer-row');
  ansEl.innerHTML = '';
  row.forEach((prod, i) => {
    const s = document.createElement('div');
    s.className = 'memory-compare-swatch ' + (answers[i] === prod.color ? 'match' : 'wrong');
    s.style.background = answers[i] || '#555';
    s.title = prod.name;
    ansEl.appendChild(s);
    if (answers[i] === prod.color) correct++;
  });

  const pts = correct * (_mem.item.pointsCorrect || 10);
  document.getElementById('memory-score-text').textContent =
    correct + '/' + row.length + ' certas → ' + pts + ' pontos!';
  if (pts > 0) triggerConfetti();

  // Check if more rows
  const hasMoreRows = _mem.rowIdx + 1 < _mem.item.rows.length;
  const closeBtnEl  = document.getElementById('memory-close-btn');
  closeBtnEl.style.display = '';
  closeBtnEl.textContent   = hasMoreRows ? 'Próxima linha →' : 'Continuar →';
  closeBtnEl.onclick       = hasMoreRows
    ? () => memoryShowRow(_mem.rowIdx + 1)
    : memoryClose;

  _mem._totalPts = (_mem._totalPts || 0) + pts;
}

function memoryClose() {
  chalTimerStop();
  clearInterval(_mem.timer);
  UI.hideOverlay('overlay-memory');
  const pts = _mem._totalPts || 0;
  if (pts > 0) {
    G.points += pts;
    UI.updatePoints();
    UI._renderRanking(document.getElementById('ranking-list'));
  }
  stopCardTimer();
  setTimeout(() => afterThrow(), 50);
}

// ─── CHALLENGE: SPOT (Jogo das Diferenças) ────────────────
let _spot = {};

function showSpotChallenge(item) {
  UI.hideDice();
  const d = item.data || item;

  _spot = {
    item:       d,
    diffs:      d.diffs || [],
    found:      new Array(d.diffs ? d.diffs.length : 0).fill(false),
    score:      0,
    misses:     0,
    finished:   false,
  };

  document.getElementById('spot-title').textContent    = d.name || 'Jogo das Diferenças';
  document.getElementById('spot-img-orig').src          = d.imgOrig || '';
  document.getElementById('spot-img-err').src           = d.imgErr  || '';
  document.getElementById('spot-found').textContent     = '0 / ' + _spot.diffs.length;
  document.getElementById('spot-score-label').textContent = '0 pts';
  document.getElementById('spot-feedback').textContent  = '';
  document.getElementById('spot-feedback').className    = 'spot-feedback';
  document.getElementById('spot-close-btn').style.display = 'none';
  document.getElementById('spot-svg-orig').innerHTML    = '';
  document.getElementById('spot-svg-err').innerHTML     = '';

  // Click handler on error image
  const clickable = document.getElementById('spot-clickable');
  clickable.onclick = spotClick;

  UI.showOverlay('overlay-spot');
}

function spotGetImgRect() {
  // Get the actual rendered bounds of the image inside the container (object-fit:contain)
  const img  = document.getElementById('spot-img-err');
  const wrap = document.getElementById('spot-clickable');
  const wR   = wrap.getBoundingClientRect();
  const iR   = img.getBoundingClientRect();
  // Natural aspect ratio
  const natW = img.naturalWidth  || img.width;
  const natH = img.naturalHeight || img.height;
  const aspW = wR.width;
  const aspH = wR.height;
  // Scaled size maintaining aspect ratio (contain)
  const scale = Math.min(aspW / natW, aspH / natH);
  const rW    = natW * scale;
  const rH    = natH * scale;
  const offX  = (aspW - rW) / 2;
  const offY  = (aspH - rH) / 2;
  return { left: wR.left + offX, top: wR.top + offY, width: rW, height: rH, offX, offY, rW, rH, aspW, aspH };
}

function spotClick(e) {
  if (_spot.finished) return;
  const imgR  = spotGetImgRect();
  const rx    = (e.clientX - imgR.left)  / imgR.width;
  const ry    = (e.clientY - imgR.top)   / imgR.height;
  // Ignore clicks outside the actual image area
  if (rx < 0 || rx > 1 || ry < 0 || ry > 1) return;
  const r     = _spot.item.radius || 0.07;

  let hit = -1;
  _spot.diffs.forEach((diff, i) => {
    if (_spot.found[i]) return;
    const dx = rx - diff.x;
    const dy = ry - diff.y;
    if (Math.sqrt(dx*dx + dy*dy) < r) hit = i;
  });

  if (hit >= 0) {
    _spot.found[hit] = true;
    _spot.score += _spot.item.pointsEach || 8;
    spotDrawCircle('err',  _spot.diffs[hit], 'found');
    spotDrawCircle('orig', _spot.diffs[hit], 'orig');
    triggerConfetti();

    const total = _spot.diffs.filter(Boolean).length;
    const found = _spot.found.filter(Boolean).length;
    document.getElementById('spot-found').textContent       = found + ' / ' + total;
    document.getElementById('spot-score-label').textContent = _spot.score + ' pts';
    document.getElementById('spot-feedback').textContent    = '✓ ' + _spot.diffs[hit].label + '! +' + (_spot.item.pointsEach || 8) + ' pts';
    document.getElementById('spot-feedback').className      = 'spot-feedback correct';

    if (found >= total) spotFinish();
  } else {
    // Miss — draw a small fading circle
    _spot.misses++;
    spotDrawMiss('err', rx, ry);
    document.getElementById('spot-feedback').textContent = '✗ Não é aí! Continua a tentar...';
    document.getElementById('spot-feedback').className   = 'spot-feedback wrong';
  }
}

function spotImgToSvg(rx, ry) {
  // Convert image-relative coords to SVG container coords
  const imgR = spotGetImgRect();
  const wrap = document.getElementById('spot-clickable').getBoundingClientRect();
  const svgX = (imgR.offX + rx * imgR.rW) / imgR.aspW;
  const svgY = (imgR.offY + ry * imgR.rH) / imgR.aspH;
  const svgR = (imgR.rW / imgR.aspW) * 0.07; // radius as fraction of SVG width
  return { x: svgX, y: svgY, r: svgR };
}

function spotDrawCircle(side, diff, type) {
  const svg  = document.getElementById('spot-svg-' + side);
  const pos  = spotImgToSvg(diff.x, diff.y);
  const c    = document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('cx', (pos.x * 100) + '%');
  c.setAttribute('cy', (pos.y * 100) + '%');
  c.setAttribute('r',  (pos.r * 100) + '%');
  c.setAttribute('class', type === 'orig' ? 'spot-circle-orig' : 'spot-circle-found');
  svg.appendChild(c);
}

function spotDrawMiss(side, rx, ry) {
  const svg = document.getElementById('spot-svg-' + side);
  const pos = spotImgToSvg(rx, ry);
  const c   = document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('cx', (pos.x * 100) + '%');
  c.setAttribute('cy', (pos.y * 100) + '%');
  c.setAttribute('r',  (pos.r * 0.6 * 100) + '%');
  c.setAttribute('class','spot-circle-miss');
  svg.appendChild(c);
  setTimeout(() => { if (c.parentNode) c.parentNode.removeChild(c); }, 1200);
}

function spotFinish() {
  _spot.finished = true;
  document.getElementById('spot-clickable').onclick = null;
  document.getElementById('spot-feedback').textContent = '🎉 Encontraste todas as diferenças! ' + _spot.score + ' pts!';
  document.getElementById('spot-feedback').className   = 'spot-feedback done';
  document.getElementById('spot-close-btn').style.display = '';
  triggerConfetti();
}

function spotClose() {
  chalTimerStop();
  UI.hideOverlay('overlay-spot');
  if (_spot.score > 0) {
    G.points += _spot.score;
    UI.updatePoints();
    UI._renderRanking(document.getElementById('ranking-list'));
  }
  stopCardTimer();
  setTimeout(() => afterThrow(), 50);
}