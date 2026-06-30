// ===== SISTEMA DE COMPARTILHAMENTO DE MÚSICA (PREVIEW 30s + IMAGEM) =====

const SharedMusicModule = {
    _fendaLogoCache: null,  // Cache da logo em memória
    
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
                // Pré-carregar logo antes de gerar imagem
                if (!this._fendaLogoCache) {
                    await this._loadFendaLogo();
                }

                if (!music || !music.cover) {
                    console.warn('[SharedMusic] Música sem capa, gerando genérica');
                    const genericImg = await this._generateGenericImage(music, startTime);
                    resolve(genericImg);
                    return;
                }

                // Carregar a imagem da capa do Supabase
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = async () => {
                    try {
                        const canvas = this._createShareCanvas(img, music, startTime);
                        resolve(canvas.toDataURL('image/png'));
                    } catch (e) {
                        console.error('[SharedMusic] Erro ao renderizar canvas:', e);
                        const genericImg = await this._generateGenericImage(music, startTime);
                        resolve(genericImg);
                    }
                };
                
                img.onerror = async () => {
                    console.warn('[SharedMusic] Erro ao carregar capa, usando genérica');
                    const genericImg = await this._generateGenericImage(music, startTime);
                    resolve(genericImg);
                };
                
                // URL da imagem no Supabase
                img.src = music.cover;
                
            } catch (e) {
                console.error('[SharedMusic] Erro geral na geração de imagem:', e);
                const genericImg = await this._generateGenericImage(music, startTime);
                resolve(genericImg);
            }
        });
    },

    /**
     * Polyfill para roundRect em navegadores antigos
     * @private
     */
    _ensureRoundRect(ctx) {
        if (!ctx.roundRect) {
            ctx.roundRect = function(x, y, w, h, r) {
                if (w < 2 * r) r = w / 2;
                if (h < 2 * r) r = h / 2;
                this.beginPath();
                this.moveTo(x + r, y);
                this.arcTo(x + w, y, x + w, y + h, r);
                this.arcTo(x + w, y + h, x, y + h, r);
                this.arcTo(x, y + h, x, y, r);
                this.arcTo(x, y, x + w, y, r);
                this.closePath();
                return this;
            };
        }
    },

    /**
     * Carrega a logo do Fenda (do arquivo logo.png na raiz)
     * @private
     */
    async _loadFendaLogo() {
        if (this._fendaLogoCache) {
            return this._fendaLogoCache;
        }

        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this._fendaLogoCache = img;
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn('[SharedMusic] logo.png não encontrada');
                resolve(null);
            };
            
            // Tenta carregar logo.png da raiz
            img.src = './logo.png';
        });
    },

    /**
     * Cria canvas idêntico à imagem de referência
     * @private
     */
    _createShareCanvas(coverImg, music, startTime) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 720;
            canvas.height = 900;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Contexto 2D indisponível');
            
            this._ensureRoundRect(ctx);
            
            // FUNDO ROXO VIBRANTE
            ctx.fillStyle = '#7c3aed';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // CARD CONTAINER (roxo mais claro)
            ctx.fillStyle = '#8b5cf6';
            ctx.beginPath();
            ctx.roundRect(30, 30, 660, 840, 30);
            ctx.fill();

            // CAPA - CENTRALIZADA NO TOPO (quadrado)
            const capeSize = 380;
            const capeX = (canvas.width - capeSize) / 2;
            const capeY = 80;
            
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(capeX, capeY, capeSize, capeSize, 20);
            ctx.clip();
            ctx.drawImage(coverImg, capeX, capeY, capeSize, capeSize);
            ctx.restore();

            // TEXTO CENTRALIZADO EMBAIXO DA CAPA
            const textY = capeY + capeSize + 60;
            const centerX = canvas.width / 2;
            
            // TÍTULO - FONTE GRANDE, CENTRALIZADO
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 44px Arial';
            ctx.textAlign = 'center';
            
            const titleLines = this._wrapText(music.title || 'Título', 16);
            titleLines.slice(0, 2).forEach((line, i) => {
                ctx.fillText(line, centerX, textY + i * 50);
            });

            // ARTISTA - CENTRALIZADO
            ctx.fillStyle = '#d1d5db';
            ctx.font = 'bold 30px Arial';
            const artistY = textY + (titleLines.length > 1 ? 100 : 50) + 20;
            ctx.fillText(music.artist || 'Artista', centerX, artistY);

            // LOGO REAL (imagem) + TEXTO NO RODAPÉ - CENTRALIZADO
            const footerY = 800;
            
            if (this._fendaLogoCache) {
                // Desenhar logo como imagem (80x80)
                const logoSize = 80;
                const logoX = centerX - logoSize / 2;
                ctx.drawImage(this._fendaLogoCache, logoX, footerY - 30, logoSize, logoSize);
                
                // Texto "Fenda Music" embaixo da logo
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 36px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Fenda Music', centerX, footerY + 60);
            } else {
                // Fallback se logo não carregar
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 36px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Fenda Music', centerX, footerY);
            }

            return canvas;
        } catch (e) {
            console.error('[SharedMusic] Erro canvas:', e);
            throw e;
        }
    },

    /**
     * Gera imagem genérica quando capa não está disponível
     * @private
     */
    async _generateGenericImage(music, startTime) {
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 900;
        
        const ctx = canvas.getContext('2d');
        
        this._ensureRoundRect(ctx);
        
        // FUNDO ROXO
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // CARD
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.roundRect(30, 30, 660, 840, 30);
        ctx.fill();

        // PLACEHOLDER CAPA (centralizado)
        const capeSize = 380;
        const capeX = (canvas.width - capeSize) / 2;
        const capeY = 80;
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.roundRect(capeX, capeY, capeSize, capeSize, 20);
        ctx.fill();
        ctx.restore();
        
        // ÍCONE
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎵', canvas.width / 2, capeY + capeSize / 2);

        // TEXTO CENTRALIZADO
        const textY = capeY + capeSize + 60;
        const centerX = canvas.width / 2;
        
        // TÍTULO
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px Arial';
        ctx.textAlign = 'center';
        
        const titleLines = this._wrapText(music.title || 'Título', 16);
        titleLines.slice(0, 2).forEach((line, i) => {
            ctx.fillText(line, centerX, textY + i * 50);
        });

        // ARTISTA
        ctx.fillStyle = '#d1d5db';
        ctx.font = 'bold 30px Arial';
        const artistY = textY + (titleLines.length > 1 ? 100 : 50) + 20;
        ctx.fillText(music.artist || 'Artista', centerX, artistY);

        // LOGO REAL (imagem) + TEXTO
        const footerY = 800;
        
        if (this._fendaLogoCache) {
            // Desenhar logo como imagem (80x80)
            const logoSize = 80;
            const logoX = centerX - logoSize / 2;
            ctx.drawImage(this._fendaLogoCache, logoX, footerY - 30, logoSize, logoSize);
            
            // Texto "Fenda Music" embaixo da logo
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Fenda Music', centerX, footerY + 60);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Fenda Music', centerX, footerY);
        }

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
