# 📝 PATCH: Adicionar Push Notifications ao player.html

## LOCALIZAÇÃO EXATA

Seu player.html atualmente tem (linhas 939-947):

```javascript
    <script src="player-core.js"></script>
    <script src="player-audio-lyrics.js"></script>
    <script src="player-ui.js"></script>
    <script src="player-playlists.js"></script>
    <script src="player-menus-core.js"></script>
    <script src="player-music-actions.js"></script>
    <script src="search.js"></script>
    <script src="player-smart-queue.js"></script>
    <script src="inicio-extras.js"></script>
```

---

## O QUE VOCÊ PRECISA FAZER

**Adicione ESTA linha ANTES de player-core.js:**

```javascript
    <script src="push-notifications-client-v2.js"></script>
    <script src="player-core.js"></script>
```

---

## RESULTADO FINAL

Seu player.html deve ficar assim (linhas 939-948):

```javascript
    <script src="push-notifications-client-v2.js"></script>
    <script src="player-core.js"></script>
    <script src="player-audio-lyrics.js"></script>
    <script src="player-ui.js"></script>
    <script src="player-playlists.js"></script>
    <script src="player-menus-core.js"></script>
    <script src="player-music-actions.js"></script>
    <script src="search.js"></script>
    <script src="player-smart-queue.js"></script>
    <script src="inicio-extras.js"></script>
```

---

## PASSO-A-PASSO (Via GitHub Web)

1. Abra seu repo Fenda Music no GitHub
2. Clique em `player.html`
3. Clique no lápis (Edit) no canto superior direito
4. Procure pela linha `<script src="player-core.js"></script>` (linha ~939)
5. **Clique NO COMEÇO DA LINHA** player-core.js
6. Clique em "Enter" para criar linha nova acima
7. Na linha nova, digite: `    <script src="push-notifications-client-v2.js"></script>`
8. Clique "Commit changes"

**Pronto!**

---

## PASSO-A-PASSO (Localmente, via Git)

Se trabalha localmente:

```bash
# No seu editor, procure a linha:
<script src="player-core.js"></script>

# Adicione ANTES dela:
<script src="push-notifications-client-v2.js"></script>

# Salve o arquivo
# Faça git add/commit/push normalmente
```

---

## VERIFICAÇÃO

Após fazer a mudança:

1. Abra seu site: https://fendamusic.com.br
2. Aperte F12 (DevTools)
3. Console (aba)
4. Procure por: `[Push] Módulo carregado`

Se aparecer em verde, funcionou! ✅

---

## SE ALGO DER ERRADO

Se console mostrar erro tipo `push-notifications-client-v2.js not found`:

1. Confirmar que arquivo foi feito upload ao GitHub
2. Confirmar path está exato (não `push-notification...`, `push-notification...client`)
3. Fazer hard refresh: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)

---

## RESUMO

- **Arquivo:** push-notifications-client-v2.js (upload ao repo)
- **Linha adicionar:** 1 (antes de player-core.js)
- **Tempo:** 2 minutos
- **Difícil:** Não
