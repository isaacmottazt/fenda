// ===== HANDLER DE UI PARA COMPARTILHAMENTO =====

const ShareUIHandler = {
    _isGenerating: false,
    _currentShareData: null,

    /**
     * Inicializa o listener no botão de share
     */
    init() {
        const shareBtn = document.getElementById('shareMusicBtn');
        if (!shareBtn) {
            console.warn('[ShareUI] Botão de compartilhamento não encontrado');
            return;
        }

        // Remover listener antigo se existir
        if (shareBtn.hasAttribute('data-share-listener')) {
            shareBtn.removeAttribute('data-share-listener');
        }

        shareBtn.addEventListener('click', () => this.handleShareClick());
        shareBtn.setAttribute('data-share-listener', 'true');

        console.log('[ShareUI] Inicializado');
    },

    /**
     * Handler principal do clique no botão de compartilhamento
     */
    async handleShareClick() {
        if (this._isGenerating) {
            showToast('Gerando link de compartilhamento...', 'info');
            return;
        }

        const music = AppState.musics.find(m => m.id === AppState.currentMusicId);
        if (!music) {
            showToast('Nenhuma música tocando no momento', 'danger');
            return;
        }

        this._isGenerating = true;
        showToast('Gerando link e imagem...', 'info');

        try {
            const audio = DOM.audio || document.querySelector('audio');
            const currentTime = audio ? Math.floor(audio.currentTime) : 0;

            // Gerar link compartilhável
            const shareLink = SharedMusicModule.generateShareLink(music, currentTime);

            // Gerar imagem
            console.log('[ShareUI] Gerando imagem...');
            const imageDataUrl = await SharedMusicModule.generateShareImage(music, currentTime);

            this._currentShareData = {
                music,
                link: shareLink,
                image: imageDataUrl,
                startTime: currentTime
            };

            // Mostrar modal com preview
            this.showShareModal(shareLink, imageDataUrl, music, currentTime);

        } catch (e) {
            console.error('[ShareUI] Erro ao gerar compartilhamento:', e);
            showToast('Erro ao gerar link de compartilhamento', 'danger');
        } finally {
            this._isGenerating = false;
        }
    },

    /**
     * Exibe modal com preview do compartilhamento
     */
    showShareModal(link, imageDataUrl, music, startTime) {
        // Remover modal anterior se existir
        const existing = document.getElementById('share-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'share-modal-overlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            " onclick="if(event.target === this) document.getElementById('share-modal-overlay').remove()">
                <div style="
                    background: #1a1a2e;
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 500px;
                    width: 90%;
                    color: white;
                    animation: slideUp 0.3s ease-out;
                    max-height: 90vh;
                    overflow-y: auto;
                ">
                    <!-- Fechar -->
                    <button onclick="document.getElementById('share-modal-overlay').remove()" style="
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        background: none;
                        border: none;
                        color: white;
                        font-size: 28px;
                        cursor: pointer;
                        padding: 0;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">✕</button>

                    <!-- Título -->
                    <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: bold;">
                        Compartilhar Música
                    </h2>

                    <!-- Preview da imagem -->
                    <div style="
                        margin-bottom: 24px;
                        border-radius: 12px;
                        overflow: hidden;
                        background: #222;
                    ">
                        <img id="share-image-preview" src="${imageDataUrl}" style="
                            width: 100%;
                            height: auto;
                            display: block;
                        ">
                    </div>

                    <!-- Info da música -->
                    <div style="
                        margin-bottom: 24px;
                        padding: 16px;
                        background: rgba(124, 58, 237, 0.1);
                        border-left: 4px solid #7c3aed;
                        border-radius: 8px;
                    ">
                        <div style="font-weight: bold; margin-bottom: 4px;">${music.title}</div>
                        <div style="color: #b0b0b0; font-size: 14px;">por ${music.artist}</div>
                        ${startTime > 0 ? `
                            <div style="color: #7c3aed; font-size: 12px; margin-top: 8px;">
                                ⏱️ Começando em ${this._formatTime(startTime)} (preview de 30s)
                            </div>
                        ` : `
                            <div style="color: #7c3aed; font-size: 12px; margin-top: 8px;">
                                🎧 Preview de 30 segundos
                            </div>
                        `}
                    </div>

                    <!-- Link copiável -->
                    <div style="margin-bottom: 24px;">
                        <label style="
                            display: block;
                            margin-bottom: 8px;
                            font-size: 12px;
                            color: #999;
                            text-transform: uppercase;
                            font-weight: bold;
                        ">Link de Compartilhamento</label>
                        <div style="
                            display: flex;
                            gap: 8px;
                        ">
                            <input type="text" id="share-link-input" value="${link}" readonly style="
                                flex: 1;
                                background: #222;
                                border: 1px solid #444;
                                color: white;
                                padding: 12px;
                                border-radius: 8px;
                                font-size: 12px;
                                font-family: monospace;
                            ">
                            <button onclick="ShareUIHandler.copyLinkToClipboard()" style="
                                background: #7c3aed;
                                color: white;
                                border: none;
                                padding: 12px 16px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: bold;
                                white-space: nowrap;
                            ">
                                📋 Copiar
                            </button>
                        </div>
                    </div>

                    <!-- Botões de compartilhamento -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                        margin-bottom: 16px;
                    ">
                        <button onclick="ShareUIHandler.shareToWhatsApp()" style="
                            background: #25d366;
                            color: white;
                            border: none;
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 14px;
                        ">
                            💬 WhatsApp
                        </button>
                        <button onclick="ShareUIHandler.shareToInstagram()" style="
                            background: #e1306c;
                            color: white;
                            border: none;
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 14px;
                        ">
                            📸 Instagram
                        </button>
                        <button onclick="ShareUIHandler.shareToTwitter()" style="
                            background: #1da1f2;
                            color: white;
                            border: none;
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 14px;
                        ">
                            𝕏 Twitter
                        </button>
                        <button onclick="ShareUIHandler.shareWithAPI()" style="
                            background: #7c3aed;
                            color: white;
                            border: none;
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 14px;
                        ">
                            📤 Mais opções
                        </button>
                    </div>

                    <!-- Nota sobre preview -->
                    <div style="
                        font-size: 12px;
                        color: #999;
                        padding: 12px;
                        background: rgba(124, 58, 237, 0.05);
                        border-radius: 6px;
                        margin-bottom: 0;
                    ">
                        💡 Quem receber este link poderá ouvir os primeiros <strong>30 segundos</strong> da música a partir do ponto compartilhado.
                    </div>
                </div>
            </div>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(40px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            </style>
        `;

        document.body.appendChild(overlay);
    },

    /**
     * Copia link para clipboard
     */
    async copyLinkToClipboard() {
        if (!this._currentShareData) return;

        try {
            const linkInput = document.getElementById('share-link-input');
            await navigator.clipboard.writeText(linkInput.value);
            showToast('Link copiado! 📋', 'success');
        } catch (e) {
            console.error('[ShareUI] Erro ao copiar:', e);
            showToast('Erro ao copiar link', 'danger');
        }
    },

    /**
     * Compartilha no WhatsApp
     */
    shareToWhatsApp() {
        if (!this._currentShareData) return;

        const { music, link, startTime } = this._currentShareData;
        const text = encodeURIComponent(
            `🎵 Estou ouvindo "${music.title}" - ${music.artist}${startTime ? ` a partir de ${this._formatTime(startTime)}` : ''}\n\nOuça os primeiros 30s grátis:\n${link}`
        );

        window.open(`https://wa.me/?text=${text}`, '_blank');
        showToast('Abrindo WhatsApp...', 'success');
    },

    /**
     * Compartilha no Instagram (via stories/direct)
     */
    shareToInstagram() {
        if (!this._currentShareData) return;

        const { music, link } = this._currentShareData;
        const text = encodeURIComponent(
            `${music.title} - ${music.artist}\n\nOuça no Fenda Music: ${link}`
        );

        // Instagram não aceita URL diretamente, redireciona para app
        window.open(`https://instagram.com/?url=${link}`, '_blank');
        showToast('Link copiado para compartilhar no Instagram Story', 'info');
    },

    /**
     * Compartilha no Twitter
     */
    shareToTwitter() {
        if (!this._currentShareData) return;

        const { music, link, startTime } = this._currentShareData;
        const text = encodeURIComponent(
            `🎵 Ouvindo "${music.title}" - ${music.artist}${startTime ? ` a partir de ${this._formatTime(startTime)}` : ''} no @FendaMusic 🎧\n\nOuça os primeiros 30s:\n${link}`
        );

        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
        showToast('Abrindo Twitter...', 'success');
    },

    /**
     * Compartilha com Web Share API
     */
    async shareWithAPI() {
        if (!this._currentShareData) {
            showToast('Erro ao compartilhar', 'danger');
            return;
        }

        try {
            const success = await SharedMusicModule.shareWithAPI(
                this._currentShareData.link,
                this._currentShareData.image,
                this._currentShareData.music
            );

            if (success) {
                showToast('Compartilhado com sucesso! 🎵', 'success');
                document.getElementById('share-modal-overlay')?.remove();
            }
        } catch (e) {
            console.error('[ShareUI] Erro ao compartilhar:', e);
            showToast('Sua rede social não foi detectada', 'info');
        }
    },

    /**
     * Formata segundos para HH:MM:SS
     * @private
     */
    _formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    }
};

window.ShareUIHandler = ShareUIHandler;
