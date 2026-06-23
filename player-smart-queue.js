/* ============================================================
   FENDA MUSIC — SMART QUEUE (player-smart-queue.js)
   Reprodução inteligente estilo Spotify.

   EXECUTA APÓS player-core.js.
   Faz patch em runtime de window.handleNextTrack.
   NÃO modifica nenhuma função ou variável do player-core.js.
   ============================================================

   ALGORITMO DE SCORING:
   Cada candidato recebe pontuação baseada em:
   + 100  → curtido pelo usuário (favorito)
   + 60   → mesmo artista da música atual
   + 40   → mesmo gênero (se campo existir na tabela)
   + 0-50 → proporcional à frequência de plays do usuário
   + 20   → artista diferente dos últimos tocados (variedade)
   -∞     → tocada nos últimos ~15 plays (excluída)
   -50/-150/-300 → cooldown progressivo de artista repetido

   ESTRUTURA DA FILA INTELIGENTE:
   - Top 20 candidatos pontuados, com cooldown de artista aplicado
   - Rádio: Top 30, mais focado no artista atual
   - Nunca deixa o player sem próxima música
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // GUARDA REFERÊNCIAS ORIGINAIS (safety net)
    // ============================================================
    const _origHandleNext   = window.handleNextTrack;
    const _origBuildAuto    = window.buildAutoQueue;

    // ============================================================
    // BUG FIX — buildAutoQueue com currentIdx === -1
    //
    // PROBLEMA: quando setPlayContext é chamado antes de qualquer
    // música tocar (currentMusicId = null) ou quando a música atual
    // não está na tracklist, findIndex retorna -1.
    // trackList.slice(-1 + 1) = trackList.slice(0) = LISTA INTEIRA.
    // A única música de uma playlist de 1 vai para autoQueue e é
    // tocada de novo ao terminar → repetição infinita.
    //
    // FIX: quando currentMusicId não está na tracklist, trata como
    // se a reprodução começa do índice 0 (primeira música).
    // autoQueue = tudo APÓS a primeira música.
    // Para playlist de 1 song → autoQueue = [] → sem repetição.
    // ============================================================
    window.buildAutoQueue = function buildAutoQueueFixed(currentMusicId, trackList, isShuffle) {
        if (!trackList || trackList.length === 0) return [];

        const currentIdx = trackList.findIndex(
            m => String(m.id) === String(currentMusicId)
        );

        // currentMusicId não está na tracklist → começa do índice 0
        if (currentIdx === -1) {
            const remaining = trackList.slice(1); // tudo após a 1ª música
            if (isShuffle) {
                return window.shuffleWithArtistSpread
                    ? window.shuffleWithArtistSpread(remaining, 3)
                    : [...remaining].sort(() => Math.random() - 0.5);
            }
            return remaining;
        }

        // currentMusicId está na tracklist → comportamento original
        return _origBuildAuto.call(this, currentMusicId, trackList, isShuffle);
    };

    // ============================================================
    // HELPERS INTERNOS
    // ============================================================

    /** Lê playCounts do localStorage (mesmo objeto que player-core usa) */
    function _getPlayCounts() {
        try { return JSON.parse(localStorage.getItem('play_counts') || '{}'); }
        catch { return {}; }
    }

    /** IDs tocados recentemente (últimos N do AppState.history) */
    function _recentIds(n = 15) {
        return new Set(
            (window.AppState?.history || [])
                .slice(0, n)
                .map(h => String(h.id ?? h.trackId ?? ''))
                .filter(Boolean)
        );
    }

    /** Últimos N artistas tocados (do histórico real) */
    function _recentArtists(n = 4) {
        const history = window.AppState?.history || [];
        const musics  = window.AppState?.musics  || [];
        return history.slice(0, n).map(h => {
            const m = musics.find(m => String(m.id) === String(h.id ?? h.trackId));
            return m?.artist || h.artist || '';
        }).filter(Boolean);
    }

    // ============================================================
    // SISTEMA DE SCORING
    // ============================================================

    /**
     * Pontua um candidato em relação ao contexto atual.
     * Retorna -Infinity para candidatos que devem ser excluídos.
     *
     * @param {Object} candidate  - objeto de música
     * @param {Object} ctx        - contexto de pontuação
     */
    function _score(candidate, ctx) {
        const {
            currentMusic,
            recentIds,
            recentArtists,
            favorites,
            playCounts,
            maxPlayCount,
        } = ctx;

        // Exclusões absolutas
        if (String(candidate.id) === String(currentMusic.id)) return -Infinity;
        if (recentIds.has(String(candidate.id)))              return -Infinity;
        if (!candidate.src && !candidate._offlineOnly)        return -Infinity; // sem áudio

        let score = 0;

        // 1. Favorito: bonus forte
        if (favorites.has(candidate.id) || favorites.has(String(candidate.id))) {
            score += 100;
        }

        // 2. Mesmo artista da música atual: bonus moderado
        const sameArtist = candidate.artist && currentMusic.artist &&
            candidate.artist.toLowerCase().trim() === currentMusic.artist.toLowerCase().trim();
        if (sameArtist) score += 60;

        // 3. Mesmo gênero (se disponível na tabela): bonus médio
        const sameGenre = candidate.genre && currentMusic.genre &&
            candidate.genre.toLowerCase().trim() === currentMusic.genre.toLowerCase().trim();
        if (sameGenre) score += 40;

        // 4. Cooldown de artista progressivo
        //    recentArtists = últimos N artistas tocados ANTES desta fila
        const artistCount = recentArtists.filter(a =>
            a.toLowerCase().trim() === (candidate.artist || '').toLowerCase().trim()
        ).length;

        if      (artistCount >= 3) score -= 300; // bloqueia quase que totalmente
        else if (artistCount === 2) score -= 150;
        else if (artistCount === 1) score -= 50;

        // 5. Frequência de plays: 0–50 pontos
        const plays    = parseInt(playCounts[String(candidate.id)] || 0);
        const playBonus = maxPlayCount > 0 ? (plays / maxPlayCount) * 50 : 0;
        score += playBonus;

        // 6. Variedade: bonus se artista diferente do último tocado
        if (recentArtists.length > 0) {
            const lastArtist = recentArtists[0];
            if (candidate.artist &&
                candidate.artist.toLowerCase().trim() !== lastArtist.toLowerCase().trim()) {
                score += 20;
            }
        }

        // 7. Ruído pequeno para variedade (±12) — evita ties exatos
        score += (Math.random() * 24) - 12;

        return score;
    }

    // ============================================================
    // CONSTRUTOR DA FILA INTELIGENTE
    // ============================================================

    /**
     * Gera uma fila ordenada por relevância, com cooldown de artista aplicado.
     *
     * @param {Object} currentMusic  - música atualmente tocando
     * @param {Object} [opts]
     * @param {number} [opts.size=20]              - tamanho máximo da fila
     * @param {number} [opts.maxSameArtistInQueue=2] - máx. ocorrências do mesmo artista na fila
     * @param {boolean} [opts.radioMode=false]     - rádio: mais foco no artista atual
     * @returns {Array} array de objetos de música
     */
    function buildSmartQueue(currentMusic, opts = {}) {
        const {
            size               = 20,
            maxSameArtistInQueue = 2,
            radioMode          = false,
        } = opts;

        const musics = window.AppState?.musics || [];
        if (!currentMusic || musics.length === 0) return [];

        const playCounts   = _getPlayCounts();
        const allCounts    = Object.values(playCounts).map(Number).filter(n => n > 0);
        const maxPlayCount = allCounts.length ? Math.max(...allCounts) : 1;
        const recentIds    = _recentIds(15);
        const recentArts   = _recentArtists(4);
        const favorites    = window.AppState?.favorites || new Set();

        const ctx = {
            currentMusic,
            recentIds,
            recentArtists: recentArts,
            favorites,
            playCounts,
            maxPlayCount,
        };

        // Pontua todos os candidatos
        const scored = musics
            .map(m => ({ music: m, score: _score(m, ctx) }))
            .filter(({ score }) => isFinite(score))
            .sort((a, b) => b.score - a.score);

        // Monta fila respeitando cooldown dentro da própria fila
        const queue        = [];
        const queueArtists = [];

        for (const { music } of scored) {
            if (queue.length >= size) break;

            // Conta quantas vezes este artista já aparece na fila
            const inQueueCount = queueArtists.filter(a =>
                a.toLowerCase().trim() === (music.artist || '').toLowerCase().trim()
            ).length;

            // No modo rádio permite um pouco mais do mesmo artista
            const limit = radioMode ? maxSameArtistInQueue + 1 : maxSameArtistInQueue;
            if (inQueueCount >= limit) continue;

            queue.push(music);
            queueArtists.push(music.artist || '');
        }

        // Fallback: se ficou vazio (biblioteca muito pequena), pega qualquer um
        if (queue.length === 0) {
            return musics
                .filter(m => String(m.id) !== String(currentMusic.id))
                .sort(() => Math.random() - 0.5)
                .slice(0, size);
        }

        return queue;
    }

    // ============================================================
    // RÁDIO DA MÚSICA
    // ============================================================

    /**
     * Gera uma fila de rádio baseada na música atual:
     * prioriza mesmo artista e músicas bem pontuadas.
     * Substitui a autoQueue e atualiza o contexto.
     *
     * @param {Object} [music] - música base (usa currentMusic se omitido)
     */
    function generateRadio(music) {
        if (!music) {
            const id = window.AppState?.currentMusicId;
            music = (window.AppState?.musics || []).find(m => m.id === id);
        }
        if (!music) {
            window.showToast?.('Nenhuma música tocando para gerar rádio', 'danger');
            return;
        }

        const radioQueue = buildSmartQueue(music, {
            size: 30,
            maxSameArtistInQueue: 3,
            radioMode: true,
        });

        window.AppState.autoQueue = radioQueue;
        window.AppState.playContext = {
            source: 'radio',
            playlistId: null,
            trackList: [music, ...radioQueue],
        };

        if (typeof window.renderQueuePanel === 'function') window.renderQueuePanel();
        window.showToast?.(`Rádio: ${music.artist || music.title}`, 'success');
        console.log('[SmartQueue] Rádio gerado:', radioQueue.length, 'músicas');
    }

    // ============================================================
    // PATCH DO handleNextTrack
    // Substitui APENAS o passo 4 (autoplay).
    // Passos 1-3 são copiados do original e permanecem idênticos.
    // ============================================================

    window.handleNextTrack = function handleNextTrackSmart() {
        const AppState = window.AppState;
        if (!AppState) { _origHandleNext?.(); return; }

        // ── PASSO 1: Fila manual (preservado idêntico) ──────────────
        if (AppState.queue.length > 0) {
            const next = AppState.queue.shift();
            if (typeof window.renderQueue    === 'function') window.renderQueue();
            if (typeof window.renderQueuePanel === 'function') window.renderQueuePanel();
            window.playMusicTrack(next);
            return;
        }

        // ── PASSO 2: autoQueue (preservado idêntico) ────────────────
        if (AppState.autoQueue.length > 0) {
            const next = AppState.autoQueue.shift();
            window.playMusicTrack(next);
            return;
        }

        // ── PASSO 3: repeat-all (preservado idêntico) ───────────────
        if (AppState.repeatMode === 1) {
            const { trackList } = AppState.playContext;
            const list = trackList?.length > 0 ? trackList : AppState.musics;
            AppState.autoQueue = window.buildAutoQueue(
                AppState.currentMusicId, list, AppState.isShuffle
            );
            if (AppState.autoQueue.length > 0) {
                window.playMusicTrack(AppState.autoQueue.shift());
            }
            return;
        }

        // ── PASSO 4: AUTOPLAY INTELIGENTE (substituído) ─────────────
        if (AppState.musics.length === 0) return;

        const currentMusic = AppState.musics.find(
            m => m.id === AppState.currentMusicId
        );

        // Se não achou a música atual, cai no original como segurança
        if (!currentMusic) {
            console.warn('[SmartQueue] currentMusic não encontrado, usando fallback original');
            _origHandleNext?.();
            return;
        }

        const smartQueue = buildSmartQueue(currentMusic, { size: 20 });

        if (smartQueue.length === 0) {
            // Último fallback: qualquer música diferente da atual
            const fallback = AppState.musics.filter(
                m => String(m.id) !== String(AppState.currentMusicId)
            );
            if (fallback.length > 0) {
                const pick = fallback[Math.floor(Math.random() * fallback.length)];
                window.playMusicTrack(pick);
            }
            return;
        }

        // Pega a primeira (melhor score), o resto vai pra autoQueue
        const [next, ...rest] = smartQueue;
        AppState.autoQueue = rest;
        AppState.playContext = {
            source: 'autoplay',
            playlistId: null,
            trackList: smartQueue,
        };

        if (typeof window.renderQueuePanel === 'function') window.renderQueuePanel();

        window.playMusicTrack(next);
    };

    // ============================================================
    // SHUFFLE MELHORADO
    // Substitui _shuffleSpread interno expondo uma versão mais robusta.
    // Garante que o mesmo artista não apareça nas próximas N posições.
    // ============================================================

    /**
     * Embaralhamento com distribuição garantida de artistas.
     * Múltiplas passagens até atingir distância mínima entre artistas iguais.
     *
     * @param {Array}  tracks          - array de músicas
     * @param {number} [minDistance=3] - distância mínima entre mesmo artista
     * @returns {Array}
     */
    function shuffleWithArtistSpread(tracks, minDistance = 3) {
        if (tracks.length <= 1) return [...tracks];

        // Fisher-Yates
        const arr = [...tracks];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }

        // Múltiplas passagens para separar artistas
        const MAX_PASSES = 5;
        for (let pass = 0; pass < MAX_PASSES; pass++) {
            let improved = false;
            for (let i = 0; i < arr.length; i++) {
                const artist = (arr[i]?.artist || '').toLowerCase().trim();
                if (!artist) continue;

                // Verifica se há conflito dentro da janela minDistance
                let conflict = false;
                for (let d = 1; d <= minDistance && i + d < arr.length; d++) {
                    if ((arr[i + d]?.artist || '').toLowerCase().trim() === artist) {
                        conflict = true;
                        break;
                    }
                }

                if (!conflict) continue;

                // Tenta trocar com uma posição além da janela
                for (let j = i + minDistance + 1; j < arr.length; j++) {
                    const targetArtist = (arr[j]?.artist || '').toLowerCase().trim();
                    if (targetArtist === artist) continue;

                    // Verifica se a troca não cria outro conflito
                    let newConflict = false;
                    for (let d = 1; d <= minDistance; d++) {
                        const prev = i - d >= 0 ? (arr[i - d]?.artist || '').toLowerCase().trim() : '';
                        const next = i + d < arr.length && i + d !== j
                            ? (arr[i + d]?.artist || '').toLowerCase().trim() : '';
                        if (prev === targetArtist || next === targetArtist) {
                            newConflict = true;
                            break;
                        }
                    }

                    if (!newConflict) {
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                        improved = true;
                        break;
                    }
                }
            }
            if (!improved) break; // converged
        }

        return arr;
    }

    // ============================================================
    // EXPOSIÇÕES GLOBAIS
    // ============================================================

    window.buildSmartQueue         = buildSmartQueue;
    window.generateRadio           = generateRadio;
    window.shuffleWithArtistSpread = shuffleWithArtistSpread;

    // Debug helper
    window.__smartQueue = {
        buildSmartQueue,
        generateRadio,
        score: _score,
        getPlayCounts: _getPlayCounts,
        recentIds: _recentIds,
        recentArtists: _recentArtists,
        diagnose() {
            const current = (window.AppState?.musics || [])
                .find(m => m.id === window.AppState?.currentMusicId);
            console.log('[SmartQueue] Música atual:', current?.title);
            console.log('[SmartQueue] Artistas recentes:', _recentArtists(4));
            console.log('[SmartQueue] IDs recentes:', [..._recentIds(15)].slice(0, 5));
            console.log('[SmartQueue] Favoritos:', window.AppState?.favorites?.size);
            console.log('[SmartQueue] autoQueue length:', window.AppState?.autoQueue?.length);
            if (current) {
                const q = buildSmartQueue(current, { size: 5 });
                console.log('[SmartQueue] Próximas 5 sugeridas:', q.map(m => `${m.title} (${m.artist})`));
            }
        }
    };

    console.log('[SmartQueue] ✅ Reprodução inteligente ativada');

})();
