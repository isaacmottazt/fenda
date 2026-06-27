// ===== SISTEMA DE COMPARTILHAMENTO DE MÚSICA (PREVIEW 30s + IMAGEM) =====

const SharedMusicModule = {
    /**
     * Gera link compartilhável para uma música
     * @param {Object} music - Objeto da música {id, title, artist, cover, ...}
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
            share: '1',  // Flag que indica "modo compartilhado"
            music_id: music.id,
            t: Math.floor(startTime)  // Início do preview
        });
        
        return `${baseUrl}?${params.toString()}`;
    },

    /**
     * Gera imagem de compartilhamento (Canvas)
     * @param {Object} music - Objeto da música
     * @param {number} startTime - Tempo de início em segundos
     * @returns {Promise<string>} Data URL da imagem gerada
     */
    async generateShareImage(music, startTime = 0) {
        return new Promise(async (resolve) => {
            try {
                if (!music || !music.cover) {
                    console.warn('[SharedMusic] Música sem capa, gerando genérica');
                    resolve(await this._generateGenericImage(music, startTime));
                    return;
                }

                // Carregar a imagem da capa do Supabase
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    try {
                        const canvas = this._createShareCanvas(img, music, startTime);
                        resolve(canvas.toDataURL('image/png'));
                    } catch (e) {
                        console.error('[SharedMusic] Erro ao renderizar canvas:', e);
                        resolve(await this._generateGenericImage(music, startTime));
                    }
                };
                
                img.onerror = async () => {
                    console.warn('[SharedMusic] Erro ao carregar capa, usando genérica');
                    resolve(await this._generateGenericImage(music, startTime));
                };
                
                // URL da imagem no Supabase
                img.src = music.cover;
                
            } catch (e) {
                console.error('[SharedMusic] Erro geral na geração de imagem:', e);
                resolve(await this._generateGenericImage(music, startTime));
            }
        });
    },

    /**
     * Cria canvas com capa, título, artista e tempo
     * @private
     */
    _createShareCanvas(coverImg, music, startTime) {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630;  // Tamanho padrão para Open Graph
        
        const ctx = canvas.getContext('2d');
        
        // Fundo com gradiente sutilmente baseado na cor dominante
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Capa da música (esquerda)
        const coverSize = 400;
        const coverX = 50;
        const coverY = (canvas.height - coverSize) / 2;
        
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(coverX, coverY, coverSize, coverSize, 20);
        ctx.clip();
        ctx.drawImage(coverImg, coverX, coverY, coverSize, coverSize);
        ctx.restore();
        
        // Sombra na capa
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(coverX, coverY, coverSize, coverSize, 20);
        ctx.stroke();

        // Seção de texto (direita)
        const textX = coverX + coverSize + 50;
        const textMaxWidth = canvas.width - textX - 50;

        // "Estou ouvindo" label
        ctx.fillStyle = '#7c3aed';
        ctx.font = 'bold 28px "Segoe UI", sans-serif';
        ctx.fillText('🎵 Estou ouvindo', textX, 100);

        // Título da música
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px "Segoe UI", sans-serif';
        ctx.lineWidth = 2;
        
        const title = this._wrapText(music.title, 30);
        title.forEach((line, i) => {
            ctx.fillText(line, textX, 200 + i * 60);
        });

        // Artista
        ctx.fillStyle = '#b0b0b0';
        ctx.font = '32px "Segoe UI", sans-serif';
        ctx.fillText(music.artist || 'Artista desconhecido', textX, 320);

        // Tempo de início (se compartilhado de um ponto específico)
        if (startTime > 0) {
            ctx.fillStyle = '#7c3aed';
            ctx.font = '20px "Segoe UI", sans-serif';
            ctx.fillText(`⏱️ Começando em ${this._formatTime(startTime)}`, textX, 380);
        }

        // Duração do preview
        ctx.fillStyle = '#999';
        ctx.font = '20px "Segoe UI", sans-serif';
        ctx.fillText('Ouça 30s grátis no Fenda Music', textX, 430);

        // Logo/branding
        ctx.fillStyle = '#7c3aed';
        ctx.font = 'bold 24px "Segoe UI", sans-serif';
        ctx.fillText('FENDA', textX, canvas.height - 40);

        ctx.fillStyle = '#666';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText('Gospel Music Streaming', textX + 120, canvas.height - 45);

        return canvas;
    },

    /**
     * Gera imagem genérica quando capa não está disponível
     * @private
     */
    async _generateGenericImage(music, startTime) {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630;
        
        const ctx = canvas.getContext('2d');
        
        // Fundo roxo (cor do Fenda)
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#7c3aed');
        gradient.addColorStop(1, '#5b21b6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Padrão de círculos decorativos
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(200 + i * 200, -100, 150, 0, Math.PI * 2);
            ctx.fill();
        }

        // Texto centralizado
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 56px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎵', canvas.width / 2, 150);

        ctx.font = 'bold 48px "Segoe UI", sans-serif';
        ctx.fillText(music.title || 'Música', canvas.width / 2, 280);

        ctx.font = '32px "Segoe UI", sans-serif';
        ctx.fillStyle = '#e0e0e0';
        ctx.fillText(music.artist || 'Artista', canvas.width / 2, 360);

        ctx.fillStyle = '#b0b0b0';
        ctx.font = '24px "Segoe UI", sans-serif';
        ctx.fillText('Ouça 30s grátis • Fenda Music', canvas.width / 2, 450);

        return canvas.toDataURL('image/png');
    },

    /**
     * Quebra texto em linhas
     * @private
     */
    _wrapText(text, maxChars) {
        if (text.length <= maxChars) return [text];
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            if ((currentLine + word).length > maxChars) {
                if (currentLine) lines.push(currentLine.trim());
                currentLine = word;
            } else {
                currentLine += (currentLine ? ' ' : '') + word;
            }
        });
        
        if (currentLine) lines.push(currentLine.trim());
        return lines;
    },

    /**
     * Formata segundos para HH:MM:SS
     * @private
     */
    _formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${m}:${String(s).padStart(2, '0')}`;
    },

    /**
     * Detecta se está em modo compartilhado
     * @returns {Object} {isShared: boolean, musicId: string, startTime: number}
     */
    getShareContext() {
        const urlParams = new URLSearchParams(window.location.search);
        const isShared = urlParams.get('share') === '1';
        const musicId = urlParams.get('music_id');
        const startTime = parseInt(urlParams.get('t')) || 0;
        
        return { isShared, musicId, startTime };
    },

    /**
     * Verifica se a música está em modo preview (compartilhado)
     * @returns {boolean}
     */
    isPreviewMode() {
        return this.getShareContext().isShared;
    },

    /**
     * Copia link + imagem para clipboard (texto formatado)
     * @param {string} link - URL compartilhável
     * @param {string} imageDataUrl - Data URL da imagem
     * @param {Object} music - Objeto da música
     */
    async copyShareToClipboard(link, imageDataUrl, music) {
        try {
            // Texto com link
            const text = `🎵 Estou ouvindo "${music.title}" - ${music.artist}\n\n${link}`;
            
            // Tentar usar Clipboard API (para navegadores modernos)
            if (navigator.clipboard && navigator.clipboard.write) {
                const blob = await (await fetch(imageDataUrl)).blob();
                const item = new ClipboardItem({
                    'text/plain': new Blob([text], { type: 'text/plain' }),
                    'image/png': blob
                });
                await navigator.clipboard.write([item]);
                return true;
            } else {
                // Fallback: apenas texto
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (e) {
            console.warn('[SharedMusic] Erro ao copiar para clipboard:', e);
            return false;
        }
    },

    /**
     * Compartilha com Web Share API (se disponível)
     * @param {string} link - URL compartilhável
     * @param {string} imageDataUrl - Data URL da imagem
     * @param {Object} music - Objeto da música
     */
    async shareWithAPI(link, imageDataUrl, music) {
        try {
            if (!navigator.share) return false;

            const title = `${music.title} - ${music.artist}`;
            const text = `Estou ouvindo "${music.title}" no Fenda Music! Ouça os primeiros 30s 🎵`;

            // Converter imagem para Blob
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            const file = new File([blob], 'fenda-share.png', { type: 'image/png' });

            await navigator.share({
                title: title,
                text: text,
                url: link,
                files: [file]
            });

            return true;
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.error('[SharedMusic] Erro ao compartilhar:', e);
            }
            return false;
        }
    }
};

window.SharedMusicModule = SharedMusicModule;
