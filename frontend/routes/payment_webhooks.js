// Payment Webhooks — Stripe + NOWPayments IPN handlers
// Extracted from server.js (Session 19 refactor)
// All external dependencies are passed via dependency injection.
import { recordIndicatorPurchase } from './indicator_access.js';

export default function registerPaymentWebhookRoutes(
  app,
  {
    getStripeInstance,
    sendChatNotification,
    recordAffiliationConversion,
    getResendClient,
    STRIPE_SECRET_KEY,
    checkoutRecovery, // { handleExpiredCheckout, markCompleted }
    winBack,          // { handleSubscriptionCanceled, markReactivated }
    getReferralHandler, // () => async ({refCode,filleulEmail,amount,sessionId}) — anti-fraud + free month credit
  }
) {
  // ─── POST /api/v1/payment/stripe_webhook ──────────────────────────────────
  app.post('/api/v1/payment/stripe_webhook', async (req, res) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const sig = req.headers['stripe-signature'] || '';

    let event;
    try {
      if (webhookSecret && sig && STRIPE_SECRET_KEY) {
        const stripe = await getStripeInstance();
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // Dev mode: parse body directly
        event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (Buffer.isBuffer(event)) event = JSON.parse(event.toString());
      }
    } catch (err) {
      console.error('[Payment] Stripe webhook signature error:', err.message);
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const eventType = event.type || event?.type;
    console.log(`[Payment] Stripe webhook event: ${eventType}`);

    if (eventType === 'checkout.session.completed') {
      const session = event.data?.object || {};
      const metadata = session.metadata || {};
      // Mark as recovered if this was a previously abandoned checkout
      try { checkoutRecovery?.markCompleted?.(session.id, metadata.promo_code || null); } catch { /* ignore */ }
      // Mark as reactivated for win-back tracking if this email had a canceled sub
      const _email_for_winback = session.customer_details?.email || session.customer_email || null;
      try { if (_email_for_winback) winBack?.markReactivated?.(_email_for_winback); } catch { /* ignore */ }
      const email = session.customer_details?.email || session.customer_email || null;
      const amountTotal = (session.amount_total || 0) / 100; // cents → dollars
      const planLabel = metadata.plan || (metadata.product === 'indicators_suite' ? `Suite Indicateurs (${metadata.billing || '?'})` : 'N/A');
      console.log(`[Payment] ✅ checkout.session.completed: plan=${planLabel}, billing=${metadata.billing_period || metadata.billing}, email=${email}, amount=${amountTotal}`);

      // 💬 Discord/Slack notification (instant)
      sendChatNotification({
        title: `💰 +$${amountTotal.toFixed(2)} — Nouvelle vente !`,
        lines: [
          `**Plan** : ${planLabel} (${metadata.billing_period || metadata.billing || 'monthly'})`,
          `**Client** : ${email || 'N/A'}`,
          `**Montant** : $${amountTotal.toFixed(2)} CAD`,
          metadata.promo_code ? `**Promo** : ${metadata.promo_code} (-${metadata.discount_pct || '?'}%)` : null,
          metadata.ref_code ? `**Affilié** : ${metadata.ref_code} → commission $${(amountTotal * 0.30).toFixed(2)}` : null,
        ].filter(Boolean).join('\n'),
        color: 0x10b981, // emerald
      }).catch(() => {});

      // 🤝 Affiliation conversion (PAYMENT confirmed) + 🎁 Referral free-month credit (with anti-fraud)
      if (metadata.ref_code && amountTotal > 0) {
        try {
          const handler = getReferralHandler?.();
          if (handler) {
            const result = await handler({
              refCode: metadata.ref_code,
              filleulEmail: email,
              amount: amountTotal,
              sessionId: session.id,
              stripeCustomerId: session.customer || null,
            });
            console.log(`[Referral] Conversion result: ${JSON.stringify(result)}`);
          } else {
            // Fallback: just record the conversion (no anti-fraud / no credit)
            recordAffiliationConversion({ code: metadata.ref_code, type: 'payment', amount: amountTotal, email });
          }
        } catch (e) {
          console.error('[Referral] payment conversion error:', e?.message);
          // Still record raw affiliation event as fallback
          try { recordAffiliationConversion({ code: metadata.ref_code, type: 'payment', amount: amountTotal, email }); } catch {}
        }
      }

      // 🚨 Admin notification email (nouvelle vente !)
      (async () => {
        try {
          const client = await getResendClient();
          if (!client) return;
          const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
          const adminEmail = process.env.ADMIN_EMAIL || 'cryptoia2026@gmail.com';
          const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#0A0E1A;color:#e2e8f0;padding:32px;"><div style="max-width:520px;margin:0 auto;background:linear-gradient(140deg,#0f172a,#1e1b4b);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px;"><div style="text-align:center;margin-bottom:24px;"><div style="display:inline-block;width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#10b981,#06b6d4);line-height:56px;font-size:24px;">💰</div><h1 style="margin:12px 0 0;color:#fff;font-size:22px;">Nouvelle vente CryptoIA !</h1></div><table cellpadding="8" style="width:100%;border-spacing:0;"><tr><td style="color:#94a3b8;font-size:12px;">Plan</td><td style="color:#fff;font-weight:700;">${metadata.plan || 'N/A'} (${metadata.billing_period || 'monthly'})</td></tr><tr><td style="color:#94a3b8;font-size:12px;">Email client</td><td style="color:#fff;font-weight:700;">${email || 'N/A'}</td></tr><tr><td style="color:#94a3b8;font-size:12px;">Montant</td><td style="color:#34d399;font-weight:900;font-size:18px;">$${amountTotal.toFixed(2)} CAD</td></tr>${metadata.promo_code ? `<tr><td style="color:#94a3b8;font-size:12px;">Code promo</td><td style="color:#fbbf24;font-family:monospace;">${metadata.promo_code} (-${metadata.discount_pct || '?'}%)</td></tr>` : ''}${metadata.ref_code ? `<tr><td style="color:#94a3b8;font-size:12px;">Affilié</td><td style="color:#a78bfa;font-family:monospace;">${metadata.ref_code} → commission $${(amountTotal * 0.30).toFixed(2)}</td></tr>` : ''}</table><div style="text-align:center;margin-top:24px;"><a href="https://www.cryptoia.ca/admin/analytics" style="display:inline-block;padding:12px 24px;border-radius:10px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;font-weight:900;text-decoration:none;text-transform:uppercase;font-size:12px;letter-spacing:1px;">📊 Voir le dashboard</a></div></div></body></html>`;
          await client.emails.send({
            from: sender,
            to: [adminEmail],
            subject: `💰 +$${amountTotal.toFixed(2)} — Nouvelle vente CryptoIA ${metadata.plan || ''}`,
            html,
          });
          console.log(`[AdminAlert] Sale notification sent to ${adminEmail}`);
        } catch (e) {
          console.error('[AdminAlert] error:', e?.message);
        }
      })();

      // 🎯 Suite Indicateurs — email automatique au client pour obtenir son username TradingView
      if (metadata.product === 'indicators_suite' && email) {
        try {
          recordIndicatorPurchase({ email, billing: metadata.billing, amount: amountTotal, sessionId: session.id });
        } catch (e) {
          console.error('[IndicatorAccess] record error:', e?.message);
        }
        (async () => {
          try {
            const client = await getResendClient();
            if (!client) return;
            const sender = process.env.SENDER_EMAIL || 'CryptoIA <onboarding@resend.dev>';
            const adminEmail = process.env.ADMIN_EMAIL || 'cryptoia2026@gmail.com';
            const billingLabel = { monthly: 'Mensuel', annual: 'Annuel', lifetime: 'Licence à vie' }[metadata.billing] || metadata.billing || '';
            const replyHref = `mailto:${adminEmail}?subject=${encodeURIComponent('Mon username TradingView — Suite Indicateurs CryptoIA')}&body=${encodeURIComponent("Bonjour,\n\nVoici mon nom d'utilisateur TradingView : \n\nMerci !")}`;
            const indicatorsList = ['Magic JB IA', 'RiskGlow', 'WaveRider Divergence Oscillator', 'GoodGuys Spot Daily', 'DivergX One', 'Confluence Pro™', 'Magic JB IA Cycles', 'Magic JB S/R AI', 'Crypto IA Edge']
              .map(n => `<tr><td style="padding:6px 0;color:#e2e8f0;font-size:14px;">✅ ${n}</td></tr>`).join('');
            const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#0A0E1A;color:#e2e8f0;padding:32px;"><div style="max-width:560px;margin:0 auto;background:linear-gradient(140deg,#0f172a,#0d1f1a);border:1px solid rgba(16,185,129,0.25);border-radius:20px;padding:36px;"><div style="text-align:center;margin-bottom:24px;"><div style="display:inline-block;width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#10b981,#06b6d4);line-height:56px;font-size:26px;">🎉</div><h1 style="margin:14px 0 0;color:#fff;font-size:22px;">Merci pour votre achat !</h1><p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Suite Indicateurs CryptoIA — ${billingLabel}</p></div><div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:14px;padding:20px;margin-bottom:24px;"><p style="margin:0;color:#fff;font-weight:700;font-size:15px;">⚡ Une dernière étape pour activer votre accès :</p><p style="margin:10px 0 0;color:#cbd5e1;font-size:14px;line-height:1.6;">Répondez à cet email avec votre <strong style="color:#34d399;">nom d'utilisateur TradingView</strong> et nous vous donnerons l'accès invite-only à vos 9 indicateurs <strong>sous 24&nbsp;h</strong>.</p></div><div style="text-align:center;margin-bottom:28px;"><a href="${replyHref}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#06251c;font-weight:900;text-decoration:none;font-size:14px;">Envoyer mon username TradingView →</a></div><p style="margin:0 0 8px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Vos 9 indicateurs</p><table style="width:100%;border-spacing:0;margin-bottom:24px;">${indicatorsList}</table><p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">💡 Où trouver votre username ? Sur <a href="https://www.tradingview.com" style="color:#34d399;">TradingView.com</a>, cliquez sur votre avatar en haut à droite — votre username commence par @.</p><hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;"><p style="margin:0;color:#475569;font-size:11px;text-align:center;">CryptoIA — cryptoia.ca · Des questions ? Répondez simplement à cet email.</p></div></body></html>`;
            await client.emails.send({
              from: sender,
              to: [email],
              replyTo: adminEmail,
              subject: '🎉 Votre accès aux 9 indicateurs CryptoIA — une dernière étape !',
              html,
            });
            console.log(`[IndicatorsSuite] Access-request email sent to ${email} (billing=${metadata.billing})`);
          } catch (e) {
            console.error('[IndicatorsSuite] client email error:', e?.message);
          }
        })();
      }
    } else if (eventType === 'invoice.payment_succeeded') {
      const invoice = event.data?.object || {};
      console.log(`[Payment] ✅ invoice.payment_succeeded: subscription=${invoice.subscription}`);
    } else if (eventType === 'checkout.session.expired') {
      // Abandoned checkout — trigger recovery email with promo code
      const session = event.data?.object || {};
      console.log(`[Payment] ⏰ checkout.session.expired: ${session.id}`);
      try {
        await checkoutRecovery?.handleExpiredCheckout?.(session);
      } catch (e) {
        console.error('[Payment] checkout recovery error:', e?.message);
      }
    } else if (eventType === 'customer.subscription.deleted') {
      const sub = event.data?.object || {};
      console.log(`[Payment] ❌ subscription.deleted: customer=${sub.customer}`);
      // Fetch the customer email from Stripe (the sub object itself doesn't carry it)
      let email = sub.metadata?.email || null;
      if (!email && sub.customer && STRIPE_SECRET_KEY) {
        try {
          const stripe = await getStripeInstance();
          const customer = await stripe.customers.retrieve(sub.customer);
          email = customer?.email || customer?.deleted ? null : (customer?.email || null);
        } catch (e) { console.error('[Payment] customer fetch error:', e?.message); }
      }
      const enrichedSub = { ...sub, customer_email: email };
      try { await winBack?.handleSubscriptionCanceled?.(enrichedSub); } catch (e) { console.error('[Payment] winback handler error:', e?.message); }
    }

    res.json({ status: 'ok' });
  });

  // ─── POST /api/v1/nowpayments/webhook ─────────────────────────────────────
  app.post('/api/v1/nowpayments/webhook', async (req, res) => {
    const payload = req.body;
    const paymentStatus = payload?.payment_status || '';
    const orderId = payload?.order_id || '';
    const paymentId = String(payload?.payment_id || '');

    console.log(`[NOWPayments] IPN: payment_id=${paymentId}, status=${paymentStatus}, order_id=${orderId}`);

    // Extract plan from order_id (format: cryptoia_{plan}_{timestamp})
    let plan = 'unknown';
    if (orderId.startsWith('cryptoia_')) {
      const parts = orderId.split('_');
      if (parts.length >= 2) plan = parts[1];
    }

    if (paymentStatus === 'finished' || paymentStatus === 'confirmed') {
      console.log(`[NOWPayments] ✅ Payment CONFIRMED: plan=${plan}, order_id=${orderId}`);
    } else if (paymentStatus === 'partially_paid') {
      console.log(`[NOWPayments] ⚠️ Partially paid: plan=${plan}, order_id=${orderId}`);
    } else if (['failed', 'refunded', 'expired'].includes(paymentStatus)) {
      console.log(`[NOWPayments] ❌ Payment ${paymentStatus}: plan=${plan}, order_id=${orderId}`);
    }

    res.json({ status: 'ok', payment_id: paymentId, plan, payment_status: paymentStatus });
  });

  console.log('[PaymentWebhooks] ✅ Stripe + NOWPayments webhooks registered');
}
