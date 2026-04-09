/**
 * Utils for Extracting Financial Metrics from diverse webhook payloads
 */

export function extractFinancials(payload, platform) {
    let gross = null;
    let net = null;
    let currency = 'BRL';

    try {
        const data = payload?.data || payload;
        
        // 1. Hotmart
        if (data?.purchase?.price?.value !== undefined) {
            gross = data.purchase.price.value;
            currency = data.purchase.price.currency_code || currency;
            
            // Comissão líquida na Hotmart (vendor)
            if (Array.isArray(data.commissions)) {
                const myCommission = data.commissions.find(c => c.source === 'PRODUCER' || c.source === 'COPRODUCER') || data.commissions[0];
                if (myCommission && myCommission.value !== undefined) {
                    net = myCommission.value;
                }
            }
        }
        
        // 2. Kiwify
        if (gross === null && data?.Commissions?.charge_amount !== undefined) {
            gross = parseFloat(data.Commissions.charge_amount) / 100; 
            if (data.Commissions.charge_amount.toString().includes('.')) gross = parseFloat(data.Commissions.charge_amount);
            net = parseFloat(data.Commissions.my_commission || gross); 
            if (!data.Commissions.my_commission?.toString().includes('.')) net = net / 100;
        }

        // 3. Looma / Yampi / Diversos (amount / net_amount)
        if (gross === null && data?.amount !== undefined) {
            gross = parseFloat(data.amount);
            if (data.net_amount !== undefined) {
                net = parseFloat(data.net_amount);
            }
        }

        // Caso tenha "value" genérico e nenhum dos acima
        if (gross === null && data?.value !== undefined) {
            gross = parseFloat(data.value);
        }

        // Se extraiu pelo menos o bruto, formata
        if (gross !== null && !isNaN(gross)) {
            return {
                gross: gross,
                net: (net !== null && !isNaN(net)) ? net : null,
                currency: currency
            };
        }
    } catch (e) {
        console.error('Falha ao tentar extrair valores monetários no webhook', e);
    }
    return null;
}
