// themes.js - Sistema de temas COMPLETO v2

class FendaThemes {
  constructor() {
    this.currentTheme = localStorage.getItem('fenda-theme') || 'dark-purple';
    this.themes = {
      'dark-purple': {
        name: 'Roxo Fenda', emoji: '💜',
        bg: '#0a0a0f', bg2: '#0f0f1a', bg3: '#07070c',
        surface: '#1c1826', surface2: '#12101c', surface3: 'rgba(22,18,38,0.78)',
        primary: '#7c3aed', primaryHi: '#a855f7', primaryUp: '#c084fc',
        primaryGlow: 'rgba(124,58,237,0.45)', primaryLine: 'rgba(146,76,255,0.25)',
        accent: '#ec4899', accentSoft: 'rgba(217,70,239,0.2)',
        gradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
        gradientProfile: 'linear-gradient(135deg, #3b1d8a 0%, #6d28d9 40%, #9333ea 70%, #c026d3 100%)',
        playerBg: 'linear-gradient(145deg, #0c0916 0%, #05030a 100%)',
        playerGrad: 'linear-gradient(160deg, #2a1a4a 0%, #0a0812 60%)',
        queueBg: 'linear-gradient(160deg, #0e0b1a 0%, #080612 100%)',
        navBg: 'rgba(10,10,15,0.9)',
        notifBg: '#0a0812',
        ink: '#f0eaff', inkMid: 'rgba(255,255,255,0.65)', inkLow: 'rgba(255,255,255,0.42)',
        inkFaint: 'rgba(255,255,255,0.25)', inkMuted: 'rgba(255,255,255,0.45)',
        border: 'rgba(255,255,255,0.05)', borderHi: 'rgba(192,132,252,0.35)',
        mode: 'dark',
      },
      'dark-blue': {
        name: 'Azul Noturno', emoji: '🔵',
        bg: '#030a14', bg2: '#071020', bg3: '#020810',
        surface: '#0f1c2e', surface2: '#0a1420', surface3: 'rgba(15,28,46,0.78)',
        primary: '#3b82f6', primaryHi: '#60a5fa', primaryUp: '#93c5fd',
        primaryGlow: 'rgba(59,130,246,0.45)', primaryLine: 'rgba(59,130,246,0.25)',
        accent: '#06b6d4', accentSoft: 'rgba(6,182,212,0.2)',
        gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        gradientProfile: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #3b82f6 70%, #06b6d4 100%)',
        playerBg: 'linear-gradient(145deg, #071020 0%, #020810 100%)',
        playerGrad: 'linear-gradient(160deg, #0d2a4a 0%, #020c18 60%)',
        queueBg: 'linear-gradient(160deg, #071020 0%, #020810 100%)',
        navBg: 'rgba(3,10,20,0.9)',
        notifBg: '#030a14',
        ink: '#e0f0ff', inkMid: 'rgba(255,255,255,0.65)', inkLow: 'rgba(255,255,255,0.42)',
        inkFaint: 'rgba(255,255,255,0.25)', inkMuted: 'rgba(255,255,255,0.45)',
        border: 'rgba(255,255,255,0.05)', borderHi: 'rgba(96,165,250,0.35)',
        mode: 'dark',
      },
      'dark-green': {
        name: 'Verde Floresta', emoji: '💚',
        bg: '#030f0a', bg2: '#071a0f', bg3: '#020c07',
        surface: '#0f2018', surface2: '#0a1810', surface3: 'rgba(15,32,24,0.78)',
        primary: '#10b981', primaryHi: '#34d399', primaryUp: '#6ee7b7',
        primaryGlow: 'rgba(16,185,129,0.45)', primaryLine: 'rgba(16,185,129,0.25)',
        accent: '#f59e0b', accentSoft: 'rgba(245,158,11,0.2)',
        gradient: 'linear-gradient(135deg, #10b981, #f59e0b)',
        gradientProfile: 'linear-gradient(135deg, #064e3b 0%, #059669 40%, #10b981 70%, #f59e0b 100%)',
        playerBg: 'linear-gradient(145deg, #071a0f 0%, #020c07 100%)',
        playerGrad: 'linear-gradient(160deg, #0d3a20 0%, #020e08 60%)',
        queueBg: 'linear-gradient(160deg, #071a0f 0%, #020c07 100%)',
        navBg: 'rgba(3,15,10,0.9)',
        notifBg: '#030f0a',
        ink: '#e0fff5', inkMid: 'rgba(255,255,255,0.65)', inkLow: 'rgba(255,255,255,0.42)',
        inkFaint: 'rgba(255,255,255,0.25)', inkMuted: 'rgba(255,255,255,0.45)',
        border: 'rgba(255,255,255,0.05)', borderHi: 'rgba(52,211,153,0.35)',
        mode: 'dark',
      },
      'dark-pink': {
        name: 'Rosa Neon', emoji: '🩷',
        bg: '#100510', bg2: '#1a0a1a', bg3: '#0c030c',
        surface: '#200f20', surface2: '#180a18', surface3: 'rgba(32,15,32,0.78)',
        primary: '#ec4899', primaryHi: '#f472b6', primaryUp: '#f9a8d4',
        primaryGlow: 'rgba(236,72,153,0.45)', primaryLine: 'rgba(236,72,153,0.25)',
        accent: '#8b5cf6', accentSoft: 'rgba(139,92,246,0.2)',
        gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
        gradientProfile: 'linear-gradient(135deg, #831843 0%, #be185d 40%, #ec4899 70%, #8b5cf6 100%)',
        playerBg: 'linear-gradient(145deg, #1a0a1a 0%, #0c030c 100%)',
        playerGrad: 'linear-gradient(160deg, #3a0d2a 0%, #100510 60%)',
        queueBg: 'linear-gradient(160deg, #1a0a1a 0%, #0c030c 100%)',
        navBg: 'rgba(16,5,16,0.9)',
        notifBg: '#100510',
        ink: '#ffe0f5', inkMid: 'rgba(255,255,255,0.65)', inkLow: 'rgba(255,255,255,0.42)',
        inkFaint: 'rgba(255,255,255,0.25)', inkMuted: 'rgba(255,255,255,0.45)',
        border: 'rgba(255,255,255,0.05)', borderHi: 'rgba(244,114,182,0.35)',
        mode: 'dark',
      },
      'dark-red': {
        name: 'Vermelho Fogo', emoji: '🔴',
        bg: '#100303', bg2: '#1a0707', bg3: '#0c0202',
        surface: '#200a0a', surface2: '#180505', surface3: 'rgba(32,10,10,0.78)',
        primary: '#ef4444', primaryHi: '#f87171', primaryUp: '#fca5a5',
        primaryGlow: 'rgba(239,68,68,0.45)', primaryLine: 'rgba(239,68,68,0.25)',
        accent: '#fbbf24', accentSoft: 'rgba(251,191,36,0.2)',
        gradient: 'linear-gradient(135deg, #ef4444, #fbbf24)',
        gradientProfile: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 40%, #ef4444 70%, #fbbf24 100%)',
        playerBg: 'linear-gradient(145deg, #1a0707 0%, #0c0202 100%)',
        playerGrad: 'linear-gradient(160deg, #3a0d0d 0%, #100303 60%)',
        queueBg: 'linear-gradient(160deg, #1a0707 0%, #0c0202 100%)',
        navBg: 'rgba(16,3,3,0.9)',
        notifBg: '#100303',
        ink: '#ffe0e0', inkMid: 'rgba(255,255,255,0.65)', inkLow: 'rgba(255,255,255,0.42)',
        inkFaint: 'rgba(255,255,255,0.25)', inkMuted: 'rgba(255,255,255,0.45)',
        border: 'rgba(255,255,255,0.05)', borderHi: 'rgba(248,113,113,0.35)',
        mode: 'dark',
      },
      'oled': {
        name: 'OLED Black', emoji: '⚫',
        bg: '#000000', bg2: '#000000', bg3: '#000000',
        surface: '#0a0a0a', surface2: '#050505', surface3: 'rgba(10,10,10,0.78)',
        primary: '#9333ea', primaryHi: '#a855f7', primaryUp: '#c084fc',
        primaryGlow: 'rgba(147,51,234,0.45)', primaryLine: 'rgba(147,51,234,0.25)',
        accent: '#ec4899', accentSoft: 'rgba(236,72,153,0.2)',
        gradient: 'linear-gradient(135deg, #9333ea, #ec4899)',
        gradientProfile: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 40%, #9333ea 70%, #ec4899 100%)',
        playerBg: 'linear-gradient(145deg, #050505 0%, #000000 100%)',
        playerGrad: 'linear-gradient(160deg, #150a25 0%, #000000 60%)',
        queueBg: 'linear-gradient(160deg, #050505 0%, #000000 100%)',
        navBg: 'rgba(0,0,0,0.98)',
        notifBg: '#000000',
        ink: '#f0eaff', inkMid: 'rgba(255,255,255,0.65)', inkLow: 'rgba(255,255,255,0.42)',
        inkFaint: 'rgba(255,255,255,0.25)', inkMuted: 'rgba(255,255,255,0.45)',
        border: 'rgba(255,255,255,0.04)', borderHi: 'rgba(192,132,252,0.35)',
        mode: 'dark',
      },
      'light': {
        name: 'Claro Moderno', emoji: '☀️',
        bg: '#f0eefc', bg2: '#e8e4f8', bg3: '#ddd8f5',
        surface: '#ffffff', surface2: '#f5f3ff', surface3: 'rgba(255,255,255,0.9)',
        primary: '#7c3aed', primaryHi: '#9333ea', primaryUp: '#a855f7',
        primaryGlow: 'rgba(124,58,237,0.3)', primaryLine: 'rgba(124,58,237,0.2)',
        accent: '#ec4899', accentSoft: 'rgba(236,72,153,0.15)',
        gradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
        gradientProfile: 'linear-gradient(135deg, #3b1d8a 0%, #6d28d9 40%, #9333ea 70%, #c026d3 100%)',
        playerBg: 'linear-gradient(145deg, #e8e4f8 0%, #ddd8f5 100%)',
        playerGrad: 'linear-gradient(160deg, #d4b8f8 0%, #e8e0ff 60%)',
        queueBg: 'linear-gradient(160deg, #f0eefc 0%, #e8e4f8 100%)',
        navBg: 'rgba(240,238,252,0.95)',
        notifBg: '#f0eefc',
        ink: '#1a1a2e', inkMid: 'rgba(0,0,0,0.65)', inkLow: 'rgba(0,0,0,0.45)',
        inkFaint: 'rgba(0,0,0,0.25)', inkMuted: 'rgba(0,0,0,0.45)',
        border: 'rgba(0,0,0,0.07)', borderHi: 'rgba(124,58,237,0.3)',
        mode: 'light',
      },
    };
    this.styleEl = null;
    this.init();
  }

  init() {
    this.styleEl = document.createElement('style');
    this.styleEl.id = 'fenda-theme-css';
    document.head.appendChild(this.styleEl);
    this.applyTheme(this.currentTheme);
  }

  applyTheme(name) {
    const t = this.themes[name];
    if (!t) return;
    const isLight = t.mode === 'light';

    this.styleEl.textContent = `
      /* ── GLOBAL ── */
      body { background: ${t.bg} !important; color: ${t.ink} !important; }
      .app-container { background: linear-gradient(180deg, ${t.bg2} 0%, ${t.bg3} 100%) !important; }

      /* ── NAV ── */
      .nav-bar { background: ${t.navBg} !important; border-top-color: ${t.border} !important; }
      .nav-btn { color: ${t.inkMuted} !important; }
      .nav-btn.active { color: ${t.primaryHi} !important; }
      .nav-btn p, .nav-btn span { color: inherit !important; }

      /* ── MINI PLAYER ── */
      .player-bottom-bar {
        background: ${isLight ? 'rgba(255,255,255,0.85)' : 'rgba(28,20,50,0.55)'} !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${t.primary}33 !important;
      }
      .mini-ring-fill { stroke: ${t.primaryHi} !important; }
      .mini-ctrl-play { background: ${t.primaryHi} !important; box-shadow: 0 2px 12px ${t.primaryGlow} !important; }
      .mini-info h4 { color: ${t.ink} !important; }
      .mini-info p { color: ${t.inkMuted} !important; }

      /* ── PLAYER EXPANDIDO ── */
      .lyrics-full-screen { background: ${t.playerBg} !important; }
      .player-bg { background: ${t.playerGrad} !important; }
      .ctrl-play { background: ${t.gradient} !important; box-shadow: 0 4px 20px ${t.primaryGlow} !important; }
      .player-seek-fill { background: ${t.primary} !important; }
      .player-seek-thumb { background: ${t.primary} !important; }
      .player-mini-controls { background: ${isLight ? 'rgba(240,236,255,0.96)' : 'rgba(8,6,16,0.96)'} !important; border-top-color: ${t.primary}22 !important; }
      .player-mini-play { background: ${t.gradient} !important; box-shadow: 0 2px 10px ${t.primaryGlow} !important; }
      .player-mini-cover { border-color: ${t.primary}33 !important; }
      .player-mini-info span:first-child { color: ${t.ink} !important; }
      .player-mini-info span:last-child { color: ${t.inkMuted} !important; }

      /* ── FILA / QUEUE ── */
      .queue-panel { background: ${t.queueBg} !important; border-left-color: ${t.primary}44 !important; }
      .qp-item.active { border-left-color: ${t.primary} !important; }
      .qp-playing-bar { background: linear-gradient(180deg, ${t.primaryHi}, ${t.primary}) !important; }

      /* ── MODAIS ── */
      .modal-content-box { background: ${t.surface} !important; color: ${t.ink} !important; }
      .context-menu-modal { background: ${t.surface2} !important; }
      .modal-btn-ok { background: ${t.gradient} !important; }
      .modal-btn-cancel { background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'} !important; color: ${t.inkLow} !important; }
      input, textarea { background: ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'} !important; color: ${t.ink} !important; border-color: ${t.primaryLine} !important; }

      /* ── CONTEXT MENU ── */
      .ctx-title { color: ${t.ink} !important; }
      .ctx-artist { color: ${t.inkMuted} !important; }
      .ctx-btn { color: ${isLight ? '#1a1a2e' : '#f0eaff'} !important; }
      .ctx-btn:active { background: ${t.primary}22 !important; }
      .ctx-icon-purple { background: ${t.primary}2e !important; color: ${t.primaryHi} !important; }
      .ctx-divider { background: ${t.border} !important; }

      /* ── FEATURED (INÍCIO) ── */
      .featured-card { background: ${t.gradient} !important; }
      .featured-badge { background: ${t.primary}55 !important; border-color: ${t.primary}66 !important; color: ${t.primaryUp} !important; }
      .featured-content h2 { color: #fff !important; }
      .featured-content p { color: rgba(255,255,255,0.7) !important; }
      .featured-play-btn { background: ${isLight ? t.primary : '#fff'} !important; color: ${isLight ? '#fff' : '#0a0812'} !important; }

      /* ── INÍCIO - variáveis ── */
      .tab-content#inicio { --vp-bg: ${t.bg}; --vp-surface: ${t.surface3}; --vp-violet: ${t.primary}; --vp-violet-hi: ${t.primaryHi}; --vp-violet-line: ${t.primaryLine}; }
      .section-header h2 { color: ${t.ink} !important; }
      .section-see-all { color: ${t.primaryHi} !important; }
      .home-section .artist-name, .recent-song-title { color: ${t.ink} !important; }
      .recent-song-artist, .artist-plays { color: ${t.inkMuted} !important; }

      /* ── BIBLIOTECA - variáveis ── */
      #biblioteca {
        --lib-surface: ${t.surface3};
        --lib-surface-2: ${isLight ? 'rgba(255,255,255,0.9)' : 'rgba(32,26,54,0.9)'};
        --lib-surface-hi: ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'};
        --lib-border: ${t.border};
        --lib-border-hi: ${t.borderHi};
        --lib-violet: ${t.primary};
        --lib-violet-hi: ${t.primaryHi};
        --lib-violet-up: ${t.primaryUp};
        --lib-violet-glow: ${t.primaryGlow};
        --lib-magenta: ${t.accent};
        --lib-magenta-soft: ${t.accentSoft};
        --lib-ink: ${t.ink};
        --lib-ink-mid: ${t.inkMid};
        --lib-ink-low: ${t.inkLow};
        --lib-ink-faint: ${t.inkFaint};
      }
      .lib-main-tab { color: ${t.inkMuted} !important; background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'} !important; }
      .lib-main-tab.active { background: ${t.primary} !important; color: #fff !important; }
      .library-header h1 { color: ${t.ink} !important; }
      .lib-icon-btn { color: ${t.inkMid} !important; }
      .summary-card { background: ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'} !important; }
      .summary-card h3 { color: ${t.primary} !important; }
      .summary-card p { color: ${t.inkMuted} !important; }
      .playlist-play-all-btn { background: ${t.primary} !important; }
      .playlist-shuffle-btn { border-color: ${t.primary} !important; color: ${t.primaryHi} !important; }

      /* ── BUSCA ── */
      .search-top { background: linear-gradient(180deg, ${t.bg} 0%, transparent 100%) !important; }
      .search-bar-new { background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'} !important; border-color: ${t.border} !important; }
      .search-bar-new:focus-within { border-color: ${t.primary}88 !important; background: ${t.primary}11 !important; }
      #globalSearchInput { color: ${t.ink} !important; }
      #globalSearchInput::placeholder { color: ${t.inkFaint} !important; }
      .search-icon-static { color: ${t.primaryHi} !important; }
      .search-section-header span { color: ${t.inkMid} !important; }
      .recent-search-item { color: ${t.ink} !important; background: ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'} !important; }

      /* ── PERFIL ── */
      .profile-banner { background: ${t.gradientProfile} !important; }
      .profile-avatar-wrap { border-color: ${t.bg} !important; }
      .profile-name, #profileName { color: ${t.ink} !important; }
      .profile-handle { color: ${t.inkMuted} !important; }
      .profile-bio-text { color: ${t.inkLow} !important; }
      .profile-stats-row { background: ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'} !important; border-color: ${t.border} !important; }
      .profile-stat-num { color: ${t.primaryHi} !important; }
      .profile-stat-label { color: ${t.inkMuted} !important; }
      .profile-stat-divider { background: ${t.border} !important; }
      .profile-edit-chip { border-color: ${t.primary} !important; color: ${t.primaryHi} !important; background: ${isLight ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'} !important; }
      .profile-menu { background: ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'} !important; border-color: ${t.border} !important; }
      .profile-menu-item { color: ${t.ink} !important; }
      .profile-menu-item:active { background: ${t.primary}18 !important; }
      .profile-menu-title { color: ${t.ink} !important; }
      .profile-menu-sub { color: ${t.inkMuted} !important; }
      .profile-menu-arrow { color: ${t.inkFaint} !important; }
      .profile-logout-btn { background: rgba(239,68,68,0.12) !important; color: #f87171 !important; }

      /* ── NOTIFICAÇÕES ── */
      .notifications-overlay { background: ${t.notifBg} !important; }
      .notif-header { border-bottom-color: ${t.border} !important; }
      .notif-header-icon { color: ${t.primaryUp} !important; }
      .notif-header h1 { color: ${t.ink} !important; }
      .notif-tab { color: ${t.inkMuted} !important; }
      .notif-tab.active { color: ${t.primaryHi} !important; border-bottom-color: ${t.primaryHi} !important; }
      .notif-prompt-card { background: linear-gradient(135deg, ${t.primary}33, ${t.primary}1a) !important; border-color: ${t.borderHi} !important; }
      .notif-activate-btn { background: ${t.gradient} !important; }
      .notif-close-btn { background: ${isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'} !important; color: ${t.inkMid} !important; }

      /* ── PAINEL (QUEUE SIDE) ── */
      .queue-panel { background: ${t.queueBg} !important; border-left-color: ${t.primary}40 !important; }

      /* ── ARTIST DETAIL ── */
      .artist-detail-overlay { background: ${t.bg} !important; }
      .ado-hero-gradient { background: linear-gradient(to bottom, rgba(${t.bg.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0) 0%, ${t.bg} 100%) !important; }

      /* ── TOAST ── */
      .premium-toast { background: ${t.surface} !important; color: ${t.ink} !important; }
    `;

    localStorage.setItem('fenda-theme', name);
    this.currentTheme = name;

    const modal = document.getElementById('themesModal');
    if (modal) setTimeout(() => { modal.style.display = 'none'; }, 400);
  }

  renderThemePicker() {
    return `
      <div>
        <h3 style="margin:0 0 20px;font-size:20px;font-weight:800;color:inherit">🎨 Escolha um tema</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${Object.entries(this.themes).map(([key, t]) => `
            <button onclick="fendaThemes.applyTheme('${key}')" style="
              display:flex;align-items:center;gap:10px;padding:12px;text-align:left;
              border:2px solid ${this.currentTheme === key ? t.primary : 'rgba(255,255,255,0.08)'};
              border-radius:16px;
              background:${this.currentTheme === key ? t.primary + '22' : 'rgba(255,255,255,0.04)'};
              cursor:pointer;transition:all 0.2s;
            ">
              <div style="
                width:38px;height:38px;border-radius:10px;flex-shrink:0;
                background:${t.gradient};
                display:flex;align-items:center;justify-content:center;font-size:18px;
              ">${t.emoji}</div>
              <div>
                <div style="font-size:13px;font-weight:600;color:white;line-height:1.2">${t.name}</div>
                ${this.currentTheme === key ? `<div style="font-size:11px;color:${t.primaryHi};margin-top:2px">✓ Ativo</div>` : ''}
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
}

const fendaThemes = new FendaThemes();
