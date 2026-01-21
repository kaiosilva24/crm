import axios from 'axios';

const BACKEND = 'http://localhost:3001';
const MANYCHAT_TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751';

async function run() {
    try {
        console.log('🎯 TESTE FINAL DEFINITIVO - 100% de Certeza');
        console.log('============================================\n');

        // Step 1: Verify tags are removed
        console.log('1️⃣ Verificando que tags foram removidas...');
        const infoUrl = `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${SUBSCRIBER_ID}`;
        const infoRes = await axios.get(infoUrl, {
            headers: { 'Authorization': `Bearer ${MANYCHAT_TOKEN}` }
        });

        const currentTags = infoRes.data.data.tags.map(t => t.name);
        console.log('Tags atuais:', currentTags.length > 0 ? currentTags.join(', ') : '✅ NENHUMA (limpo)');

        if (currentTags.length > 0) {
            console.log('⚠️  Ainda há tags. Removendo...');
            for (const tagName of currentTags) {
                await axios.post(`https://api.manychat.com/fb/subscriber/removeTagByName`, {
                    subscriber_id: SUBSCRIBER_ID,
                    tag_name: tagName
                }, {
                    headers: { 'Authorization': `Bearer ${MANYCHAT_TOKEN}`, 'Content-Type': 'application/json' }
                });
            }
            console.log('✅ Tags removidas');
        }
        console.log('');

        // Step 2: Clear old events
        console.log('2️⃣ Limpando eventos antigos...');
        const login = await axios.post(`${BACKEND}/api/auth/login`, {
            email: 'admin@crm.com',
            password: 'admin123'
        });
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        await axios.post(`${BACKEND}/api/cart-abandonment/clear-duplicates`, {
            phone: '5567981720357'
        }, { headers });
        console.log('✅ Eventos limpos\n');

        // Step 3: Send webhook
        console.log('3️⃣ Enviando webhook...');
        const payload = {
            event: "PURCHASE_OUT_OF_SHOPPING_CART",
            data: {
                buyer: {
                    email: `teste.final.${Date.now()}@hotmart.com`,
                    name: "Debug WA",
                    phone: "5567981720357"
                },
                product: {
                    name: "Produto Teste Final Definitivo"
                }
            }
        };

        const res = await axios.post(`${BACKEND}/api/cart-abandonment/webhook`, payload);
        const eventId = res.data.event_id;
        console.log(`✅ Event ID: ${eventId}\n`);

        // Step 4: Wait for complete flow
        console.log('4️⃣ Aguardando fluxo completo...');
        console.log('   [0s] Tag 1 deve ser aplicada AGORA');
        console.log('   [60s] Aguardando delay de 1 minuto');
        console.log('   [60s] Verificação de campanha');
        console.log('   [60s] Tag 2 deve ser aplicada\n');

        // Check Tag 1 after 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('⏱️  5 segundos - Verificando Tag 1...');
        const check1 = await axios.get(infoUrl, {
            headers: { 'Authorization': `Bearer ${MANYCHAT_TOKEN}` }
        });
        const tags1 = check1.data.data.tags.map(t => t.name);
        const hasTag1Early = tags1.includes('abandono_carrinho');
        console.log(hasTag1Early ? '✅ Tag 1 aplicada!' : '❌ Tag 1 ainda não aplicada');
        console.log('');

        // Wait for Tag 2
        console.log('⏱️  Aguardando mais 70 segundos para Tag 2...\n');
        await new Promise(resolve => setTimeout(resolve, 70000));

        // Step 5: Final verification
        console.log('5️⃣ Verificação final...\n');
        const finalCheck = await axios.get(infoUrl, {
            headers: { 'Authorization': `Bearer ${MANYCHAT_TOKEN}` }
        });
        const finalTags = finalCheck.data.data.tags.map(t => t.name);

        console.log('📋 Tags encontradas:', finalTags.length > 0 ? finalTags.join(', ') : 'NENHUMA');

        const hasTag1 = finalTags.includes('abandono_carrinho');
        const hasTag2 = finalTags.includes('abandono_carrinho_2');

        console.log('\n🎯 RESULTADO FINAL:');
        console.log('===================');
        console.log(hasTag1 ? '✅ Tag 1 (abandono_carrinho) - APLICADA' : '❌ Tag 1 - FALHOU');
        console.log(hasTag2 ? '✅ Tag 2 (abandono_carrinho_2) - APLICADA' : '❌ Tag 2 - FALHOU');

        if (hasTag1 && hasTag2) {
            console.log('\n🎉🎉🎉 SUCESSO TOTAL! 🎉🎉🎉');
            console.log('Sistema 100% funcional!');
            console.log('PRONTO PARA DEPLOY EM PRODUÇÃO!');
        } else {
            console.log('\n⚠️  Analisando logs do evento...\n');
            const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${eventId}`, { headers });
            const logs = logsRes.data.logs.reverse();

            logs.forEach((l, i) => {
                const icon = l.status === 'success' ? '✅' : l.status === 'error' ? '❌' : '⚠️';
                console.log(`${i + 1}. ${icon} [${l.action_type}] ${l.message}`);
                if (l.error_message && !l.error_message.includes('code is updated')) {
                    console.log(`   ERROR: ${l.error_message.substring(0, 200)}`);
                }
            });
        }

    } catch (e) {
        console.error('\n❌ ERRO:', e.message);
        if (e.response) {
            console.log('Status:', e.response.status);
            console.log('Data:', JSON.stringify(e.response.data).substring(0, 200));
        }
    }
}

run();
