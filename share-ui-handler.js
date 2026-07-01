// ===== HANDLER DA UI DE COMPARTILHAMENTO (SEM IMAGEM) =====

const ShareUIHandler = {
    _isGenerating: false,

    /**
     * Inicializa o handler
     */
    init() {
        const shareBtn = document.getElementById('shareMusicBtn');
        if (!shareBtn) {
            console.warn('[ShareUI] Botão #shareMusicBtn não encontrado');
            return;
        }
        
        shareBtn.addEventListener('click', () => this.handleShareClick());
        console.log('[ShareUI] Inicializado');
    },

    /**
     * Ao clicar em "Compartilhar"
     */
    async handleShareClick() {
        if (this._isGenerating) return;
        this._isGenerating = true;

        try {
            // Pega música atual
            const music = this.getCurrentMusic();
            if (!music) {
                alert('Nenhuma música está tocando');
                this._isGenerating = false;
                return;
            }

            // Pega tempo atual
            const audio = document.querySelector('audio');
            const currentTime = audio?.currentTime || 0;

            // Gera link
            const link = SharedMusicModule.generateShareLink(music, currentTime);
            if (!link) {
                alert('Erro ao gerar link');
                this._isGenerating = false;
                return;
            }

            // Mostra modal com link
            this.showShareModal(link, music, currentTime);

        } catch (e) {
            console.error('[ShareUI] Erro:', e);
            alert('Erro ao compartilhar');
        } finally {
            this._isGenerating = false;
        }
    },

    /**
     * Mostra modal com opções de compartilhamento
     */
    showShareModal(link, music, startTime) {
        // Cria modal
        const modal = document.createElement('div');
        modal.id = 'shareModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: #1a1a2e;
            border-radius: 15px;
            padding: 20px;
            width: 90%;
            max-width: 500px;
            color: white;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;

        // Título
        const title = document.createElement('h2');
        title.textContent = 'Compartilhar Música';
        title.style.marginBottom = '15px';
        content.appendChild(title);

        // Info da música
        const info = document.createElement('div');
        info.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 15px;
            font-size: 14px;
        `;
        info.innerHTML = `
            <div><strong>${music.title}</strong></div>
            <div>${music.artist}</div>
            <div style="color: #aaa; font-size: 12px; margin-top: 5px;">
                ⏱️ Começando em ${this.formatTime(startTime)} (preview de 30s)
            </div>
        `;
        content.appendChild(info);

        // Link
        const linkContainer = document.createElement('div');
        linkContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        `;
        
        const linkInput = document.createElement('input');
        linkInput.type = 'text';
        linkInput.value = link;
        linkInput.readOnly = true;
        linkInput.style.cssText = `
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Copiar';
        copyBtn.style.cssText = `
            padding: 10px 20px;
            background: #7c3aed;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        `;
        copyBtn.addEventListener('click', async () => {
            const success = await SharedMusicModule.copyShareToClipboard(link);
            copyBtn.textContent = success ? '✅ Copiado!' : '❌ Erro';
            setTimeout(() => copyBtn.textContent = '📋 Copiar', 2000);
        });
        
        linkContainer.appendChild(linkInput);
        linkContainer.appendChild(copyBtn);
        content.appendChild(linkContainer);

        // Botões de redes sociais
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        `;

        // WhatsApp
        const whatsappBtn = this.createSocialButton(
            '💬 WhatsApp',
            '#25d366',
            () => SharedMusicModule.shareToWhatsApp(link, music)
        );
        buttonsContainer.appendChild(whatsappBtn);

        // Twitter
        const twitterBtn = this.createSocialButton(
            '𝕏 Twitter',
            '#000000',
            () => SharedMusicModule.shareToTwitter(link, music)
        );
        buttonsContainer.appendChild(twitterBtn);

        // Instagram
        const instaBtn = this.createSocialButton(
            '📷 Instagram',
            '#E4405F',
            () => SharedMusicModule.shareToInstagram(link, music)
        );
        buttonsContainer.appendChild(instaBtn);

        // Web Share API (se suportado)
        if (navigator.share) {
            const shareBtn = this.createSocialButton(
                '🔗 Mais',
                '#8b5cf6',
                () => SharedMusicModule.shareWithAPI(link, music)
            );
            buttonsContainer.appendChild(shareBtn);
        }

        content.appendChild(buttonsContainer);

        // Aviso
        const warning = document.createElement('div');
        warning.style.cssText = `
            background: rgba(255, 200, 0, 0.1);
            border-left: 3px solid #ffc800;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            margin-bottom: 15px;
        `;
        warning.textContent = '💡 Quem receber este link poderá ouvir os primeiros 30 segundos da música.';
        content.appendChild(warning);

        // Fechar
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Fechar';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
        `;
        closeBtn.addEventListener('click', () => modal.remove());
        content.appendChild(closeBtn);

        modal.appendChild(content);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    },

    /**
     * Cria botão de rede social
     */
    createSocialButton(text, color, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            padding: 12px;
            background: ${color};
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
        `;
        btn.addEventListener('click', onClick);
        return btn;
    },

    /**
     * Formata tempo em MM:SS
     */
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    /**
     * Pega música atual
     */
    getCurrentMusic() {
        // Procura no AppState
        if (window.AppState && window.AppState.playContext && window.AppState.playContext.music) {
            return window.AppState.playContext.music;
        }

        // Procura no player context
        if (window.currentMusic) {
            return window.currentMusic;
        }

        console.warn('[ShareUI] Nenhuma música atual encontrada');
        return null;
    }
};

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ShareUIHandler.init());
} else {
    ShareUIHandler.init();
}
