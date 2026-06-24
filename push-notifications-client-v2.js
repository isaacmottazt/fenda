// ========== PUSH NOTIFICATIONS - FENDA MUSIC CLIENT (v2) ==========
// Compatível com sw.js v16 existente
// Coloque isto APÓS supabase-config.js e ANTES de player-core.js

const VAPID_PUBLIC_KEY = 'BDScGZPERV87Y9bLVVgxI980FK1-xWIs5hwYXGuwkzAy01PUTTbhU3V1x4QigC_TSLp-0cYH55y_U28nm_SJ_xQ';

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
    // SW já deve estar registrado, mas vamos guarantir
    const registration = await navigator.serviceWorker.ready;
    console.log('[Push] Service Worker pronto');

    // Pedir permissão se necessário
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      console.log('[Push] Permissão:', perm);
    }

    // Se tem permissão, inscrever
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
    // Verificar subscription existente
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

    // Salvar no Supabase
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
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      console.warn('[Push] Não autenticado');
      return false;
    }

    const { endpoint, keys } = subscription.toJSON();
    
    const { error } = await supabaseClient
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
      console.error('[Push] Erro ao salvar:', error);
      return false;
    }
    console.log('[Push] ✅ Subscription salva');
    return true;
  } catch (e) {
    console.error('[Push] Erro:', e);
    return false;
  }
}

// ========== POLLING DE NOTIFICAÇÕES (Backup) ==========
let pollingInterval = null;
const POLLING_INTERVAL = 10000; // 10 segundos

async function startNotificationPolling() {
  if (pollingInterval) return;
  
  console.log('[Push] Iniciando polling');

  const poll = async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) return;

      const { data: deliveries, error } = await supabaseClient
        .from('message_deliveries')
        .select(`
          message_id,
          status,
          admin_messages!inner(id, title, body, template_type, created_at)
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'pending')
        .limit(5);

      if (error || !deliveries) return;

      for (const d of deliveries) {
        const msg = d.admin_messages;
        
        // Substituir variáveis
        let body = msg.body
          .replace('{user_name}', AppState?.userProfile?.full_name || 'Usuário')
          .replace('{user_email}', session.user.email || '');

        // Exibir notificação nativa (se permitido)
        if (Notification.permission === 'granted') {
          try {
            // Mandar para SW exibir (compatível com o push handler existente)
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(msg.title, {
              body,
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-96.png',
              tag: `msg-${msg.id}`,
              data: {
                url: '/inicio',
                messageId: msg.id
              }
            });
          } catch (e) {
            console.error('[Push] Erro ao exibir:', e);
          }
        }

        // Marcar como enviada
        await supabaseClient
          .from('message_deliveries')
          .update({ status: 'sent' })
          .eq('message_id', msg.id)
          .eq('user_id', session.user.id)
          .catch(e => console.warn('[Push] Erro ao atualizar:', e));
      }
    } catch (e) {
      console.error('[Push] Erro no polling:', e);
    }
  };

  // Executar uma vez agora
  await poll();

  // Depois repetir
  pollingInterval = setInterval(poll, POLLING_INTERVAL);
}

function stopNotificationPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('[Push] Polling parado');
  }
}

// ========== OUVIR MENSAGENS DO SW ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    const { type, url, musicId } = event.data;

    if (type === 'NOTIFICATION_CLICK') {
      console.log('[Push] Notificação clicada:', url, musicId);
      // Aqui você pode navegar ou fazer algo com a música
      if (musicId && typeof window.playMusicTrack === 'function') {
        const track = AppState?.musics?.find(m => m.id == musicId);
        if (track) window.playMusicTrack(track);
      }
      if (url) window.history.pushState(null, '', url);
    }
  });
}

// ========== INICIAR TUDO ==========
window.addEventListener('load', async () => {
  console.log('[Push] Iniciando setup...');
  
  // Aguardar um pouco para garantir que supabaseClient existe
  setTimeout(async () => {
    try {
      // Tentar setup de push real
      const pushOk = await setupPushNotifications();
      console.log('[Push] Web Push:', pushOk ? '✅' : '⚠️ Fallback para polling');

      // Sempre iniciar polling (funciona mesmo sem push real)
      await startNotificationPolling();
    } catch (e) {
      console.error('[Push] Erro na inicialização:', e);
    }
  }, 1500);
});

// Limpar ao deslogar
window.addEventListener('beforeunload', () => {
  stopNotificationPolling();
});

// ========== FUNÇÃO GLOBAL ==========
window.pushNotifications = {
  setup: setupPushNotifications,
  startPolling,
  stopPolling: stopNotificationPolling,
  subscribe: subscribeUserToPush
};

console.log('[Push] Módulo carregado ✅');
