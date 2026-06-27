// ===== GERENCIADOR DE MODO PREVIEW (30s para links compartilhados) =====

const PreviewManager = {
    _previewEndTime: null,
    _isPreviewMode: false,
    _previewIndicator: null,

    /**
     * Inicia modo preview para link compartilhado
     * @param {HTMLAudioElement} audioElement - Elemento de áudio
     * @param {number} startTime - Tempo de início do preview
     */
    initializePreview(audioElement, startTime = 0) {
        if (!audioElement) return;

        this._isPreviewMode = SharedMusicModule.isPreviewMode();
        
        if (!this._isPreviewMode) {
            this._cleanup();
            return;
        }

        // Tempo de fim do preview: 30 segundos a partir do início
        this._previewEndTime = startTime + 30;

        console.log(`[Preview] Modo ativo: ${startTime}s a ${this._previewEndTime}s`);

        // Remover listeners antigos
        this._cleanup();

        // Listener no evento timeupdate
        audioElement.addEventListener('timeupdate', this._handleTimeUpdate.bind(this));
        audioElement.addEventListener('loadedmetadata', this._setupPreviewUI.bind(this));

        // Criar indicador visual de preview
        this._createPreviewIndicator();
    },

    /**
     * Monitora o tempo de reprodução
     * @private
     */
    _handleTimeUpdate(e) {
        const audio = e.target;
        const currentTime = audio.currentTime;

        if (!this._isPreviewMode || !this._previewEndTime) return;

        // Se ultrapassou o tempo de preview, pausar
        if (currentTime >= this._previewEndTime) {
            audio.pause();
            audio.currentTime = this._previewEndTime - 0.1;
            
            this._showPreviewEndedNotification();
            this._disablePlayButton();

            return;
        }

        // Se faltam menos de 5 segundos, avisar
        const timeLeft = this._previewEndTime - currentTime;
        if (timeLeft <= 5 && timeLeft > 4.9) {
            this._showPreviewWarning(timeLeft);
        }
    },

    /**
     * Configura UI quando áudio carrega
     * @private
     */
    _setupPreviewUI() {
        if (!this._isPreviewMode) return;

        const audio = document.querySelector('audio');
        if (!audio) return;

        // Se a duração real é menor que 30s, usar a duração real
        const duration = audio.duration || 0;
        const endTime = Math.min(this._previewEndTime, duration);
        this._previewEndTime = endTime;

        console.log(`[Preview] Duração da música: ${duration}s, fim do preview: ${endTime}s`);

        // Desabilitar scrub após 30s
        this._restrictProgressBar();
    },

    /**
     * Restringe a barra de progresso ao período de preview
     * @private
     */
    _restrictProgressBar() {
        const progressContainer = document.querySelector('.progress-container');
        const progressThumb = document.getElementById('progressThumb');

        if (!progressContainer) return;

        // Marca a posição de 30s visualmente
        const markerPos = (this._previewEndTime / (document.querySelector('audio')?.duration || 100)) * 100;
        
        // Adicionar estilo visual
        if (!document.getElementById('preview-marker-style')) {
            const style = document.createElement('style');
            style.id = 'preview-marker-style';
            style.textContent = `
                .progress-container.preview-mode::after {
                    content: '';
                    position: absolute;
                    left: calc(${markerPos}% - 2px);
                    top: 0;
                    width: 4px;
                    height: 100%;
                    background: rgba(124, 58, 237, 0.5);
                    border-left: 1px solid #7c3aed;
                    z-index: 5;
                }
            `;
            document.head.appendChild(style);
        }

        progressContainer.classList.add('preview-mode');

        // Capturar interações de scrub
        let isMouseDown = false;
        progressContainer.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            this._validateAndLimitScrub(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isMouseDown && progressContainer.contains(e.target)) {
                this._validateAndLimitScrub(e);
            }
        });

        document.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        // Também para touch
        progressContainer.addEventListener('touchstart', (e) => {
            this._validateAndLimitScrub(e);
        });

        progressContainer.addEventListener('touchmove', (e) => {
            this._validateAndLimitScrub(e);
        });
    },

    /**
     * Valida e limita tentativas de scrubbing após 30s
     * @private
     */
    _validateAndLimitScrub(e) {
        if (!this._isPreviewMode) return;

        const audio = document.querySelector('audio');
        if (!audio) return;

        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const percentage = x / rect.width;
        const seekTime = percentage * (audio.duration || 0);

        // Limitar ao tempo de preview
        if (seekTime > this._previewEndTime) {
            e.preventDefault();
            audio.currentTime = this._previewEndTime - 0.1;
            showToast('Preview limitado a 30 segundos', 'info');
            return;
        }

        audio.currentTime = seekTime;
    },

    /**
     * Cria indicador visual de modo preview
     * @private
     */
    _createPreviewIndicator() {
        if (document.getElementById('preview-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'preview-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #7c3aed, #5b21b6);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                animation: slideIn 0.3s ease-out;
            ">
                <span style="font-size: 18px;">⏱️</span>
                <span>Preview: 30 segundos</span>
            </div>
            <style>
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            </style>
        `;
        document.body.appendChild(indicator);
        this._previewIndicator = indicator;
    },

    /**
     * Mostra aviso quando faltam poucos segundos
     * @private
     */
    _showPreviewWarning(timeLeft) {
        const existingWarning = document.getElementById('preview-warning');
        if (existingWarning) return;

        const warning = document.createElement('div');
        warning.id = 'preview-warning';
        warning.innerHTML = `
            <div style="
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: #ff9500;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                font-weight: bold;
                z-index: 10000;
                animation: popIn 0.3s ease-out;
            ">
                ⏰ Faltam ${Math.ceil(timeLeft)}s do preview!
            </div>
            <style>
                @keyframes popIn {
                    from {
                        transform: translateX(-50%) scale(0.8);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) scale(1);
                        opacity: 1;
                    }
                }
            </style>
        `;
        document.body.appendChild(warning);

        setTimeout(() => warning.remove(), 3000);
    },

    /**
     * Mostra notificação quando preview termina
     * @private
     */
    _showPreviewEndedNotification() {
        const existingNotif = document.getElementById('preview-ended-notif');
        if (existingNotif) return;

        const notif = document.createElement('div');
        notif.id = 'preview-ended-notif';
        notif.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                color: #1a1a2e;
                padding: 32px 40px;
                border-radius: 12px;
                text-align: center;
                z-index: 10000;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                max-width: 400px;
                animation: zoomIn 0.3s ease-out;
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">🎵</div>
                <h3 style="margin: 0 0 12px; font-size: 20px;">Preview Expirado</h3>
                <p style="margin: 0 0 20px; color: #666; font-size: 14px;">
                    Adicione esta música à sua biblioteca para ouvir completo!
                </p>
                <button onclick="this.closest('div').parentElement.remove()" style="
                    background: #7c3aed;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 14px;
                ">Fechar</button>
            </div>
            <style>
                @keyframes zoomIn {
                    from {
                        transform: translate(-50%, -50%) scale(0.7);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
            </style>
        `;
        document.body.appendChild(notif);

        setTimeout(() => notif.remove(), 5000);
    },

    /**
     * Desabilita o botão de play após preview
     * @private
     */
    _disablePlayButton() {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.disabled = true;
            playBtn.style.opacity = '0.5';
            playBtn.title = 'Preview expirado. Adicione à biblioteca para ouvir completo.';
        }
    },

    /**
     * Limpar listeners
     * @private
     */
    _cleanup() {
        const audio = document.querySelector('audio');
        if (audio) {
            // Clone para remover todos os listeners (simplest way)
            const newAudio = audio.cloneNode(true);
            audio.parentNode.replaceChild(newAudio, audio);
        }

        if (this._previewIndicator) {
            this._previewIndicator.remove();
            this._previewIndicator = null;
        }

        this._isPreviewMode = false;
        this._previewEndTime = null;
    },

    /**
     * Retorna status do preview
     */
    getStatus() {
        return {
            isActive: this._isPreviewMode,
            endTime: this._previewEndTime
        };
    }
};

window.PreviewManager = PreviewManager;
