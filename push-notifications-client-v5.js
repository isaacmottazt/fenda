// ========== PUSH NOTIFICATIONS - FENDA MUSIC CLIENT (v5) ==========
// Versão com detecção robusta de dependências
// Compatível com sw.js v16 existente
// Carregue APÓS supabase-config.js, notifications.js, player-core.js

const VAPID_PUBLIC_KEY = 'BDScGZPERV87Y9bLVVgxI980FK1-xWIs5hwYXGuwkzAy01PUTTbhU3V1x4QigC_TSLp-0cYH55y_U28nm_SJ_xQ';

// ========== VERIFICAÇÃO DE DEPENDÊNCIAS COM RETRY ==========
let supabaseClient;
let retryCount = 0;
const MAX_RETRIES = 5;

function ensureDependencies() {
  return new Promise((resolve) => {
    const checkDeps = () => {
      // Tentar múltiplas formas de acessar supabaseClient
      if (typeof supabaseClient === 'undefined') {
        // Procurar em window
        if (window.supabaseClient) {
          supabaseClient = window.supabaseClient;
          console.log('[Push] ✅ supabaseClient encontrado em window');
        }
        // Procurar como global
        else if (typeof window !== 'undefined' && window.supabaseClient) {
          supabaseClient = window.supabaseClient;
          console.log('[Push] ✅ supabaseClient encontrado em window.supabaseClient');
        }
      }

      // Verificar outras dependências
      const hasFendaNotifications = typeof FendaNotifications !== 'undefined';
      const hasAppState = typeof AppState !== 'undefined';
      const hasSupabase = supabaseClient || window.supabaseClient;

      if (hasFendaNotifications && hasAppState && hasSupabase) {
        console.log('[Push] ✅ Todas as dependências carregadas');
        resolve(true);
      } else if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log('[Push] ⏳ Aguardando dependências... retry', retryCount);
        setTimeout(checkDeps, 300);
      } else {
        console.error('[Push] ❌ Timeout esperando dependências');
        console.log('[Push] Debug:', {
          FendaNotifications: typeof FendaNotifications,
          AppState: typeof AppState,
          supabaseClient: typeof supabaseClient || typeof window.supabaseClient
        });
        resolve(false);
      }
    };
    checkDeps();
  });
}

// ========== CACHE LOCAL DE NOTIFICAÇÕES EXIBIDAS ==========
const DISPLAYED_NOTIFICATIONS_KEY = 'fenda_displayed_notifications';

function getDisplayedNotifications() {
  try {
    return JSON.parse(localStorage.getItem(DISPLAYED_NOTIFICATIONS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDisplayedNotifications(ids) {
  localStorage.setItem(DISPLAYED_NOTIFICATIONS_KEY, JSON.stringify(ids));
}

function markNotificationAsDisplayed(messageId) {
  const displayed = getDisplayedNotifications();
  if (!displayed.includes(messageId)) {
    displayed.push(messageId);
    if (displayed.length > 100) {
      displayed.shift();
    }
    saveDisplayedNotifications(displayed);
  }
}

function isNotificationAlreadyDisplayed(messageId) {
  return getDisplayedNotifications().includes(messageId);
}

// ========== CONVERTER BASE64 PARA UINT8ARRAY ==========
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ========== REGISTRAR SERVICE WORKER E PUSH ==========
async function setupPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Navegador não suporta push notifications');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('[Push] Service Worker pronto para push');

    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      console.log('[Push] Permissão solicitada:', perm);
    }

    if (Notification.permission === 'granted') {
      await subscribeUserToPush(registration);
      return true;
    }
    return false;
  } catch (e) {
    console.error('[Push] Erro ao setup:', e);
    return false;
  }
}

// ========== INSCREVER USER EM PUSH ==========
async function subscribeUserToPush(registration) {
  try {
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('[Push] Nova subscription criada');
    } else {
      console.log('[Push] Usando subscription existente');
    }

    await savePushSubscription(subscription);
    return true;
  } catch (e) {
    console.error('[Push] Erro ao inscrever:', e);
    return false;
  }
}

// ========== SALVAR SUBSCRIPTION NO BANCO ==========
async function savePushSubscription(subscription) {
  try {
    // Usar variável local se disponível
    const client = supabaseClient || window.supabaseClient;
    if (!client) {
      console.error('[Push] supabaseClient não disponível');
      return false;
    }

    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      console.warn('[Push] Não autenticado, subscription não salva');
      return false;
    }

    const { endpoint, keys } = subscription.toJSON();
    
    const { error } = await client
      .from('push_subscriptions')
      .upsert({
        user_id: session.user.id,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        updated_at: new Date()
      }, {
        onConflict: 'endpoint'
      });

    if (error) {
      console.error('[Push] Erro ao salvar subscription:', error);
      return false;
    }
    console.log('[Push] ✅ Subscription salva no banco');
    return true;
  } catch (e) {
    console.error('[Push] Erro ao salvar:', e);
    return false;
  }
}

// ========== HELPER: Verificar se painel está aberto ==========
function isNotificationPanelOpen() {
  const notifList = document.getElementById('notifList');
  return notifList && notifList.offsetParent !== null;
}

// ========== HELPER: Forçar re-render do painel ==========
function refreshNotificationPanel() {
  try {
    if (typeof FendaNotifications === 'undefined') return;
    
    const notifList = document.getElementById('notifList');
    if (!notifList) return;
    
    if (typeof FendaNotifications.openNotifications === 'function') {
      console.log('[Push] 🔄 Recarregando painel de notificações');
      FendaNotifications.openNotifications();
    }
  } catch (e) {
    console.warn('[Push] Erro ao atualizar painel:', e);
  }
}

// ========== POLLING DE NOTIFICAÇÕES ==========
let pollingInterval = null;
const POLLING_INTERVAL = 10000;

async function startNotificationPolling() {
  if (pollingInterval) {
    console.log('[Push] Polling já está ativo');
    return;
  }
  
  console.log('[Push] Iniciando polling de notificações');

  const poll = async () => {
    try {
      const client = supabaseClient || window.supabaseClient;
      if (!client) {
        console.warn('[Push] supabaseClient não disponível, poll abortado');
        return;
      }

      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        console.warn('[Push] Não autenticado, poll abortado');
        return;
      }

      // Buscar mensagens pendentes
      const { data: deliveries, error } = await client
        .from('message_deliveries')
        .select(`
          message_id,
          status,
          admin_messages!inner(id, title, body, template_type, created_at)
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'pending')
        .limit(5);

      if (error) {
        console.warn('[Push] Erro no poll:', error);
        return;
      }

      if (!deliveries || deliveries.length === 0) {
        return;
      }

      console.log('[Push] Encontradas', deliveries.length, 'notificações pendentes');

      let anyNotificationAdded = false;

      for (const delivery of deliveries) {
        const msg = delivery.admin_messages;
        const messageId = msg.id;

        // Deduplicação
        if (isNotificationAlreadyDisplayed(messageId)) {
          console.log('[Push] ℹ️ Notificação', messageId, 'já foi exibida, pulando');
          continue;
        }

        // Substituir variáveis
        let body = msg.body;
        const userProfile = AppState?.userProfile || {};
        const userName = userProfile.full_name || session.user.user_metadata?.full_name || 'Usuário';
        const userEmail = session.user.email || '';
        
        body = body
          .replace(/{user_name}/g, userName)
          .replace(/{user_email}/g, userEmail);

        console.log('[Push] Processando notificação:', msg.title);

        // Exibir notificação nativa
        if (Notification.permission === 'granted') {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(msg.title, {
              body,
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-96.png',
              tag: `msg-${messageId}`,
              data: {
                url: '/inicio',
                messageId: messageId
              },
              vibrate: [200, 100, 200]
            });
            console.log('[Push] ✅ Notificação exibida ao usuário (nativa)');
          } catch (e) {
            console.error('[Push] Erro ao exibir notificação nativa:', e);
          }
        }

        // Adicionar ao painel do app
        try {
          if (typeof FendaNotifications !== 'undefined' && FendaNotifications.add) {
            FendaNotifications.add({
              type: 'system',
              title: msg.title,
              body: body,
              icon: 'notifications',
              iconBg: '#7c3aed',
              image: null
            });
            console.log('[Push] ✅ Notificação adicionada ao painel do app');
            anyNotificationAdded = true;
          } else {
            console.warn('[Push] ⚠️ FendaNotifications não disponível');
          }
        } catch (e) {
          console.error('[Push] Erro ao adicionar ao painel:', e);
        }

        // Marcar como enviada
        try {
          await client
            .from('message_deliveries')
            .update({ 
              status: 'sent', 
              sent_at: new Date() 
            })
            .eq('message_id', messageId)
            .eq('user_id', session.user.id);
          console.log('[Push] ✅ Marcada como enviada no banco');
        } catch (e) {
          console.warn('[Push] Erro ao marcar como enviada:', e);
        }

        // Marcar como exibida localmente
        markNotificationAsDisplayed(messageId);
        console.log('[Push] ✅ Marcada como exibida localmente');
      }

      // Atualizar painel se aberto
      if (anyNotificationAdded && isNotificationPanelOpen()) {
        refreshNotificationPanel();
      }
    } catch (e) {
      console.error('[Push] Erro crítico no polling:', e);
    }
  };

  // Executar uma vez imediatamente
  await poll();

  // Depois repetir
  pollingInterval = setInterval(poll, POLLING_INTERVAL);
}

function stopNotificationPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('[Push] ⏹️ Polling parado');
  }
}

// ========== OUVIR MENSAGENS DO SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    const { type, url, musicId } = event.data;

    if (type === 'NOTIFICATION_CLICK') {
      console.log('[Push] Notificação clicada:', url, musicId);
      
      if (musicId && typeof window.playMusicTrack === 'function') {
        const track = AppState?.musics?.find(m => m.id == musicId);
        if (track) {
          console.log('[Push] Tocando música:', track.name);
          window.playMusicTrack(track);
        }
      }
      
      if (url) {
        window.history.pushState(null, '', url);
      }
    }
  });
}

// ========== INICIAR TUDO QUANDO DEPENDÊNCIAS CARREGAREM ==========
window.addEventListener('load', async () => {
  console.log('[Push] Sistema de notificações carregando...');
  
  setTimeout(async () => {
    try {
      // Aguardar dependências
      const depsReady = await ensureDependencies();
      
      if (!depsReady) {
        console.error('[Push] ❌ Dependências não estão disponíveis');
        return;
      }

      // Setup push
      const pushOk = await setupPushNotifications();
      console.log('[Push] Web Push:', pushOk ? '✅ Inscrito' : '⚠️ Fallback para polling');

      // Iniciar polling
      await startNotificationPolling();
      console.log('[Push] ✅ Sistema pronto');
    } catch (e) {
      console.error('[Push] Erro na inicialização:', e);
    }
  }, 1500);
});

// Limpar ao deslogar
window.addEventListener('beforeunload', () => {
  stopNotificationPolling();
});

// ========== EXPOSIÇÃO DE FUNÇÕES GLOBAIS ==========
window.pushNotifications = {
  setup: setupPushNotifications,
  startPolling: startNotificationPolling,
  stopPolling: stopNotificationPolling,
  subscribe: subscribeUserToPush,
  clearDisplayedCache: () => {
    saveDisplayedNotifications([]);
    console.log('[Push] 🗑️ Cache de notificações exibidas limpo');
  },
  refreshPanel: refreshNotificationPanel
};

console.log('[Push] Módulo v5 carregado ✅');
