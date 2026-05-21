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
    const svg = document.getElementById('board-svg');
    if (!svg) return;
    const VB = 600;
    svg.setAttribute('viewBox', '0 0 ' + VB + ' ' + VB);
    const CR = 72;
    const CW = Math.floor((VB - 2 * CR) / 7);
    const CH = CR;
    svg.innerHTML = this._boardHTML(VB, CR, CW, CH);
    // Double rAF ensures browser has painted layout before pawn calculates positions
    if (G.teamName) requestAnimationFrame(() => requestAnimationFrame(() => PAWN.draw(G.pos)));
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
    const logoW  = Math.round(iw * 0.38);
    const logoH  = Math.round(logoW * 0.44);
    const logoX  = cx - logoW / 2;
    const logoY  = iy + Math.round(ih * 0.04);
    const deckH  = Math.round(ih * 0.5);
    const deckW  = Math.round(deckH * 0.72);
    const gap    = Math.round(iw * 0.06);
    const deckY  = logoY + logoH + Math.round(ih * 0.04);
    const deck1X = Math.round(cx - gap / 2 - deckW);
    const deck2X = Math.round(cx + gap / 2);
    const labelY = deckY + deckH + Math.round(deckH * 0.1);
    const labelFs = Math.round(deckH * 0.1);
    const col1   = isLight ? '#1472e8' : 'rgba(90,171,255,0.85)';
    const col2   = isLight ? '#8b44e8' : 'rgba(199,125,255,0.85)';

    return '<image href="logo.png" x="' + logoX + '" y="' + logoY + '" width="' + logoW + '" height="' + logoH + '" preserveAspectRatio="xMidYMid meet" opacity="0.15"/>'
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
    document.getElementById('end-emoji').textContent  = G.secsLeft > 0 ? '🏆' : '⏰';
    document.getElementById('end-title').textContent  = G.secsLeft > 0 ? 'Missão cumprida!' : 'O tempo acabou!';
    document.getElementById('end-team').textContent   = G.teamName;
    document.getElementById('end-time').textContent   = fmtTime(G.secsLeft);
    document.getElementById('end-points').textContent = G.points;

    const ranking  = await DB.todayRanking();
    const myRank   = ranking.findIndex(g => !g.fake && g.points === G.points);
    const ordinals = ['1ª','2ª','3ª','4ª','5ª','6ª','7ª','8ª','9ª','10ª'];
    const countEl  = document.getElementById('end-team-count');
    if (countEl) countEl.textContent = (ordinals[myRank] || (myRank + 1) + 'ª') + ' equipa hoje · ' + ranking.length + ' jogos';

    // Set date on end ranking header
    const dateEl = document.getElementById('end-ranking-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('pt-PT');

    // Render full ranking in the end panel
    const endList = document.getElementById('end-ranking-list');
    if (endList) this._renderRanking(endList);

    // Also update the side ranking panel
    this.updateRanking();
    this.showScreen('end');
  },

  // ─── HELPERS ────────────────────────────────────────────
  showOverlay(id) { const el = document.getElementById(id); if (el) el.style.display = 'flex'; },
  hideOverlay(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; },
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

  // Convert board coords → screen pixels
  // board-svg has aspect-ratio:1/1 so it renders as a square centred in board-wrap
  // pawn-svg has inset:0 over board-wrap — same origin
  toScreen(bx, by) {
    const svg  = document.getElementById('board-svg');
    const wrap = document.getElementById('board-wrap');
    if (!svg || !wrap) return { x: 0, y: 0, scale: 1 };

    const svgRect  = svg.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();

    // The rendered square size (board-svg respects aspect-ratio:1/1)
    const size  = Math.min(svgRect.width, svgRect.height);
    const scale = size / this.VB;

    // Offset of the rendered square inside board-wrap
    const offX = (svgRect.left - wrapRect.left) + (svgRect.width  - size) / 2;
    const offY = (svgRect.top  - wrapRect.top)  + (svgRect.height - size) / 2;

    return {
      x:     offX + bx * scale,
      y:     offY + by * scale,
      scale: scale,
    };
  },

  // Draw the pawn at a given board position immediately (no animation)
  draw(pos) {
    const psvg = document.getElementById('pawn-svg');
    if (!psvg) return;
    const bc = this.cellCentre(pos);
    const sc = this.toScreen(bc.x, bc.y);
    this._x = sc.x;
    this._y = sc.y;
    this._renderAt(sc.x, sc.y, sc.scale || 1);
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
      const DURATION = 140;  // ms per cell
      const STEPS    = 12;
      const A_HEIGHT = 28;   // arc height in board units

      const bc0 = this.cellCentre(from);
      const bc1 = this.cellCentre(to);
      const sc0 = this.toScreen(bc0.x, bc0.y);
      const sc1 = this.toScreen(bc1.x, bc1.y);
      const scale = sc0.scale || 1;

      let step = 0;
      const interval = setInterval(() => {
        step++;
        const t   = step / STEPS;
        const arc = Math.sin(t * Math.PI) * A_HEIGHT * scale;
        const x   = sc0.x + (sc1.x - sc0.x) * t;
        const y   = sc0.y + (sc1.y - sc0.y) * t - arc;
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
      const bc = this.cellCentre(pos);
      const sc = this.toScreen(bc.x, bc.y);
      const scale = sc.scale || 1;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const t   = step / STEPS;
        // Damped bounce: goes down slightly then back up
        const bump = Math.abs(Math.sin(t * Math.PI * 2)) * 8 * (1 - t) * scale;
        this._renderAt(sc.x, sc.y - bump, scale);
        if (step >= STEPS) {
          clearInterval(interval);
          this._renderAt(sc.x, sc.y, scale);
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