// stats.js - Wrapped estilo Spotify

class FendaStats {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.userId = null;
  }

  async init(userId) {
    this.userId = userId;
  }

  async getYearStats() {
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1).toISOString();

    try {
      const { data: history } = await this.supabase
        .from('history')
        .select('music_id, artist, title, created_at')
        .gte('created_at', startOfYear);

      if (!history || history.length === 0) return this.getEmptyStats();

      return {
        totalSongs: history.length,
        uniqueSongs: new Set(history.map(h => h.music_id)).size,
        topArtists: this.getTopArtists(history),
        listeningStreak: this.calculateStreak(history),
        favoriteDayOfWeek: this.getFavoriteDayOfWeek(history),
        totalMinutes: Math.round(history.length * 3.5),
        mostActiveMonth: this.getMostActiveMonth(history),
        year,
      };
    } catch (e) {
      return this.getEmptyStats();
    }
  }

  getTopArtists(history, limit = 5) {
    const artists = {};
    history.forEach(h => { if(h.artist) artists[h.artist] = (artists[h.artist] || 0) + 1; });
    return Object.entries(artists).sort((a,b) => b[1]-a[1]).slice(0,limit).map(([name,count]) => ({name,count}));
  }

  calculateStreak(history) {
    const dates = [...new Set(history.map(h => new Date(h.created_at).toDateString()))].sort();
    let max = 1, cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]) - new Date(dates[i-1])) / 86400000;
      if (diff === 1) { cur++; max = Math.max(max, cur); } else cur = 1;
    }
    return max;
  }

  getFavoriteDayOfWeek(history) {
    const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    const count = Array(7).fill(0);
    history.forEach(h => count[new Date(h.created_at).getDay()]++);
    return days[count.indexOf(Math.max(...count))];
  }

  getMostActiveMonth(history) {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const count = Array(12).fill(0);
    history.forEach(h => count[new Date(h.created_at).getMonth()]++);
    return months[count.indexOf(Math.max(...count))];
  }

  getEmptyStats() {
    return { totalSongs:0, uniqueSongs:0, topArtists:[], listeningStreak:0, favoriteDayOfWeek:'-', totalMinutes:0, mostActiveMonth:'-', year: new Date().getFullYear() };
  }

  renderWrapped(stats) {
    const hours = Math.floor(stats.totalMinutes / 60);
    const mins = stats.totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];

    return `
      <div style="color:white">
        <!-- Header gradiente -->
        <div style="
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          margin: -24px -24px 24px;
          padding: 32px 24px 28px;
          border-radius: 20px 20px 0 0;
          text-align: center;
        ">
          <div style="font-size:40px;margin-bottom:8px">🎵</div>
          <h2 style="margin:0;font-size:22px;font-weight:800">Seu ${stats.year} em música</h2>
          <p style="margin:6px 0 0;opacity:0.85;font-size:14px">Fenda Music Wrapped</p>
        </div>

        <!-- Cards de números -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
          <div style="background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);border-radius:16px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:800;color:#a855f7">${stats.totalSongs}</div>
            <div style="font-size:12px;opacity:0.7;margin-top:4px">músicas tocadas</div>
          </div>
          <div style="background:rgba(236,72,153,0.15);border:1px solid rgba(236,72,153,0.3);border-radius:16px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:800;color:#ec4899">${timeStr}</div>
            <div style="font-size:12px;opacity:0.7;margin-top:4px">de escuta</div>
          </div>
          <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:16px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:800;color:#10b981">${stats.listeningStreak}</div>
            <div style="font-size:12px;opacity:0.7;margin-top:4px">dias seguidos</div>
          </div>
          <div style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);border-radius:16px;padding:16px;text-align:center">
            <div style="font-size:32px;font-weight:800;color:#f59e0b">${stats.uniqueSongs}</div>
            <div style="font-size:12px;opacity:0.7;margin-top:4px">músicas únicas</div>
          </div>
        </div>

        <!-- Top Artistas -->
        ${stats.topArtists.length > 0 ? `
        <div style="background:rgba(255,255,255,0.04);border-radius:16px;padding:16px;margin-bottom:16px">
          <h3 style="margin:0 0 14px;font-size:15px;font-weight:700">🎤 Seus top artistas</h3>
          ${stats.topArtists.map((a,i) => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;${i < stats.topArtists.length-1 ? 'border-bottom:1px solid rgba(255,255,255,0.06)' : ''}">
              <span style="font-size:20px;width:28px;text-align:center">${medals[i]}</span>
              <span style="flex:1;font-weight:${i===0?'700':'500'};font-size:${i===0?'16px':'14px'}">${a.name}</span>
              <span style="font-size:12px;opacity:0.6;background:rgba(255,255,255,0.06);padding:4px 10px;border-radius:20px">${a.count} plays</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Dia e mês favoritos -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
          <div style="background:rgba(255,255,255,0.04);border-radius:16px;padding:16px;text-align:center">
            <div style="font-size:24px;margin-bottom:6px">📅</div>
            <div style="font-size:16px;font-weight:700">${stats.favoriteDayOfWeek}</div>
            <div style="font-size:11px;opacity:0.6;margin-top:4px">dia favorito</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:16px;padding:16px;text-align:center">
            <div style="font-size:24px;margin-bottom:6px">🔥</div>
            <div style="font-size:16px;font-weight:700">${stats.mostActiveMonth}</div>
            <div style="font-size:11px;opacity:0.6;margin-top:4px">mês mais ativo</div>
          </div>
        </div>

        <!-- Botão compartilhar -->
        <button onclick="fendaStats.shareWrapped()" style="
          width:100%;
          background:linear-gradient(135deg,#7c3aed,#ec4899);
          border:none;border-radius:40px;
          padding:15px;color:white;
          font-size:15px;font-weight:700;
          cursor:pointer;margin-bottom:12px;
        ">🔗 Compartilhar meu Wrapped</button>
      </div>
    `;
  }

  shareWrapped() {
    const year = new Date().getFullYear();
    const text = `🎵 Meu ${year} no Fenda Music! Ouvi muito essa ano. Confira: fendamusic.com.br`;
    if (navigator.share) {
      navigator.share({ title: `Meu Wrapped ${year}`, text, url: 'https://fendamusic.com.br' }).catch(()=>{});
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Copiado! Cole nas suas redes.'));
    }
  }
}

const fendaStats = new FendaStats(supabase);
