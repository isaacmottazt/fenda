// themes.js - Sistema de temas SEM quebrar o CSS existente

class FendaThemes {
  constructor() {
    this.currentTheme = localStorage.getItem('fenda-theme') || 'default';
    this.themes = {
      'default': {
        name: 'Roxo Fenda',
        emoji: '💜',
        primary: '#7c3aed',
        secondary: '#a855f7',
        accent: '#ec4899',
        gradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      },
      'blue': {
        name: 'Azul Noturno',
        emoji: '🔵',
        primary: '#3b82f6',
        secondary: '#60a5fa',
        accent: '#06b6d4',
        gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
      },
      'green': {
        name: 'Verde Esmeralda',
        emoji: '💚',
        primary: '#10b981',
        secondary: '#34d399',
        accent: '#f59e0b',
        gradient: 'linear-gradient(135deg, #10b981, #f59e0b)',
      },
      'pink': {
        name: 'Rosa Neon',
        emoji: '🩷',
        primary: '#ec4899',
        secondary: '#f472b6',
        accent: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
      },
      'red': {
        name: 'Vermelho Fogo',
        emoji: '🔴',
        primary: '#ef4444',
        secondary: '#f87171',
        accent: '#fbbf24',
        gradient: 'linear-gradient(135deg, #ef4444, #fbbf24)',
      },
      'orange': {
        name: 'Laranja Sunset',
        emoji: '🟠',
        primary: '#f97316',
        secondary: '#fb923c',
        accent: '#eab308',
        gradient: 'linear-gradient(135deg, #f97316, #eab308)',
      },
      'oled': {
        name: 'OLED Black',
        emoji: '⚫',
        primary: '#9333ea',
        secondary: '#a855f7',
        accent: '#ec4899',
        gradient: 'linear-gradient(135deg, #9333ea, #ec4899)',
      },
    };
    this.init();
  }

  init() {
    this.injectBaseCSS();
    this.applyTheme(this.currentTheme);
  }

  injectBaseCSS() {
    const style = document.createElement('style');
    style.id = 'fenda-theme-style';
    style.textContent = `
      :root {
        --theme-primary: #7c3aed;
        --theme-secondary: #a855f7;
        --theme-accent: #ec4899;
        --theme-gradient: linear-gradient(135deg, #7c3aed, #ec4899);
      }
    `;
    document.head.appendChild(style);
  }

  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    const style = document.getElementById('fenda-theme-style');
    if (style) {
      style.textContent = `
        :root {
          --theme-primary: ${theme.primary};
          --theme-secondary: ${theme.secondary};
          --theme-accent: ${theme.accent};
          --theme-gradient: ${theme.gradient};
        }

        /* Aplicar apenas em elementos de destaque */
        .nav-btn.active p,
        .nav-btn.active span { color: ${theme.primary} !important; }
        .featured-play-btn { background: ${theme.primary} !important; }
        .playlist-play-all-btn { background: ${theme.primary} !important; }
        .ctrl-play { background: ${theme.primary} !important; }
        .profile-stat-num { color: ${theme.primary} !important; }
        .lib-main-tab.active { 
          background: ${theme.primary} !important;
          color: white !important;
        }
        .player-seek-fill { background: ${theme.primary} !important; }
        .player-seek-thumb { background: ${theme.primary} !important; }
        .profile-banner { background: ${theme.gradient} !important; }
        .mini-ctrl-play { background: ${theme.primary} !important; }
        .notif-activate-btn { background: ${theme.primary} !important; }
        .profile-edit-chip { border-color: ${theme.primary} !important; color: ${theme.primary} !important; }
        a { color: ${theme.primary} !important; }
      `;
    }

    localStorage.setItem('fenda-theme', themeName);
    this.currentTheme = themeName;

    // Fechar modal após aplicar
    const modal = document.getElementById('themesModal');
    if (modal) {
      setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
  }

  renderThemePicker() {
    return `
      <div style="padding:8px 0">
        <h3 style="margin:0 0 20px;font-size:20px;font-weight:700">🎨 Temas</h3>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
          ${Object.entries(this.themes).map(([key, theme]) => `
            <button
              onclick="fendaThemes.applyTheme('${key}')"
              style="
                display:flex;
                align-items:center;
                gap:12px;
                padding:14px;
                border:2px solid ${this.currentTheme === key ? theme.primary : 'rgba(255,255,255,0.08)'};
                border-radius:16px;
                background:${this.currentTheme === key ? `${theme.primary}22` : 'rgba(255,255,255,0.04)'};
                cursor:pointer;
                text-align:left;
                transition:all 0.2s;
              "
            >
              <div style="
                width:40px;height:40px;border-radius:12px;
                background:${theme.gradient};
                flex-shrink:0;
                display:flex;align-items:center;justify-content:center;
                font-size:18px;
              ">${theme.emoji}</div>
              <div>
                <div style="font-size:13px;font-weight:600;color:white">${theme.name}</div>
                ${this.currentTheme === key ? `<div style="font-size:11px;color:${theme.primary};margin-top:2px">✓ Ativo</div>` : ''}
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
}

const fendaThemes = new FendaThemes();
