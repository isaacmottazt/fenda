// ===== INTERFACE DAS NOVAS ABAS (player-ui.js completo) =====

function updateFeaturedMusic() {
    if (!AppState.musics.length) return;
    const music = AppState.musics[Math.floor(Math.random() * AppState.musics.length)];

    const titleEl = document.getElementById('featuredTitle');
    const artistEl = document.getElementById('featuredArtist');
    const bg = document.getElementById('featuredBg');
    const banner = document.getElementById('featuredBanner');

    if (titleEl) titleEl.innerText = music.title;
    if (artistEl) artistEl.innerText = music.artist;

    // Fundo com capa da música
    if (bg && music.cover) {
        bg.style.backgroundImage = `url(${music.cover})`;
        bg.style.backgroundSize = 'cover';
        bg.style.backgroundPosition = 'center';
    }

    // Botão play
    const featuredBtn = document.getElementById('featuredPlayBtn');
    if (featuredBtn) {
        const newBtn = featuredBtn.cloneNode(true);
        featuredBtn.parentNode.replaceChild(newBtn, featuredBtn);
        newBtn.addEventListener('click', (e) => { e.stopPropagation(); playMusicTrack(music); });
    }

    // Clique no banner
    if (banner) {
        banner._featuredMusic = music;
        if (!banner._listenerAdded) {
            banner._listenerAdded = true;
            banner.addEventListener('click', () => {
                if (banner._featuredMusic) playMusicTrack(banner._featuredMusic);
            });
        }
    }
}

function renderHome() {
    // Recomendação do dia — atualiza a cada 10 minutos
    if (!window._featuredTimer) {
        window._featuredTimer = setInterval(() => updateFeaturedMusic(), 10 * 60 * 1000);
    }
    updateFeaturedMusic();

    const recentContainer = document.getElementById('recentlyPlayedList');
    if (recentContainer) {
        // Mostra as últimas 20 músicas ouvidas (carrossel horizontal)
        const recentMusics = AppState.history.slice(0, 20).map(item => AppState.musics.find(m => m.id === item.id)).filter(m => m);
        recentContainer.innerHTML = recentMusics.map(music => `
            <div class="music-card-horizontal" data-id="${music.id}">
                <img src="${sanitizeUrl(music.cover)}" loading="lazy">
                <h4>${escapeHtml(music.title)}</h4>
                <p>${escapeHtml(music.artist)}</p>
            </div>
        `).join('');
        document.querySelectorAll('#recentlyPlayedList .music-card-horizontal').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const music = AppState.musics.find(m => m.id === id);
                if (music) {
                    if (typeof window.setPlayContext === 'function')
                        window.setPlayContext('history', recentMusics);
                    playMusicTrack(music);
                }
            });
        });
    }

    const favArtistsContainer = document.getElementById('favoriteArtistsList');
    if (favArtistsContainer) {
        // Usa contagem de plays (playCounts) para os 3 artistas mais ouvidos
        const artistPlays = new Map();
        AppState.musics.forEach(m => {
            const plays = playCounts[m.id] || 0;
            if (plays > 0) {
                artistPlays.set(m.artist, (artistPlays.get(m.artist) || 0) + plays);
            }
        });
        // Fallback: se não há plays, usa favoritos
        if (artistPlays.size === 0) {
            const favMusics = AppState.musics.filter(m => AppState.favorites.has(m.id));
            favMusics.forEach(m => artistPlays.set(m.artist, (artistPlays.get(m.artist) || 0) + 1));
        }
        const topArtists = Array.from(artistPlays.entries())
            .sort((a,b) => b[1] - a[1])
            .slice(0, 3)
            .map(([artist, plays]) => ({ artist, plays }));

        if (!topArtists.length) {
            favArtistsContainer.innerHTML = `<div class="empty-state" style="background:none;padding:20px 0;"><span class="material-symbols-rounded">person</span><p style="font-size:13px;">Ouça músicas para ver seus artistas</p></div>`;
        } else {
            favArtistsContainer.innerHTML = topArtists.map(({ artist, plays }) => {
                const cover = AppState.musics.find(m => m.artist === artist)?.cover || '';
                const playsText = plays === 1 ? '1 play' : `${plays} plays`;
                return `
                    <div class="artist-card" data-artist="${escapeHtml(artist)}">
                        <div class="artist-avatar">
                            ${cover ? `<img src="${sanitizeUrl(cover)}" onerror="this.style.display='none'" loading="lazy">` : ''}
                            <span class="material-symbols-rounded" ${cover ? 'style="display:none"' : ''}>person</span>
                        </div>
                        <p>${escapeHtml(artist)}</p>
                        <span class="artist-card-plays">${playsText}</span>
                    </div>
                `;
            }).join('');
        }
        document.querySelectorAll('.artist-card').forEach(card => {
            card.addEventListener('click', () => {
                const artist = card.dataset.artist;
                if (typeof window.openArtistDetail === 'function') {
                    window.openArtistDetail(artist);
                } else {
                    const artistMusics = AppState.musics.filter(m => m.artist === artist);
                    if (artistMusics.length) playMusicTrack(artistMusics[0]);
                }
            });
        });
    }

    const popPlaylistsContainer = document.getElementById('popularPlaylistsList');
    if (popPlaylistsContainer) {
        // 10 últimas músicas adicionadas
        const newest = [...AppState.musics]
            .sort((a, b) => {
                if (a.created_at && b.created_at)
                    return new Date(b.created_at) - new Date(a.created_at);
                return (b.id || 0) - (a.id || 0);
            })
            .slice(0, 10);

        // Estrutura de carrossel
        popPlaylistsContainer.className = 'carousel-container';
        popPlaylistsContainer.innerHTML = `
            <div class="carousel-track" id="newestCarouselTrack">
                ${newest.map(music => `
                    <div class="music-card-horizontal newest-card" data-id="${music.id}">
                        <img src="${sanitizeUrl(music.cover)}" loading="lazy">
                        <h4>${escapeHtml(music.title)}</h4>
                        <p>${escapeHtml(music.artist)}</p>
                    </div>
                `).join('')}
            </div>
        `;

        // Clique nos cards
        popPlaylistsContainer.querySelectorAll('.newest-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const music = AppState.musics.find(m => m.id === id);
                if (music) playMusicTrack(music);
            });
        });

        // Arrastar com mouse (desktop)
        const track = document.getElementById('newestCarouselTrack');
        if (track) {
            let isDown = false, startX = 0, scrollLeft = 0;
            track.addEventListener('mousedown', e => {
                isDown = true;
                startX = e.pageX - track.offsetLeft;
                scrollLeft = track.scrollLeft;
            });
            track.addEventListener('mouseleave', () => isDown = false);
            track.addEventListener('mouseup', () => isDown = false);
            track.addEventListener('mousemove', e => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - track.offsetLeft;
                track.scrollLeft = scrollLeft - (x - startX);
            });
        }
    }

    // ========== BOTÕES "VER TUDO/VER TODOS" ==========
    const seeAllRecent = document.getElementById('seeAllRecent');
    if (seeAllRecent) {
        seeAllRecent.addEventListener('click', () => {
            const bibliotecaNavBtn = document.querySelector('.nav-btn[data-tab="biblioteca"]');
            if (bibliotecaNavBtn) {
                bibliotecaNavBtn.click();
                setTimeout(() => {
                    const historyTab = document.querySelector('.lib-main-tab[data-filter="history"]');
                    if (historyTab) historyTab.click();
                    else showToast("Aba 'Histórico' não encontrada", "info");
                }, 200);
            } else {
                showToast("Aba 'Biblioteca' não encontrada", "danger");
            }
        });
    }

    const seeAllArtists = document.getElementById('seeAllArtists');
    if (seeAllArtists) {
        seeAllArtists.addEventListener('click', () => {
            const bibliotecaNavBtn = document.querySelector('.nav-btn[data-tab="biblioteca"]');
            if (bibliotecaNavBtn) {
                bibliotecaNavBtn.click();
                setTimeout(() => {
                    const artistsTab = document.querySelector('.lib-main-tab[data-filter="artists"]');
                    if (artistsTab) artistsTab.click();
                    else showToast("Aba 'Artistas' não encontrada", "info");
                }, 200);
            } else {
                showToast("Aba 'Biblioteca' não encontrada", "danger");
            }
        });
    }

    const seeAllNewest = document.getElementById('seeAllNewest');
    if (seeAllNewest) {
        seeAllNewest.addEventListener('click', () => {
            const bibliotecaNavBtn = document.querySelector('.nav-btn[data-tab="biblioteca"]');
            if (bibliotecaNavBtn) {
                bibliotecaNavBtn.click();
                setTimeout(() => {
                    const playlistsTab = document.querySelector('.lib-main-tab[data-filter="playlists"]');
                    if (playlistsTab) playlistsTab.click();
                    else showToast("Aba 'Playlists' não encontrada", "info");
                }, 200);
            } else {
                showToast("Aba 'Biblioteca' não encontrada", "danger");
            }
        });
    }
}

// ========== ARTISTAS: estado de ordenação e favoritos ==========
let artistsSortMode = 'recent'; // 'recent' (mais ouvidos / padrão) | 'az'
function _favArtists() {
    try { return JSON.parse(localStorage.getItem('fenda_fav_artists') || '[]'); }
    catch { return []; }
}
function _isFavArtist(name) { return _favArtists().includes(name); }
function _toggleFavArtist(name) {
    const list = _favArtists();
    const idx = list.indexOf(name);
    if (idx >= 0) list.splice(idx, 1); else list.unshift(name);
    localStorage.setItem('fenda_fav_artists', JSON.stringify(list));
    return idx < 0; // true = acabou de favoritar
}

// ========== RENDERIZA GRID DE ARTISTAS (BANCO DE DADOS) ==========
async function renderArtistsGrid() {
    const grid = document.getElementById('artistsGrid');
    if (!grid) return;

    // ── Sempre constrói a lista a partir das músicas do catálogo ─────────────
    // Bug anterior: usava AppState.artists (tabela Supabase) como fonte primária,
    // ignorando artistas que não estavam cadastrados na tabela — ficavam invisíveis.
    // Fix: extrai TODOS os artistas de AppState.musics e enriquece com dados
    // da tabela artists (bio, imagem própria, verified) quando disponível.
    const artistMap = new Map();
    AppState.musics.forEach(m => {
        if (!m.artist) return;
        if (!artistMap.has(m.artist)) {
            // Usa a capa da primeira música do artista como avatar padrão
            artistMap.set(m.artist, { name: m.artist, image_url: m.cover || '' });
        }
    });

    // Enriquece com dados do Supabase (bio, foto própria, verified)
    if (AppState.artists && AppState.artists.length) {
        AppState.artists.forEach(a => {
            if (!a.name) return;
            if (artistMap.has(a.name)) {
                // Mantém o artista já encontrado, mas atualiza com dados extras
                const base = artistMap.get(a.name);
                artistMap.set(a.name, {
                    ...base,
                    image_url: a.image_url || base.image_url, // foto própria tem prioridade
                    bio: a.bio || '',
                    verified: !!a.image_url,
                });
            } else {
                // Artista cadastrado no banco mas sem música (edge case)
                artistMap.set(a.name, a);
            }
        });
    }

    const artists = [...artistMap.values()];

    if (!artists.length) {
        grid.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">person</span><p>Nenhum artista ainda</p></div>`;
        return;
    }

    // Contagem de músicas por artista
    const trackCountByArtist = new Map();
    AppState.musics.forEach(m => {
        trackCountByArtist.set(m.artist, (trackCountByArtist.get(m.artist) || 0) + 1);
    });

    // Calcula top 3 mais ouvidos
    const artistPlays = new Map();
    AppState.musics.forEach(m => {
        const plays = (typeof playCounts !== 'undefined' ? playCounts[m.id] : 0) || 0;
        if (plays > 0) artistPlays.set(m.artist, (artistPlays.get(m.artist) || 0) + plays);
    });
    const top3 = Array.from(artistPlays.entries())
        .sort((a,b) => b[1] - a[1]).slice(0, 3)
        .map(([name, plays]) => ({ name, plays }));

    grid.innerHTML = '';

    // ── Toolbar: contagem + ordenação ──
    const toolbar = document.createElement('div');
    toolbar.className = 'artists-toolbar';
    toolbar.innerHTML = `
        <span class="artists-toolbar-count"><strong>${artists.length}</strong> artista${artists.length !== 1 ? 's' : ''}</span>
        <div class="artists-sort">
            <button class="artists-sort-btn ${artistsSortMode === 'recent' ? 'active' : ''}" data-sort="recent">Relevância</button>
            <button class="artists-sort-btn ${artistsSortMode === 'az' ? 'active' : ''}" data-sort="az">A-Z</button>
        </div>
    `;
    toolbar.querySelectorAll('.artists-sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            artistsSortMode = btn.dataset.sort;
            renderArtistsGrid();
        });
    });
    grid.appendChild(toolbar);

    // ── Top 3 mais ouvidos ──
    if (top3.length) {
        const topLabel = document.createElement('p');
        topLabel.className = 'lib-artists-top-label';
        topLabel.innerHTML = `<span class="material-symbols-rounded">local_fire_department</span> Mais ouvidos`;
        grid.appendChild(topLabel);

        const topWrap = document.createElement('div');
        topWrap.className = 'lib-artists-top';

        const rankClasses = ['gold', 'silver', 'bronze'];
        const rankIcons   = ['workspace_premium', null, null];
        const rankLabels  = ['#1', '#2', '#3'];

        top3.forEach(({ name, plays }, i) => {
            const cover = AppState.musics.find(m => m.artist === name)?.cover || '';

            const card = document.createElement('div');
            card.className = `lib-top-artist-card rank-${i + 1}`;
            if (cover) {
                card.setAttribute('data-cover', '1');
                card.style.setProperty('--lib-top-bg', `url(${cover})`);
            }

            const rankHtml = `<span class="lib-top-artist-rank ${rankClasses[i]}">${rankIcons[i] ? `<span class="material-symbols-rounded">${rankIcons[i]}</span>` : ''}${rankLabels[i]}</span>`;
            const avatarHtml = `<div class="lib-top-artist-avatar">${cover ? `<img src="${sanitizeUrl(cover)}" onerror="this.style.display='none'">` : ''}<span class="material-symbols-rounded artist-avatar-fallback">person</span></div>`;
            const playsHtml = `<span class="lib-top-artist-plays"><span class="material-symbols-rounded">play_arrow</span>${plays} plays</span>`;

            // Todos os 3 cards: layout vertical centralizado, igual
            card.innerHTML = `
                ${rankHtml}
                ${avatarHtml}
                <div class="lib-top-artist-info">
                    <span class="lib-top-artist-name">${escapeHtml(name)}</span>
                    ${playsHtml}
                </div>
            `;
            topWrap.appendChild(card);
            card.addEventListener('click', () => openArtistDetail(name));
        });

        grid.appendChild(topWrap);

        const divider = document.createElement('p');
        divider.className = 'artists-divider-label';
        divider.innerHTML = `<span class="material-symbols-rounded">people</span> Todos os artistas`;
        grid.appendChild(divider);
    }

    // ── Ordena lista completa ──
    let sortedArtists = [...artists];
    if (artistsSortMode === 'az') {
        sortedArtists.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    } else {
        // relevância: plays desc, depois alfabético
        sortedArtists.sort((a, b) => {
            const pa = artistPlays.get(a.name) || 0;
            const pb = artistPlays.get(b.name) || 0;
            if (pb !== pa) return pb - pa;
            return a.name.localeCompare(b.name, 'pt-BR');
        });
    }

    // ── Grade completa ──
    const allGrid = document.createElement('div');
    allGrid.className = 'artists-grid-lib';
    sortedArtists.forEach(a => {
        const card = document.createElement('div');
        card.className = 'artist-card-lib';
        const cover = a.image_url || AppState.musics.find(m => m.artist === a.name)?.cover || '';
        const trackCount = trackCountByArtist.get(a.name) || 0;
        card.innerHTML = `
            <div class="artist-avatar-lib">
                ${cover ? `<img src="${sanitizeUrl(cover)}" onerror="this.style.display='none'">` : ''}
                <span class="material-symbols-rounded artist-avatar-fallback">person</span>
            </div>
            <div class="artist-card-lib-info">
                <span class="artist-name-lib">${escapeHtml(a.name)}</span>
                <span class="artist-tracks-lib">${trackCount} ${trackCount === 1 ? 'música' : 'músicas'}</span>
            </div>
            <span class="artist-card-lib-arrow"><span class="material-symbols-rounded">chevron_right</span></span>
        `;
        card.addEventListener('click', () => openArtistDetail(a.name));
        allGrid.appendChild(card);
    });
    grid.appendChild(allGrid);
}

function openArtistDetail(artistName, skipPush = false) {
    const artistMusics = AppState.musics.filter(m => m.artist === artistName);
    if (!artistMusics.length) { showToast('Nenhuma música encontrada', 'danger'); return; }

    let overlay = document.getElementById('artistDetailOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'artistDetailOverlay';
        overlay.className = 'artist-detail-overlay';
        document.body.appendChild(overlay);
    }

    // Dados extras do artista cadastrado no banco (bio, image_url)
    const artistRecord = (AppState.artists || []).find(a => a.name === artistName);
    const cover = artistRecord?.image_url || artistMusics[0]?.cover || '';
    const bio = artistRecord?.bio && artistRecord.bio.trim() ? artistRecord.bio.trim() : '';
    const isVerified = !!artistRecord?.image_url;

    // Conta plays do artista e separa as faixas mais ouvidas
    const totalPlays = artistMusics.reduce((sum, m) => {
        return sum + ((typeof playCounts !== 'undefined' ? playCounts[m.id] : 0) || 0);
    }, 0);
    const playsOf = (m) => (typeof playCounts !== 'undefined' ? playCounts[m.id] : 0) || 0;
    const popularTracks = [...artistMusics].filter(m => playsOf(m) > 0).sort((a, b) => playsOf(b) - playsOf(a)).slice(0, 5);
    const popularIds = new Set(popularTracks.map(m => m.id));
    const restTracks = artistMusics.filter(m => !popularIds.has(m.id));

    const isFav = _isFavArtist(artistName);

    overlay.innerHTML = `
        <div class="ado-hero">
            <div class="ado-hero-bg" ${cover ? `style="background-image:url(${sanitizeUrl(cover)})"` : ''}></div>
            <div class="ado-hero-gradient"></div>

            <div class="ado-top-bar">
                <button class="ado-back-btn"><span class="material-symbols-rounded">arrow_back</span></button>
                <button class="ado-fav-btn${isFav ? ' is-fav' : ''}" id="artistFavBtn">
                    <span class="material-symbols-rounded${isFav ? ' filled' : ''}">favorite</span>
                </button>
            </div>

            <div class="ado-hero-content">
                <div class="ado-avatar">
                    ${cover
                        ? `<img src="${sanitizeUrl(cover)}" alt="${escapeHtml(artistName)}">`
                        : `<span class="material-symbols-rounded">person</span>`}
                </div>
                ${isVerified ? `<div class="ado-verified"><span class="material-symbols-rounded">verified</span> Artista verificado</div>` : ''}
                <h1 class="ado-name">${escapeHtml(artistName)}</h1>
                <p class="ado-meta">${artistMusics.length} ${artistMusics.length === 1 ? 'música' : 'músicas'}${totalPlays > 0 ? ` · ${totalPlays} play${totalPlays !== 1 ? 's' : ''}` : ''}</p>

                ${bio ? `
                <div class="ado-bio-wrap">
                    <p class="ado-bio clamped" id="artistBioText">${escapeHtml(bio)}</p>
                    <button class="ado-bio-toggle" id="artistBioToggle">Ver mais</button>
                </div>` : ''}
            </div>
        </div>

        <div class="ado-actions">
            <button class="ado-btn-play" id="artistPlayAll">
                <span class="material-symbols-rounded">play_arrow</span>
                Tocar tudo
            </button>
            <button class="ado-btn-shuffle" id="artistShuffle">
                <span class="material-symbols-rounded">shuffle</span>
            </button>
        </div>

        ${popularTracks.length ? `
        <div class="ado-section-label">
            <span class="material-symbols-rounded">trending_up</span> Mais tocadas
        </div>
        <div class="ado-track-list" id="artistPopularList"></div>
        <div class="ado-section-label">
            <span class="material-symbols-rounded">queue_music</span> Catálogo
        </div>` : ''}
        <div class="ado-track-list" id="artistMusicList"></div>
        <div style="height:120px"></div>
    `;
    overlay.classList.add('active');
    // Atualiza URL
    if (!skipPush && window.getUrlForState) {
        const url = window.getUrlForState({ tab: 'biblioteca', artistName });
        history.pushState({ tab: 'biblioteca', artistName }, '', url);
    }

    overlay.querySelector('.ado-back-btn').addEventListener('click', () => {
        overlay.classList.remove('active');
        if (window.getUrlForState) {
            history.pushState({ tab: 'biblioteca' }, '', '/biblioteca');
        }
    });
    overlay.querySelector('#artistPlayAll').addEventListener('click', () => {
        if (typeof window.setPlayContext === 'function') window.setPlayContext('search', artistMusics);
        playMusicTrack(artistMusics[0]);
    });
    overlay.querySelector('#artistShuffle').addEventListener('click', () => {
        AppState.isShuffle = true;
        if (typeof window.setPlayContext === 'function') window.setPlayContext('search', artistMusics);
        playMusicTrack(artistMusics[Math.floor(Math.random() * artistMusics.length)]);
    });

    // Favoritar artista
    const favBtn = overlay.querySelector('#artistFavBtn');
    if (favBtn) {
        favBtn.addEventListener('click', () => {
            const nowFav = _toggleFavArtist(artistName);
            favBtn.classList.toggle('is-fav', nowFav);
            const icon = favBtn.querySelector('.material-symbols-rounded');
            icon.classList.toggle('filled', nowFav);
            showToast(nowFav ? 'Artista favoritado' : 'Removido dos favoritos', 'success');
        });
    }

    // Bio expansível
    const bioToggle = overlay.querySelector('#artistBioToggle');
    if (bioToggle) {
        bioToggle.addEventListener('click', () => {
            const bioEl = overlay.querySelector('#artistBioText');
            const nowClamped = bioEl.classList.toggle('clamped');
            bioToggle.textContent = nowClamped ? 'Ver mais' : 'Ver menos';
        });
    }

    const renderTrackList = (container, tracks) => {
        tracks.forEach((music, idx) => {
            const isCurrent = AppState.currentMusicId === music.id;
            const item = document.createElement('div');
            item.className = `ado-track${isCurrent ? ' is-playing' : ''}`;
            item.dataset.id = music.id;
            const plays = playsOf(music);
            item.innerHTML = `
                <span class="ado-track-num">${isCurrent
                    ? '<span class="eq-bars"><span></span><span></span><span></span></span>'
                    : (idx + 1)}</span>
                ${music.cover
                    ? `<img class="ado-track-cover" src="${sanitizeUrl(music.cover)}" data-fallback="1">`
                    : `<div class="ado-track-cover-ph"><span class="material-symbols-rounded">music_note</span></div>`}
                <div class="ado-track-info">
                    <span class="ado-track-title">${escapeHtml(music.title)}</span>
                    <span class="ado-track-sub">${plays > 0 ? plays + ' plays' : escapeHtml(music.artist)}</span>
                </div>
                <button class="ado-track-more"><span class="material-symbols-rounded">more_vert</span></button>
            `;
            const coverImg = item.querySelector('.ado-track-cover[data-fallback]');
            if (coverImg) {
                coverImg.onerror = function() {
                    const ph = document.createElement('div');
                    ph.className = 'ado-track-cover-ph';
                    ph.innerHTML = '<span class="material-symbols-rounded">music_note</span>';
                    if (this.parentNode) this.parentNode.replaceChild(ph, this);
                };
            }
            item.addEventListener('click', (e) => {
                if (e.target.closest('.ado-track-more')) return;
                if (typeof window.setPlayContext === 'function') window.setPlayContext('search', artistMusics);
                playMusicTrack(music);
                overlay.querySelectorAll('.ado-track').forEach(el => el.classList.remove('is-playing'));
                item.classList.add('is-playing');
            });
            item.querySelector('.ado-track-more').addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof window.openContextMenu === 'function') window.openContextMenu(music);
            });
            container.appendChild(item);
        });
    };

    if (popularTracks.length) {
        renderTrackList(overlay.querySelector('#artistPopularList'), popularTracks);
        renderTrackList(overlay.querySelector('#artistMusicList'), restTracks);
    } else {
        renderTrackList(overlay.querySelector('#artistMusicList'), artistMusics);
    }
}
window.openArtistDetail = openArtistDetail;


function renderLibrary() {
    const favoritesCount = AppState.favorites.size;
    const recentCount = AppState.history.length;

    const rcEl = document.getElementById('recentCount');
    if (rcEl) rcEl.innerText = recentCount;
    if (window.getAllCachedMusics) {
        window.getAllCachedMusics().then(list => {
            const el = document.getElementById('downloadsCount');
            if (el) el.innerText = list.length;
        });
    }

    function rebind(id, fn) {
        const el = document.getElementById(id);
        if (!el) return;
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
        clone.addEventListener('click', fn);
    }

    rebind('libSearchBtn', () => {
        document.querySelector('.nav-btn[data-tab="buscar"]')?.click();
    });
    // libAddBtn removido (fix 5)

    // Summary cards
    const dlCard = document.querySelector('.summary-card[data-type="downloads"]');
    if (dlCard) {
        const c = dlCard.cloneNode(true);
        dlCard.parentNode.replaceChild(c, dlCard);
        c.addEventListener('click', () => document.querySelector('.lib-main-tab[data-filter="downloads"]')?.click());
    }
    const rcCard = document.querySelector('.summary-card[data-type="recent"]');
    if (rcCard) {
        const c = rcCard.cloneNode(true);
        rcCard.parentNode.replaceChild(c, rcCard);
        c.addEventListener('click', () => document.querySelector('.lib-main-tab[data-filter="history"]')?.click());
    }

    // Playlists
    const playlistsGrid = document.getElementById('playlistsGrid');
    if (playlistsGrid) {
        playlistsGrid.innerHTML = '';
        const likedItem = document.createElement('div');
        likedItem.className = 'playlist-item-modern';
        likedItem.innerHTML = `
            <div class="playlist-left">
                <div class="playlist-icon"><span class="material-symbols-rounded">favorite</span></div>
                <div class="playlist-info">
                    <h4>Curtidas</h4>
                    <p>${favoritesCount} ${favoritesCount === 1 ? 'música' : 'músicas'}</p>
                </div>
            </div>
        `;
        likedItem.addEventListener('click', () => { if (typeof window.openLikedMusicsDetail === 'function') window.openLikedMusicsDetail(); });
        playlistsGrid.appendChild(likedItem);

        (AppState.userPlaylists || []).forEach(playlist => {
            const count = playlist.musics ? playlist.musics.length : 0;
            const item = document.createElement('div');
            item.className = 'playlist-item-modern';
            item.innerHTML = `
                <div class="playlist-left">
                    <div class="playlist-icon">
                        ${playlist.cover ? `<img src="${sanitizeUrl(playlist.cover)}">` : '<span class="material-symbols-rounded">queue_music</span>'}
                    </div>
                    <div class="playlist-info">
                        <h4>${escapeHtml(playlist.name)}</h4>
                        <p>${count} ${count === 1 ? 'música' : 'músicas'}</p>
                    </div>
                </div>
                <div class="playlist-more"><span class="material-symbols-rounded">more_vert</span></div>
            `;
            // Clique em qualquer parte do item (exceto o ⋮) abre a playlist
            item.addEventListener('click', (e) => {
                if (e.target.closest('.playlist-more')) return;
                if (typeof window.openPlaylistDetail === 'function') {
                    window.openPlaylistDetail(playlist);
                } else if (typeof openPlaylistDetail === 'function') {
                    openPlaylistDetail(playlist);
                }
            });
            item.querySelector('.playlist-more').addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof window.openPlaylistContextMenu === 'function') window.openPlaylistContextMenu(playlist);
            });
            playlistsGrid.appendChild(item);
        });
    }



    // ── Histórico estilo Spotify — agrupado por data + resumo mensal ──────────
    let histSection = document.getElementById('libHistorySection');
    if (histSection) histSection.remove();
    histSection = document.createElement('div');
    histSection.id   = 'libHistorySection';
    histSection.className = 'library-section';
    histSection.style.display = 'none';

    const _history = AppState.history || [];

    // Helpers de data
    function _histDateLabel(ts) {
        if (!ts) return '';
        const now = new Date(), d = new Date(ts);
        if (d.toDateString() === now.toDateString()) return 'Hoje';
        const yest = new Date(now); yest.setDate(yest.getDate() - 1);
        if (d.toDateString() === yest.toDateString()) return 'Ontem';
        const diff = Math.floor((now - d) / 86_400_000);
        if (diff < 7) return ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'][d.getDay()];
        const mo = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        return d.getFullYear() !== now.getFullYear()
            ? `${d.getDate()} de ${mo[d.getMonth()]} de ${d.getFullYear()}`
            : `${d.getDate()} de ${mo[d.getMonth()]}`;
    }
    function _histTimeStr(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    function _fmtMin(mins) {
        if (!mins || mins <= 0) return '—';
        if (mins >= 60) { const h = Math.floor(mins/60), m = mins%60; return m > 0 ? `${h}h ${m}min` : `${h}h`; }
        return `${mins}min`;
    }

    // Resumo do mês
    const _now = new Date();
    const _moNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const _thisMo = _history.filter(h => {
        const d = new Date(h.playedAt || 0);
        return d.getMonth() === _now.getMonth() && d.getFullYear() === _now.getFullYear();
    });

    if (_thisMo.length > 0) {
        const _totalSecs   = _thisMo.reduce((a, h) => a + (h.listenedSeconds || 0), 0);
        const _totalMins   = Math.floor(_totalSecs / 60);
        const _unique      = new Set(_thisMo.map(h => h.id)).size;
        const _activeDays  = new Set(_thisMo.map(h => new Date(h.playedAt || 0).toDateString())).size;
        const _artCt = {};
        _thisMo.forEach(h => { const m = AppState.musics.find(m => m.id === h.id); if (m?.artist) _artCt[m.artist] = (_artCt[m.artist]||0)+1; });
        const _topArtist = Object.entries(_artCt).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
        const _trkCt = {};
        _thisMo.forEach(h => { _trkCt[h.id] = (_trkCt[h.id]||0)+1; });
        const _topId  = Object.entries(_trkCt).sort((a,b)=>b[1]-a[1])[0]?.[0];
        const _topMus = AppState.musics.find(m => String(m.id) === String(_topId));
        const _artCov = _topArtist ? (AppState.musics.find(m => m.artist === _topArtist)?.cover || '') : '';

        let _streak = 0;
        const _dCheck = new Date(_now);
        const _daysSet = new Set(_thisMo.map(h => new Date(h.playedAt||0).toDateString()));
        while (_daysSet.has(_dCheck.toDateString())) { _streak++; _dCheck.setDate(_dCheck.getDate()-1); }

        const _mc = document.createElement('div');
        _mc.className = 'history-month-card';
        _mc.innerHTML = `
            <div class="hmc-glow"></div>
            <div class="hmc-header">
                <span class="hmc-eyebrow"><span class="material-symbols-rounded">bar_chart</span>SEU MÊS EM RESUMO</span>
                <h3 class="hmc-month">${_moNames[_now.getMonth()]} ${_now.getFullYear()}</h3>
            </div>
            <div class="hmc-stats">
                <div class="hmc-stat"><span class="hmc-stat-value">${_fmtMin(_totalMins)}</span><span class="hmc-stat-label">escutadas</span></div>
                <div class="hmc-stat-sep"></div>
                <div class="hmc-stat"><span class="hmc-stat-value">${_unique}</span><span class="hmc-stat-label">músicas</span></div>
                <div class="hmc-stat-sep"></div>
                <div class="hmc-stat"><span class="hmc-stat-value">${_activeDays}</span><span class="hmc-stat-label">dias ativos</span></div>
            </div>
            ${_streak >= 2 ? `<div class="hmc-streak"><span class="material-symbols-rounded">local_fire_department</span><span>${_streak} dias seguidos</span></div>` : ''}
            ${_topMus || _topArtist ? `<div class="hmc-divider"></div>` : ''}
            ${_topMus ? `
            <div class="hmc-top-item" data-action="play-top">
                ${_topMus.cover ? `<img class="hmc-top-cover" src="${sanitizeUrl(_topMus.cover)}" alt="">` : `<div class="hmc-top-cover hmc-top-ph"><span class="material-symbols-rounded">music_note</span></div>`}
                <div class="hmc-top-info">
                    <span class="hmc-top-label">🎵 Música favorita</span>
                    <span class="hmc-top-name">${escapeHtml(_topMus.title)}</span>
                    <span class="hmc-top-sub">${escapeHtml(_topMus.artist||'')}</span>
                </div>
                <span class="hmc-top-plays">${_trkCt[_topId]}×</span>
            </div>` : ''}
            ${_topArtist ? `
            <div class="hmc-top-item hmc-top-item--artist" data-action="open-artist">
                ${_artCov ? `<img class="hmc-top-cover hmc-top-cover--round" src="${sanitizeUrl(_artCov)}" alt="">` : `<div class="hmc-top-cover hmc-top-cover--round hmc-top-ph"><span class="material-symbols-rounded">person</span></div>`}
                <div class="hmc-top-info">
                    <span class="hmc-top-label">🎤 Artista favorito</span>
                    <span class="hmc-top-name">${escapeHtml(_topArtist)}</span>
                    <span class="hmc-top-sub">${_artCt[_topArtist]} plays este mês</span>
                </div>
                <span class="material-symbols-rounded hmc-arrow">chevron_right</span>
            </div>` : ''}
        `;
        _mc.querySelector('[data-action="play-top"]')?.addEventListener('click', () => _topMus && playMusicTrack(_topMus));
        _mc.querySelector('[data-action="open-artist"]')?.addEventListener('click', () => {
            if (_topArtist && typeof window.openArtistDetail === 'function') window.openArtistDetail(_topArtist);
        });
        histSection.appendChild(_mc);
    }

    // Cabeçalho da lista
    const _listHeader = document.createElement('div');
    _listHeader.className = 'section-header';
    _listHeader.innerHTML = `<h2><span class="material-symbols-rounded">history</span>Histórico</h2>`;
    histSection.appendChild(_listHeader);

    // Lista agrupada por data com dedup de 30 minutos
    if (_history.length === 0) {
        const _empty = document.createElement('div');
        _empty.className = 'history-empty';
        _empty.innerHTML = `<span class="material-symbols-rounded">history</span><p>Nenhuma música ouvida ainda</p>`;
        histSection.appendChild(_empty);
    } else {
        const _listWrap = document.createElement('div');
        _listWrap.className = 'history-list';
        const _DEDUP_MS = 30 * 60 * 1000;
        const _groups   = [];
        const _dateMap  = new Map();
        _history.forEach(item => {
            const key = new Date(item.playedAt || 0).toDateString();
            if (!_dateMap.has(key)) {
                _dateMap.set(key, _groups.length);
                _groups.push({ label: _histDateLabel(item.playedAt || 0), items: [], lastSeen: new Map() });
            }
            const _group    = _groups[_dateMap.get(key)];
            const _lastTime = _group.lastSeen.get(item.id) || 0;
            if (Math.abs((item.playedAt||0) - _lastTime) > _DEDUP_MS) {
                _group.lastSeen.set(item.id, item.playedAt||0);
                _group.items.push(item);
            }
        });
        _groups.forEach(group => {
            const _dh = document.createElement('div');
            _dh.className = 'history-date-header';
            _dh.innerHTML = `<span class="hdh-line"></span><span class="hdh-label">${escapeHtml(group.label)}</span><span class="hdh-line"></span>`;
            _listWrap.appendChild(_dh);
            group.items.forEach(item => {
                const _m = AppState.musics.find(m => m.id === item.id);
                if (!_m) return;
                const _row = document.createElement('div');
                _row.className = 'history-track-row';
                const _timeStr = _histTimeStr(item.playedAt);
                const _dur = item.listenedSeconds > 0 ? `${Math.floor(item.listenedSeconds/60)}:${String(item.listenedSeconds%60).padStart(2,'0')} ouvidos` : '';
                _row.innerHTML = `
                    <img class="htr-cover" src="${sanitizeUrl(_m.cover)}" loading="lazy" alt="">
                    <div class="htr-meta">
                        <span class="htr-title">${escapeHtml(_m.title)}</span>
                        <span class="htr-artist">${escapeHtml(_m.artist||'')}</span>
                        ${_dur ? `<span class="htr-dur">${_dur}</span>` : ''}
                    </div>
                    ${_timeStr ? `<span class="htr-time">${_timeStr}</span>` : ''}
                `;
                _row.addEventListener('click', () => playMusicTrack(_m));
                _listWrap.appendChild(_row);
            });
        });
        histSection.appendChild(_listWrap);
    }
    document.getElementById('artistsSection')?.insertAdjacentElement('afterend', histSection);

    // Downloads (dinâmico)
    let dlSection = document.getElementById('libDownloadsSection');
    if (dlSection) dlSection.remove();
    dlSection = document.createElement('div');
    dlSection.id = 'libDownloadsSection';
    dlSection.className = 'library-section';
    dlSection.style.display = 'none';
    dlSection.innerHTML = '<div class="section-header"><h2>Downloads</h2></div>';
    const dlList = document.createElement('div');
    dlList.className = 'playlist-tracks-list';
    dlSection.appendChild(dlList);
    histSection.insertAdjacentElement('afterend', dlSection);

    // ── Seção "Tudo" — stats + top artistas + favoritas ─────────────────────
    let libAllSection = document.getElementById('libAllSection');
    if (libAllSection) libAllSection.remove();
    libAllSection = document.createElement('div');
    libAllSection.id = 'libAllSection';
    libAllSection.style.display = 'none';

    const _totalMusics  = AppState.musics.length;
    const _totalArtists = new Set(AppState.musics.map(m => m.artist).filter(Boolean)).size;
    const _favCount     = AppState.favorites.size;
    let   _totalPlays   = 0;
    try { const _pc = JSON.parse(localStorage.getItem('play_counts')||'{}'); _totalPlays = Object.values(_pc).reduce((a,b)=>a+Number(b),0); } catch {}

    const _artPlays = {};
    const _pcAll = (() => { try { return JSON.parse(localStorage.getItem('play_counts')||'{}'); } catch { return {}; } })();
    AppState.musics.forEach(m => { if (!m.artist) return; const p = Number(_pcAll[String(m.id)]||0); _artPlays[m.artist] = (_artPlays[m.artist]||0)+p; });
    const _topArtists3 = Object.entries(_artPlays).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([name])=>({ name, cover: AppState.musics.find(m=>m.artist===name)?.cover||'' }));

    const _favMusics = AppState.musics.filter(m => AppState.favorites.has(m.id)||AppState.favorites.has(String(m.id))).slice(0,20);

    libAllSection.innerHTML = `
        <div class="lib-all-stats">
            <div class="lib-stat-pill"><span class="material-symbols-rounded">library_music</span><span class="lib-stat-num">${_totalMusics}</span><span class="lib-stat-lbl">músicas</span></div>
            <div class="lib-stat-pill"><span class="material-symbols-rounded">person</span><span class="lib-stat-num">${_totalArtists}</span><span class="lib-stat-lbl">artistas</span></div>
            <div class="lib-stat-pill"><span class="material-symbols-rounded">favorite</span><span class="lib-stat-num">${_favCount}</span><span class="lib-stat-lbl">curtidas</span></div>
            <div class="lib-stat-pill"><span class="material-symbols-rounded">play_circle</span><span class="lib-stat-num">${_totalPlays.toLocaleString('pt-BR')}</span><span class="lib-stat-lbl">plays</span></div>
        </div>
        ${_topArtists3.length > 0 ? `
        <div class="section-header" style="margin-top:28px"><h2><span class="material-symbols-rounded">trending_up</span>Mais ouvidos</h2></div>
        <div class="lib-all-artists-row">
            ${_topArtists3.map(a=>`
                <button class="lib-all-artist-chip" data-artist="${escapeHtml(a.name)}" type="button">
                    ${a.cover?`<img src="${sanitizeUrl(a.cover)}" class="lib-all-artist-chip-img" alt="">`:`<div class="lib-all-artist-chip-img lib-all-artist-chip-ph"><span class="material-symbols-rounded">person</span></div>`}
                    <span class="lib-all-artist-chip-name">${escapeHtml(a.name)}</span>
                </button>
            `).join('')}
        </div>` : ''}
        ${_favMusics.length > 0 ? `
        <div class="section-header" style="margin-top:28px">
            <h2><span class="material-symbols-rounded">favorite</span>Curtidas</h2>
            <button class="text-btn" data-action="open-liked">Ver tudo</button>
        </div>
        <div class="lib-all-favs-carousel">
            ${_favMusics.map(m=>`
                <button class="lib-all-fav-card" data-id="${m.id}" type="button">
                    <div class="lib-all-fav-cover-wrap"><img src="${sanitizeUrl(m.cover)}" alt="${escapeHtml(m.title)}"></div>
                    <span class="lib-all-fav-title">${escapeHtml(m.title)}</span>
                    <span class="lib-all-fav-artist">${escapeHtml(m.artist||'')}</span>
                </button>
            `).join('')}
        </div>` : ''}
    `;

    libAllSection.querySelectorAll('.lib-all-artist-chip').forEach(btn=>{
        btn.addEventListener('click',()=>{ const a=btn.dataset.artist; if(a&&typeof window.openArtistDetail==='function') window.openArtistDetail(a); });
    });
    libAllSection.querySelectorAll('.lib-all-fav-card').forEach(btn=>{
        btn.addEventListener('click',()=>{ const id=Number(btn.dataset.id)||btn.dataset.id; const m=AppState.musics.find(m=>m.id===id||String(m.id)===String(id)); if(m) playMusicTrack(m); });
    });
    libAllSection.querySelector('[data-action="open-liked"]')?.addEventListener('click',()=>{ if(typeof window.openLikedMusicsDetail==='function') window.openLikedMusicsDetail(); });
    dlSection.insertAdjacentElement('afterend', libAllSection);

    // Controle de abas
    const summaryCards = document.getElementById('summaryCards');
    const playlistsSEl = document.getElementById('playlistsSection');
    const artistsSEl = document.getElementById('artistsSection');

    function showOnly(...show) {
        [summaryCards, playlistsSEl, artistsSEl, histSection, dlSection, libAllSection].forEach(el => {
            if (el) el.style.display = 'none';
        });
        show.forEach(el => {
            if (el) el.style.display = el === summaryCards ? 'grid' : 'block';
        });
    }

    function filterLibrary(filter) {
        switch (filter) {
            case 'all':      showOnly(summaryCards, playlistsSEl, libAllSection); break;
            case 'playlists': showOnly(playlistsSEl); break;
            case 'artists':  showOnly(artistsSEl); renderArtistsGrid(); break;
            case 'history':  showOnly(histSection); break;
            case 'downloads':
                showOnly(dlSection);
                if (dlList.children.length === 0 && window.getAllCachedMusics) {
                    dlList.innerHTML = '<p style="text-align:center;padding:24px;color:rgba(255,255,255,0.3)">Carregando...</p>';
                    window.getAllCachedMusics().then(async metas => {
                        dlList.innerHTML = '';
                        if (!metas.length) {
                            dlList.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded">download</span><p>Nenhuma música baixada</p></div>';
                            return;
                        }
                        for (const meta of metas) {
                            const music = AppState.musics.find(m => m.id === meta.musicId) || {
                                id: meta.musicId, title: meta.title, artist: meta.artist, cover: meta.cover, src: meta.url
                            };
                            if (typeof window.createMusicCardElement === 'function')
                                dlList.appendChild(await window.createMusicCardElement(music));
                        }
                    });
                }
                break;
        }
    }

    // Abas — remove listeners duplicados clonando os elementos
    const tabsContainer = document.querySelector('.library-main-tabs');
    if (tabsContainer) {
        const newTabs = tabsContainer.cloneNode(true);
        tabsContainer.parentNode.replaceChild(newTabs, tabsContainer);
        newTabs.querySelectorAll('.lib-main-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                newTabs.querySelectorAll('.lib-main-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                filterLibrary(tab.dataset.filter);
                // Atualiza URL
                const url = window.getUrlForState
                    ? window.getUrlForState({ tab: 'biblioteca', libFilter: tab.dataset.filter })
                    : '/biblioteca';
                history.pushState({ tab: 'biblioteca', libFilter: tab.dataset.filter }, '', url);
            });
        });
    }

    const activeTab = document.querySelector('.lib-main-tab.active');
    filterLibrary(activeTab ? activeTab.dataset.filter : 'all');
    if (!activeTab) document.querySelector('.lib-main-tab[data-filter="all"]')?.classList.add('active');
}


async function renderProfile() {
    try {
        const profile = AppState.userProfile;
        const userName = profile.full_name || 'Usuário';
        const userEmail = localStorage.getItem('user_email') || '';
        const userBio = profile.bio || 'Apaixonado por música. Vivendo uma música de cada vez.';

        const nameEl = document.getElementById('profileName');
        if (nameEl) nameEl.innerText = userName;
        const userEl = document.getElementById('profileUsername');
        if (userEl) userEl.innerText = '@' + (userEmail.split('@')[0] || 'usuario');
        const bioEl = document.getElementById('profileBio');
        if (bioEl) bioEl.innerText = userBio;

        // Avatar
        const avatarImg = document.getElementById('profileAvatarImg');
        const avatarIcon = document.getElementById('profileAvatarIcon');
        const avatarUrl = window.UserCacheDB && AppState.userId
            ? await window.UserCacheDB.getAvatarUrl(AppState.userId, profile.avatar_url)
            : profile.avatar_url;
        if (avatarUrl && avatarImg) {
            avatarImg.src = avatarUrl;
            avatarImg.style.cssText = 'display:block;width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid #0c0916;';
            if (avatarIcon) avatarIcon.style.display = 'none';
        } else {
            if (avatarImg) avatarImg.style.display = 'none';
            if (avatarIcon) avatarIcon.style.display = 'block';
        }

        // Stats
        const totalPlaylists = AppState.userPlaylists.length;
        const totalFavorites = AppState.favorites.size;
        const totalMinutes = calculateTotalMinutesListened();
        const timeDisplay = totalMinutes >= 60
            ? Math.floor(totalMinutes / 60) + 'h ' + (totalMinutes % 60) + 'min'
            : totalMinutes + ' min';
        const plEl = document.getElementById('totalPlaylists');
        if (plEl) plEl.innerText = totalPlaylists;
        const favEl = document.getElementById('totalFavorites');
        if (favEl) favEl.innerText = totalFavorites;
        const timeEl = document.getElementById('totalTimeStat');
        if (timeEl) timeEl.innerText = timeDisplay;

        function rebind(id, fn) {
            const el = document.getElementById(id);
            if (!el) return;
            const clone = el.cloneNode(true);
            el.parentNode.replaceChild(clone, el);
            clone.addEventListener('click', fn);
        }

        rebind('editProfileBtn', openEditProfileModal);
        rebind('likedSongsNavBtn', () => {
            document.querySelector('.nav-btn[data-tab="biblioteca"]')?.click();
            setTimeout(() => openLikedMusicsDetail(), 200);
        });
        rebind('recentNavBtn', () => {
            document.querySelector('.nav-btn[data-tab="biblioteca"]')?.click();
            setTimeout(() => document.querySelector('.lib-main-tab[data-filter="history"]')?.click(), 200);
        });
        rebind('downloadsNavBtn', () => {
            document.querySelector('.nav-btn[data-tab="biblioteca"]')?.click();
            setTimeout(() => document.querySelector('.lib-main-tab[data-filter="downloads"]')?.click(), 200);
        });
        rebind('settingsNavBtn', () => showToast('Configurações em breve', 'info'));
        rebind('logoutBtn', () => {
            showConfirmDialog('Sair da conta', 'Deseja realmente sair da conta?', async () => {
                try {
                    if (window.CacheDB) await window.CacheDB.clear();
                    await supabaseClient.auth.signOut();
                    localStorage.clear();
                    window.location.replace('index.html');
                } catch (err) { window.location.replace('index.html'); }
            });
        });

    } catch (err) {
        console.error('Erro no renderProfile:', err);
    }
}


function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (!modal) return;
    document.getElementById('editName').value = AppState.userProfile.full_name || '';
    document.getElementById('editEmail').value = localStorage.getItem('user_email') || '';
    document.getElementById('editBio').value = AppState.userProfile.bio || '';
    modal.classList.add('active');
}

async function saveProfileChanges() {
    const newName = document.getElementById('editName').value.trim();
    const newEmail = document.getElementById('editEmail').value.trim();
    const newBio = document.getElementById('editBio').value.trim();
    const avatarFile = document.getElementById('editAvatar').files[0];

    if (!newName || !newEmail) {
        showToast('Nome e e-mail são obrigatórios', 'danger');
        return;
    }

    let avatarUrl = AppState.userProfile.avatar_url;
    if (avatarFile) {
        const uploaded = await window.uploadFileToSupabase(avatarFile, `avatars/${AppState.userId}`);
        if (uploaded) avatarUrl = uploaded;
    }

    const success = await window.updateUserProfile(AppState.userId, {
        full_name: newName,
        bio: newBio,
        avatar_url: avatarUrl
    });
    if (success) {
        AppState.userProfile.full_name = newName;
        AppState.userProfile.bio = newBio;
        AppState.userProfile.avatar_url = avatarUrl;
        localStorage.setItem('user_name', newName);
        localStorage.setItem('user_email', newEmail);
        showToast('Perfil atualizado!', 'success');
        document.getElementById('editProfileModal').classList.remove('active');
        renderProfile();
    } else {
        showToast('Erro ao atualizar perfil', 'danger');
    }
}

function initEditProfileModal() {
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        const newCancel = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        newCancel.addEventListener('click', () => {
            document.getElementById('editProfileModal').classList.remove('active');
        });
    }
    const saveBtn = document.getElementById('saveEditBtn');
    if (saveBtn) {
        const newSave = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSave, saveBtn);
        newSave.addEventListener('click', saveProfileChanges);
    }
    const avatarLabel = document.getElementById('avatarLabel');
    const avatarInput = document.getElementById('editAvatar');
    if (avatarLabel && avatarInput) {
        avatarLabel.addEventListener('click', () => avatarInput.click());
        avatarInput.addEventListener('change', () => {
            const fileNameSpan = document.getElementById('avatarFileName');
            if (fileNameSpan && avatarInput.files.length) {
                fileNameSpan.textContent = avatarInput.files[0].name;
            }
        });
    }
}

async function createMusicCardElement(music) {
    const card = document.createElement('div');
    card.className = 'music-card';
    const isCurrent = AppState.currentMusicId === music.id;
    const inlineIcon = (isCurrent && AppState.playing) ? 'pause' : 'play_arrow';
    card.innerHTML = `
        <div class="music-card-left-wrapper">
            <button class="inline-play-btn ${isCurrent ? 'active-inline' : ''}" data-id="${music.id}">
                <span class="material-symbols-rounded">${inlineIcon}</span>
            </button>
            <img src="${sanitizeUrl(music.cover)}" class="music-card-cover" onerror="this.style.opacity='0'">
            <div class="music-card-details">
                <h3>${escapeHtml(music.title)}</h3>
                <p>${escapeHtml(music.artist)}</p>
            </div>
        </div>
        <div class="music-card-actions">
            <button class="more-btn"><span class="material-symbols-rounded">more_vert</span></button>
        </div>
    `;
    card.querySelector('.music-card-left-wrapper').addEventListener('click', () => {
        if (typeof window.setPlayContext === 'function') {
            const source = AppState.currentPlaylistFilter ? 'playlist' : 'library';
            const trackList = AppState.currentPlaylistFilter
                ? AppState.musics.filter(m => {
                    const pl = AppState.userPlaylists.find(p => p.id === AppState.currentPlaylistFilter);
                    return pl && pl.musics && pl.musics.includes(m.id);
                })
                : [...AppState.musics];
            window.setPlayContext(source, trackList, AppState.currentPlaylistFilter || null);
        }
        togglePlayMusic(music);
    });
    card.querySelector('.more-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.openContextMenu === 'function') window.openContextMenu(music);
        else openContextMenu(music);
    });
    return card;
}

function renderQueue() {
    const container = document.getElementById('queueList');
    if (!container) return;
    if (!AppState.queue.length) {
        container.innerHTML = `<div class="queue-empty"><span class="material-symbols-rounded">queue_music</span><span>Fila vazia</span><span style="font-size: 11px;">Adicione músicas para tocar em seguida</span></div>`;
        return;
    }
    container.innerHTML = '';
    AppState.queue.forEach((music, idx) => {
        const isCurrent = AppState.currentMusicId === music.id && AppState.playing;
        const item = document.createElement('div');
        item.className = `queue-item ${isCurrent ? 'current' : ''}`;
        item.innerHTML = `
            <div class="queue-item-info">
                <div class="queue-item-title">${escapeHtml(music.title)}</div>
                <div class="queue-item-artist">${escapeHtml(music.artist)}</div>
            </div>
            <button class="queue-item-remove" data-index="${idx}"><span class="material-symbols-rounded">close</span></button>
        `;
        item.addEventListener('click', (e) => {
            if (e.target.closest('.queue-item-remove')) return;
            const remaining = AppState.queue.slice(idx);
            AppState.queue = remaining;
            renderQueue();
            playMusicTrack(music);
        });
        item.querySelector('.queue-item-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromQueue(idx);
        });
        container.appendChild(item);
    });
}

async function toggleFavoriteTrack(musicId) {
    if (!AppState.userId) return;

    // 1. Atualiza estado INSTANTANEAMENTE — zero delay
    const wasFav = AppState.favorites.has(musicId);
    if (wasFav) {
        AppState.favorites.delete(musicId);
    } else {
        AppState.favorites.add(musicId);
    }
    const isFavNow = AppState.favorites.has(musicId);

    // 2. Atualiza UI instantaneamente com animação pop — sem nenhum toast
    document.querySelectorAll(`.favorite-btn[data-id="${musicId}"]`).forEach(btn => {
        btn.classList.toggle('active', isFavNow);
        btn.querySelector('span').innerText = isFavNow ? 'favorite' : 'favorite_border';
        // Animação de bounce instantânea
        btn.classList.remove('pop');
        void btn.offsetWidth; // reflow para reiniciar animação
        btn.classList.add('pop');
        setTimeout(() => btn.classList.remove('pop'), 300);
    });

    // Botão expandido do player
    const expandedFav = document.getElementById('playerExpandedFavBtn');
    if (expandedFav && AppState.currentMusicId === musicId) {
        const span = expandedFav.querySelector('span');
        if (span) {
            span.innerText = isFavNow ? 'favorite' : 'favorite_border';
            expandedFav.style.color = isFavNow ? '#f472b6' : '';
            expandedFav.classList.remove('pop');
            void expandedFav.offsetWidth;
            expandedFav.classList.add('pop');
            setTimeout(() => expandedFav.classList.remove('pop'), 300);
        }
    }

    localStorage.setItem('supabase_player_favorites', JSON.stringify(Array.from(AppState.favorites)));

    // 3. Sincroniza com Supabase em background — sem toast, silencioso
    try {
        const result = await window.toggleFavorite(AppState.userId, musicId);
        if (result === null) {
            // Reverte silenciosamente se falhou
            if (wasFav) AppState.favorites.add(musicId);
            else AppState.favorites.delete(musicId);
            document.querySelectorAll(`.favorite-btn[data-id="${musicId}"]`).forEach(btn => {
                btn.classList.toggle('active', wasFav);
                btn.querySelector('span').innerText = wasFav ? 'favorite' : 'favorite_border';
            });
        }
    } catch(e) { console.warn('Erro ao sincronizar favorito:', e); }
}

function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('blob:')) {
        return trimmed;
    }
    return ''; // rejeita javascript:, data:, etc.
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initEditProfileModal();
});

// Exportações globais
window.renderHome = renderHome;
window.renderLibrary = renderLibrary;
window.renderProfile = renderProfile;
window.renderQueue = renderQueue;
window.renderArtistsGrid = renderArtistsGrid;  // nova exportação
window.createMusicCardElement = createMusicCardElement;
window.toggleFavoriteTrack = toggleFavoriteTrack;
window.initEditProfileModal = initEditProfileModal;