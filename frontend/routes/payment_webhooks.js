// Payment Webhooks — Stripe + NOWPayments IPN handlers
// Extracted from server.js (Session 19 refactor)
// All external dependencies are passed via dependency injection.

export default function registerPaymentWebhookRoutes(
  app,
  {
    getStripeInstance,
    sendChatNotification,
    recordAffiliationConversion,
    getResendClient,
    STRIPE_SECRET_KEY,
    checkoutRecovery, // { handleExpiredCheckout, markCompleted }
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
      try { checkoutRecovery?.markCompleted?.(session.id, metadata.promo_code || null); } catch {}
      const email = session.customer_details?.email || session.customer_email || null;
      const amountTotal = (session.amount_total || 0) / 100; // cents → dollars
      console.log(`[Payment] ✅ checkout.session.completed: plan=${metadata.plan}, billing=${metadata.billing_period}, email=${email}, amount=${amountTotal}`);

      // 💬 Discord/Slack notification (instant)
      sendChatNotification({
        title: `💰 +$${amountTotal.toFixed(2)} — Nouvelle vente !`,
        lines: [
          `**Plan** : ${metadata.plan || 'N/A'} (${metadata.billing_period || 'monthly'})`,
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
