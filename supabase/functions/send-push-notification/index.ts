    }

    // Auth: cron vs JWT
    const isCronAction = action === 'send_climate_alerts' || action === 'send_logging_reminders';
    if (isCronAction) {
      const cronHeader = req.headers.get('x-cron-secret');
      if (!cronSecret || cronSecret.length < MIN_CRON_SECRET_LENGTH) {
        console.error('CRON_SECRET too short:', cronSecret?.length || 0);
        return new Response(JSON.stringify({ error: 'Server config error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!cronHeader || cronHeader !== cronSecret) {
        console.error('Cron auth failed. Header present:', !!cronHeader);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      // FIXED: was using getClaims() which does not exist in Supabase JS v2
      // Now using getUser() which is the correct method
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !userData?.user?.id) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const authenticatedUserId = userData.user.id;
      if (action === 'send_to_user' && userId && userId !== authenticatedUserId) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (action === 'send_to_endpoint' && endpoint) {
        const { data: sc } = await supabase.from('push_subscriptions').select('user_id').eq('endpoint', endpoint).single();
        if (sc && sc.user_id !== authenticatedUserId) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    // send_to_user
    if (action === 'send_to_user' && userId) {
      const { data: subscriptions } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId).eq('is_active', true);
      const results = await Promise.all(
        (subscriptions || []).map(async (sub: any) => {
          const result = await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            notification,
          );
          if (!result.success && result.error === 'subscription_expired') {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
          return result;
        })
      );
      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // send_to_endpoint
    if (action === 'send_to_endpoint' && endpoint) {
      const { data: subscription } = await supabase.from('push_subscriptions').select('*').eq('endpoint', endpoint).eq('is_active', true).single();
      if (!subscription) throw new Error('Subscription not found');
      const result = await sendPushNotification(
        { endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth },
        notification,
      );
      return new Response(JSON.stringify({ success: result.success, error: result.error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // LOGGING REMINDERS (every 4 hours, max 6/day)
    if (action === 'send_logging_reminders') {
      const { data: subscriptions } = await supabase.from('push_subscriptions').select('*').eq('is_active', true);
      const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
      const now = Date.now();
      let sent = 0, skipped = 0, failed = 0;

      for (const sub of subscriptions || []) {
        try {
          const todayCount = await getNotificationCountToday(supabase, sub.id, 'logging_reminder');
          if (todayCount >= 6) { skipped++; continue; }

          if (sub.last_reminder_sent_at) {
            const lastSent = new Date(sub.last_reminder_sent_at).getTime();
            if (now - lastSent < FOUR_HOURS_MS) { skipped++; continue; }
          }

          if (sub.user_id) {
            const { data: lastEpisode } = await supabase
              .from('episodes')
              .select('created_at')
              .eq('user_id', sub.user_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (lastEpisode) {
              const lastLogTime = new Date(lastEpisode.created_at).getTime();
              if (now - lastLogTime < FOUR_HOURS_MS) { skipped++; continue; }
            }
          }

          const result = await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            {
              title: '⏰ Time to Log Your Episode',
              body: 'Record your sweat level for the last 4 hours for accurate tracking.',
              tag: 'logging-reminder',
              type: 'reminder',
              url: '/log-episode',
            },
          );

          if (result.success) {
            sent++;
            await logNotification(supabase, sub.id, sub.user_id, 'logging_reminder');
            await supabase.from('push_subscriptions').update({ last_reminder_sent_at: new Date().toISOString() }).eq('id', sub.id);
          } else {
            failed++;
            if (result.error === 'subscription_expired') {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            }
          }
        } catch (err) {
          console.error('Reminder error for sub:', sub.id, err);
          failed++;
        }
      }

      console.log(`Logging reminders: sent=${sent}, skipped=${skipped}, failed=${failed}`);
      return new Response(JSON.stringify({ success: true, sent, skipped, failed, total: subscriptions?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CLIMATE ALERTS (server-side weather, max 6/day)
    if (action === '
