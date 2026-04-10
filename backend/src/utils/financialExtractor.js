/**
 * Utils for Extracting Financial Metrics from diverse webhook payloads
 */

/**
 * Normaliza o método de pagamento para um label amigável
 */
export function normalizePaymentMethod(raw) {
    if (!raw) return null;
    const v = String(raw).toLowerCase().replace(/_/g, ' ');
    if (v.includes('credit') || v.includes('cartao') || v.includes('card')) return 'Cartão de Crédito';
    if (v.includes('debit')) return 'Cartão de Débito';
    if (v.includes('pix')) return 'PIX';
    if (v.includes('boleto') || v.includes('billet')) return 'Boleto';
    if (v.includes('paypal')) return 'PayPal';
    if (v.includes('bank') || v.includes('transfer')) return 'Transferência';
    if (v.includes('free') || v.includes('gratis')) return 'Gratuito';
    return String(raw);
}

export function extractFinancials(payload, platform) {
    let gross = null;
    let net = null;
    let currency = 'BRL';
    let paymentMethod = null;
    let installments = null;
    let productName = null;

    try {
        const data = payload?.data || payload;

        // 1. Hotmart
        // purchase.payment.type = "CREDIT_CARD" | "PIX" | "BILLET"
        // purchase.payment.installments_number = 1, 2, 3...
        if (data?.purchase?.price?.value !== undefined) {
            gross = data.purchase.price.value;
            currency = data.purchase.price.currency_code || currency;

            const payment = data.purchase?.payment || {};
            paymentMethod = normalizePaymentMethod(payment.type);
            installments = payment.installments_number || null;

            productName = data.product?.name || data.offer?.name || null;

            if (Array.isArray(data.commissions)) {
                const myCommission = data.commissions.find(c => c.source === 'PRODUCER' || c.source === 'COPRODUCER') || data.commissions[0];
                if (myCommission && myCommission.value !== undefined) {
                    net = myCommission.value;
                }
            }
        }

        // 2. Kiwify
        // payment_method = "credit_card" | "pix" | "boleto"
        // installments = 12
        if (gross === null && data?.Commissions?.charge_amount !== undefined) {
            gross = parseFloat(data.Commissions.charge_amount) / 100;
            if (data.Commissions.charge_amount.toString().includes('.')) gross = parseFloat(data.Commissions.charge_amount);
            net = parseFloat(data.Commissions.my_commission || gross);
            if (!data.Commissions.my_commission?.toString().includes('.')) net = net / 100;

            paymentMethod = normalizePaymentMethod(data.payment_method);
            installments = data.installments || null;
            productName = data.Product?.name || data.product?.name || null;
        }

        // 3. Looma / Yampi / Diversos (amount / net_amount)
        if (gross === null && data?.amount !== undefined) {
            gross = parseFloat(data.amount);
            if (data.net_amount !== undefined) {
                net = parseFloat(data.net_amount);
            }
            paymentMethod = normalizePaymentMethod(data.payment_method || data.payment?.method);
            installments = data.installments || data.payment?.installments || null;
            productName = data.product?.name || data.plan?.name || null;
        }

        // 4. GreatPages / Genérico com "payment" object
        if (gross === null && data?.payment?.amount !== undefined) {
            gross = parseFloat(data.payment.amount);
            paymentMethod = normalizePaymentMethod(data.payment.method || data.payment.type);
            installments = data.payment.installments || null;
            productName = data.product?.name || null;
        }

        // 5. Caso tenha "value" genérico e nenhum dos acima
        if (gross === null && data?.value !== undefined) {
            gross = parseFloat(data.value);
            paymentMethod = normalizePaymentMethod(data.payment_method || data.payment_type);
            installments = data.installments || null;
        }

        if (gross !== null && !isNaN(gross)) {
            return {
                gross: gross,
                net: (net !== null && !isNaN(net)) ? net : null,
                currency: currency,
                payment_method: paymentMethod || null,
                installments: (installments && parseInt(installments) > 1) ? parseInt(installments) : null,
                product_name: productName || null
            };
        }
    } catch (e) {
        console.error('Falha ao tentar extrair valores monetários no webhook', e);
    }
    return null;
}
