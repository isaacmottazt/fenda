// ========== PUSH NOTIFICATIONS SIMPLES v6 ==========
// Versão reduzida sem dependencies issues
console.log('[Push] Iniciando v6-simples...');

try {
  const VAPID_PUBLIC_KEY = 'BDScGZPERV87Y9bLVVgxI980FK1-xWIs5hwYXGuwkzAy01PUTTbhU3V1x4QigC_TSLp-0cYH55y_U28nm_SJ_xQ';
  const DISPLAYED_NOTIFICATIONS_KEY = 'fenda_displayed_notifications';

  // ========== HELPERS ==========
  function getDisplayedNotifications() {
    try {
      return JSON.parse(localStorage.getItem(DISPLAYED_NOTIFICATIONS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function markNotificationAsDisplayed(messageId) {
    try {
      const displayed = getDisplayedNotifications();
      if (!displayed.includes(messageId)) {
        displayed.push(messageId);
        if (displayed.length > 100) displayed.shift();
        localStorage.setItem(DISPLAYED_NOTIFICATIONS_KEY, JSON.stringify(displayed));
      }
    } catch (e) {
      console.warn('[Push] Erro ao marcar como exibida:', e);
    }
  }

  function isNotificationAlreadyDisplayed(messageId) {
    return getDisplayedNotifications().includes(messageId);
  }

  function isNotificationPanelOpen() {
    const notifList = document.getElementById('notifList');
    return notifList && notifList.offsetParent !== null;
  }

  function refreshNotificationPanel() {
    try {
      if (typeof FendaNotifications === 'undefined') return;
      const notifList = document.getElementById('notifList');
      if (!notifList) return;
      if (typeof FendaNotifications.openNotifications === 'function') {
        console.log('[Push] 🔄 Recarregando painel');
        FendaNotifications.openNotifications();
      }
    } catch (e) {
      console.warn('[Push] Erro ao atualizar painel:', e);
    }
  }

  // ========== POLLING ==========
  let pollingInterval = null;

  async function startNotificationPolling() {
    if (pollingInterval) {
      console.log('[Push] Polling já está ativo');
      return;
    }

    console.log('[Push] Iniciando polling...');

    const poll = async () => {
      try {
        // Buscar supabaseClient onde quer que esteja
        const client = window.supabaseClient;
        if (!client) {
          console.warn('[Push] supabaseClient não disponível');
          return;
        }

        const { data: { session } } = await client.auth.getSession();
        if (!session) {
          console.warn('[Push] Não autenticado');
          return;
        }

        // Query
        const { data: deliveries, error } = await client
          .from('message_deliveries')
          .select(`message_id, status, admin_messages!inner(id, title, body)`)
          .eq('user_id', session.user.id)
          .eq('status', 'pending')
          .limit(5);

        if (error || !deliveries || deliveries.length === 0) {
          return;
        }

        console.log('[Push] Encontradas', deliveries.length, 'notificações pendentes');

        for (const delivery of deliveries) {
          const msg = delivery.admin_messages;
          const messageId = msg.id;

          // Deduplicação
          if (isNotificationAlreadyDisplayed(messageId)) {
            console.log('[Push] ℹ️ Notificação já foi exibida, pulando');
            continue;
          }

          // Substituir variáveis
          let body = msg.body;
          const userProfile = AppState?.userProfile || {};
          const userName = userProfile.full_name || session.user.user_metadata?.full_name || 'Usuário';
          body = body.replace(/{user_name}/g, userName);

          // Exibir nativa
          if (Notification.permission === 'granted') {
            try {
              const registration = await navigator.serviceWorker.ready;
              await registration.showNotification(msg.title, {
                body,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-96.png',
                tag: `msg-${messageId}`,
                vibrate: [200, 100, 200]
              });
              console.log('[Push] ✅ Notificação exibida ao usuário (nativa)');
            } catch (e) {
              console.error('[Push] Erro ao exibir nativa:', e);
            }
          }

          // Adicionar ao painel
          try {
            if (typeof FendaNotifications !== 'undefined' && FendaNotifications.add) {
              FendaNotifications.add({
                type: 'system',
                title: msg.title,
                body: body,
                icon: 'notifications',
                iconBg: '#7c3aed'
              });
              console.log('[Push] ✅ Adicionada ao painel do app');
              if (isNotificationPanelOpen()) {
                refreshNotificationPanel();
              }
            }
          } catch (e) {
            console.error('[Push] Erro ao adicionar ao painel:', e);
          }

          // Marcar como enviada
          try {
            await client
              .from('message_deliveries')
              .update({ status: 'sent', sent_at: new Date() })
              .eq('message_id', messageId)
              .eq('user_id', session.user.id);
            console.log('[Push] ✅ Marcada como enviada');
          } catch (e) {
            console.warn('[Push] Erro ao marcar como enviada:', e);
          }

          // Marcar localmente
          markNotificationAsDisplayed(messageId);
        }
      } catch (e) {
        console.error('[Push] Erro no polling:', e);
      }
    };

    await poll();
    pollingInterval = setInterval(poll, 10000);
  }

  function stopNotificationPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      console.log('[Push] ⏹️ Polling parado');
    }
  }

  // ========== INICIAR ==========
  window.addEventListener('load', async () => {
    console.log('[Push] Iniciando setup na carga...');
    setTimeout(() => {
      try {
        startNotificationPolling().catch(e => console.error('[Push] Erro:', e));
        console.log('[Push] ✅ Sistema iniciado');
      } catch (e) {
        console.error('[Push] Erro na inicialização:', e);
      }
    }, 1500);
  });

  // ========== EXPOSIÇÃO ==========
  window.pushNotifications = {
    startPolling: startNotificationPolling,
    stopPolling: stopNotificationPolling,
    clearCache: () => {
      localStorage.removeItem(DISPLAYED_NOTIFICATIONS_KEY);
      console.log('[Push] 🗑️ Cache limpo');
    }
  };

  console.log('[Push] v6-simples carregado ✅');

} catch (e) {
  console.error('[Push] ERRO CRÍTICO:', e);
}
