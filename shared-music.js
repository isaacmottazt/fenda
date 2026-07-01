// ===== SISTEMA DE COMPARTILHAMENTO DE MÚSICA (PREVIEW 30s + IMAGEM ESTILO SPOTIFY) =====

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
     * Gera imagem de compartilhamento (Canvas) - Estilo Spotify
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
     * Extrai cor dominante da imagem para criar gradiente dinâmico
     * @private
     */
    _extractDominantColor(img) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 50, 50);
            
            const imageData = ctx.getImageData(0, 0, 50, 50);
            const data = imageData.data;
            
            let r = 0, g = 0, b = 0;
            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
            }
            
            const pixelCount = data.length / 4;
            r = Math.round(r / pixelCount);
            g = Math.round(g / pixelCount);
            b = Math.round(b / pixelCount);
            
            return `rgb(${r}, ${g}, ${b})`;
        } catch (e) {
            return '#1DB954'; // Verde Spotify padrão
        }
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
     * Cria canvas com estilo Spotify
     * @private
     */
    _createShareCanvas(coverImg, music, startTime) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1350;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Contexto 2D indisponível');
            
            this._ensureRoundRect(ctx);
            
            // Extrair cor dominante para gradiente
            const dominantColor = this._extractDominantColor(coverImg);
            
            // FUNDO COM GRADIENTE (estilo Spotify)
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#191414');  // Preto Spotify
            gradient.addColorStop(0.5, dominantColor);
            gradient.addColorStop(1, '#191414');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // CAPA - GRANDE E CENTRALIZADA (estilo Spotify Stories)
            const capeSize = 600;
            const capeX = (canvas.width - capeSize) / 2;
            const capeY = 120;
            
            // Sombra da capa
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 40;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 20;
            
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(capeX, capeY, capeSize, capeSize, 25);
            ctx.clip();
            ctx.drawImage(coverImg, capeX, capeY, capeSize, capeSize);
            ctx.restore();
            
            ctx.shadowColor = 'transparent';

            // ÍCONE DE PLAY SOBREPOSTO (estilo Spotify)
            const playIconX = capeX + capeSize / 2;
            const playIconY = capeY + capeSize / 2;
            const playSize = 100;
            
            // Círculo de fundo para o ícone de play
            ctx.fillStyle = 'rgba(30, 215, 96, 0.9)';  // Verde Spotify
            ctx.beginPath();
            ctx.arc(playIconX, playIconY, playSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Triângulo de play
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(playIconX - playSize / 3, playIconY - playSize / 3);
            ctx.lineTo(playIconX - playSize / 3, playIconY + playSize / 3);
            ctx.lineTo(playIconX + playSize / 2.5, playIconY);
            ctx.fill();

            // TEXTO CENTRALIZADO EMBAIXO DA CAPA
            const textY = capeY + capeSize + 100;
            const centerX = canvas.width / 2;
            
            // TÍTULO - FONTE GRANDE, CENTRALIZADO
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            const titleLines = this._wrapText(music.title || 'Título', 18);
            titleLines.slice(0, 2).forEach((line, i) => {
                ctx.fillText(line, centerX, textY + i * 90);
            });

            // ARTISTA - CENTRALIZADO
            ctx.fillStyle = '#b3b3b3';
            ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const artistY = textY + (titleLines.length > 1 ? 180 : 90) + 30;
            ctx.fillText(music.artist || 'Artista', centerX, artistY);

            // BADGE "OUVINDO AGORA" (estilo Spotify)
            const badgeY = artistY + 80;
            const badgeWidth = 300;
            const badgeHeight = 50;
            const badgeX = centerX - badgeWidth / 2;
            
            ctx.fillStyle = 'rgba(30, 215, 96, 0.2)';
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 25);
            ctx.fill();
            
            ctx.strokeStyle = '#1DB954';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#1DB954';
            ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🎵 Ouvindo Agora', centerX, badgeY + badgeHeight / 2);

            // LOGO REAL (imagem) + TEXTO NO RODAPÉ - CENTRALIZADO
            const footerY = 1200;
            
            if (this._fendaLogoCache) {
                // Desenhar logo como imagem (100x100)
                const logoSize = 100;
                const logoX = centerX - logoSize / 2;
                ctx.drawImage(this._fendaLogoCache, logoX, footerY - 30, logoSize, logoSize);
                
                // Texto "Fenda Music" embaixo da logo
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Fenda Music', centerX, footerY + 80);
            } else {
                // Fallback se logo não carregar
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
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
        canvas.width = 1080;
        canvas.height = 1350;
        
        const ctx = canvas.getContext('2d');
        
        this._ensureRoundRect(ctx);
        
        // FUNDO COM GRADIENTE (estilo Spotify)
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#191414');
        gradient.addColorStop(0.5, '#1DB954');
        gradient.addColorStop(1, '#191414');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // PLACEHOLDER CAPA (centralizado)
        const capeSize = 600;
        const capeX = (canvas.width - capeSize) / 2;
        const capeY = 120;
        
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(capeX, capeY, capeSize, capeSize, 25);
        ctx.fill();
        ctx.restore();
        
        // ÍCONE DE PLAY SOBREPOSTO
        const playIconX = capeX + capeSize / 2;
        const playIconY = capeY + capeSize / 2;
        const playSize = 100;
        
        ctx.fillStyle = 'rgba(30, 215, 96, 0.9)';
        ctx.beginPath();
        ctx.arc(playIconX, playIconY, playSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(playIconX - playSize / 3, playIconY - playSize / 3);
        ctx.lineTo(playIconX - playSize / 3, playIconY + playSize / 3);
        ctx.lineTo(playIconX + playSize / 2.5, playIconY);
        ctx.fill();

        // TEXTO CENTRALIZADO
        const textY = capeY + capeSize + 100;
        const centerX = canvas.width / 2;
        
        // TÍTULO
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const titleLines = this._wrapText(music.title || 'Título', 18);
        titleLines.slice(0, 2).forEach((line, i) => {
            ctx.fillText(line, centerX, textY + i * 90);
        });

        // ARTISTA
        ctx.fillStyle = '#b3b3b3';
        ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const artistY = textY + (titleLines.length > 1 ? 180 : 90) + 30;
        ctx.fillText(music.artist || 'Artista', centerX, artistY);

        // BADGE "OUVINDO AGORA"
        const badgeY = artistY + 80;
        const badgeWidth = 300;
        const badgeHeight = 50;
        const badgeX = centerX - badgeWidth / 2;
        
        ctx.fillStyle = 'rgba(30, 215, 96, 0.2)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 25);
        ctx.fill();
        
        ctx.strokeStyle = '#1DB954';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#1DB954';
        ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎵 Ouvindo Agora', centerX, badgeY + badgeHeight / 2);

        // LOGO REAL (imagem) + TEXTO
        const footerY = 1200;
        
        if (this._fendaLogoCache) {
            const logoSize = 100;
            const logoX = centerX - logoSize / 2;
            ctx.drawImage(this._fendaLogoCache, logoX, footerY - 30, logoSize, logoSize);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Fenda Music', centerX, footerY + 80);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
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
