// ===== SISTEMA DE COMPARTILHAMENTO DE MÚSICA (LINK SIMPLES) =====

const SharedMusicModule = {
    
    /**
     * Gera link compartilhável para uma música
     * @param {Object} music - Objeto da música {id, title, artist, ...}
     * @param {number} startTime - Tempo de início em segundos
     * @returns {string} URL compartilhável
     */
    generateShareLink(music, startTime = 0) {
        if (!music || !music.id) {
            console.error('[SharedMusic] Música inválida para compartilhar');
            return null;
        }
        
        const baseUrl = window.location.href.split('?')[0];
        const params = new URLSearchParams({
            share: '1',
            music_id: music.id,
            t: Math.floor(startTime)
        });
        
        return `${baseUrl}?${params.toString()}`;
    },

    /**
     * Retorna contexto de compartilhamento
     */
    getShareContext() {
        const params = new URLSearchParams(window.location.search);
        return {
            isShared: params.get('share') === '1',
            musicId: params.get('music_id'),
            startTime: parseInt(params.get('t')) || 0
        };
    },

    /**
     * Verifica se está em modo preview
     */
    isPreviewMode() {
        return this.getShareContext().isShared;
    },

    /**
     * Compartilha via Web Share API
     */
    async shareWithAPI(link, music) {
        if (!navigator.share) {
            console.warn('[SharedMusic] Web Share API não suportada');
            return false;
        }

        try {
            const title = music?.title || 'Música';
            const artist = music?.artist || '';
            
            await navigator.share({
                title: `${title} - ${artist}`,
                text: 'Ouça 30 segundos desta música no Fenda Music',
                url: link
            });
            return true;
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('[SharedMusic] Erro ao compartilhar:', e);
            }
            return false;
        }
    },

    /**
     * Copia link para clipboard
     */
    async copyShareToClipboard(link) {
        try {
            await navigator.clipboard.writeText(link);
            console.log('[SharedMusic] Link copiado para clipboard');
            return true;
        } catch (e) {
            console.error('[SharedMusic] Erro ao copiar:', e);
            return false;
        }
    },

    /**
     * Compartilha no WhatsApp
     */
    shareToWhatsApp(link, music) {
        const title = music?.title || 'Música';
        const artist = music?.artist || '';
        const text = `Ouça "${title}" de ${artist} no Fenda Music (30s de preview)`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + link)}`;
        window.open(whatsappUrl, '_blank');
    },

    /**
     * Compartilha no Instagram
     */
    shareToInstagram(link, music) {
        const text = `Fenda Music - ${music?.title || 'Música'}`;
        const instaUrl = `https://www.instagram.com/?text=${encodeURIComponent(text)}\n${link}`;
        window.open(instaUrl, '_blank');
    },

    /**
     * Compartilha no Twitter/X
     */
    shareToTwitter(link, music) {
        const title = music?.title || 'Música';
        const artist = music?.artist || '';
        const text = `Ouvindo "${title}" de ${artist} no Fenda Music 🎵`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        window.open(twitterUrl, '_blank');
    }
};
