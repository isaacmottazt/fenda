// ========== PUSH NOTIFICATIONS - VERSÃO ULTRA-SIMPLES ==========
console.log('[Push] Carregando versão ultra-simples...');

(async function() {
  // Aguardar Supabase estar disponível
  let client = null;
  let retries = 0;
  while (!client && retries < 20) {
    client = window.supabaseClient;
    if (!client) {
      await new Promise(r => setTimeout(r, 100));
      retries++;
    }
  }

  if (!client) {
    console.error('[Push] ❌ Supabase client não disponível após retries');
    return;
  }

  console.log('[Push] ✅ Supabase client encontrado');

  // Dados de notificações já exibidas
  const DISPLAYED_KEY = 'fenda_push_displayed';

  function getDisplayed() {
    try {
      return JSON.parse(localStorage.getItem(DISPLAYED_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function markDisplayed(id) {
    try {
      const arr = getDisplayed();
      if (!arr.includes(id)) {
        arr.push(id);
        if (arr.length > 100) arr.shift();
        localStorage.setItem(DISPLAYED_KEY, JSON.stringify(arr));
      }
    } catch (e) {
      console.warn('[Push] Erro ao marcar:', e);
    }
  }

  function isDisplayed(id) {
    return getDisplayed().includes(id);
  }

  // Função que faz polling
  async function poll() {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        console.log('[Push] Não autenticado');
        return;
      }

      const { data: deliveries, error } = await client
        .from('message_deliveries')
        .select('message_id, admin_messages(id, title, body)')
        .eq('user_id', session.user.id)
        .eq('status', 'pending')
        .limit(10);

      if (error) {
        console.error('[Push] Erro ao buscar:', error.message);
        return;
      }

      if (!deliveries || deliveries.length === 0) {
        return;
      }

      console.log(`[Push] Encontradas ${deliveries.length} notificações`);

      // Processar cada notificação
      for (const delivery of deliveries) {
        const msgData = delivery.admin_messages;
        if (!msgData) continue;

        const msgId = msgData.id;

        // Pular se já exibida
        if (isDisplayed(msgId)) {
          console.log(`[Push] Notificação ${msgId} já exibida`);
          continue;
        }

        console.log(`[Push] Processando ${msgId}: ${msgData.title}`);

        // Adicionar ao painel
        try {
          if (typeof FendaNotifications !== 'undefined' && FendaNotifications.add) {
            FendaNotifications.add({
              type: 'system',
              title: msgData.title,
              body: msgData.body,
              icon: 'notifications',
              iconBg: '#7c3aed'
            });
            console.log(`[Push] ✅ Adicionada ao painel: ${msgId}`);
          }
        } catch (e) {
          console.error('[Push] Erro ao adicionar painel:', e);
        }

        // Exibir notificação nativa
        try {
          if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(msgData.title, {
              body: msgData.body,
              icon: '/icons/icon-192.png',
              tag: `msg-${msgId}`,
              vibrate: [200, 100, 200]
            });
            console.log(`[Push] ✅ Notificação nativa: ${msgId}`);
          }
        } catch (e) {
          console.error('[Push] Erro ao exibir nativa:', e);
        }

        // Marcar como enviada no banco
        try {
          await client
            .from('message_deliveries')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('message_id', msgId)
            .eq('user_id', session.user.id);
            
          console.log(`[Push] ✅ Marcada como enviada: ${msgId}`);
        } catch (e) {
          console.warn('[Push] Erro ao marcar no banco:', e);
        }

        // Marcar localmente
        markDisplayed(msgId);
      }
    } catch (e) {
      console.error('[Push] Erro no polling:', e);
    }
  }

  // Iniciar polling
  console.log('[Push] Iniciando polling cada 10s...');
  
  // Primeira execução
  await poll();
  
  // Depois repetir
  setInterval(poll, 10000);

  // Expor globalmente
  window.pushNotifications = {
    poll: poll,
    clearCache: () => localStorage.removeItem(DISPLAYED_KEY)
  };

  console.log('[Push] ✅ Sistema iniciado com sucesso');
})();
