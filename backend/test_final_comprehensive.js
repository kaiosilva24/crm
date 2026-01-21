import axios from 'axios';

const BACKEND = 'http://localhost:3001';
const TOKEN = '1130274:bdc97c93f4e0529504b218836910ade1';
const SUBSCRIBER_ID = '1299346751';

async function run() {
    try {
        console.log('🧪 TESTE FINAL - Verificação Completa de Tag 1 e Tag 2');
        console.log('=====================================================\n');

        // Step 1: Remove all tags from contact
        console.log('1️⃣ Limpando tags do contato...');
        const infoUrl = `https://api.manychat.com/fb/subscriber/getInfo?subscriber_id=${SUBSCRIBER_ID}`;
        const infoRes = await axios.get(infoUrl, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const currentTags = infoRes.data.data.tags;
        for (const tag of currentTags) {
            await axios.post(`https://api.manychat.com/fb/subscriber/removeTagByName`, {
                subscriber_id: SUBSCRIBER_ID,
                tag_name: tag.name
            }, {
                headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
            });
        }
        console.log('✅ Tags removidas\n');

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
                    email: "teste.final.completo@hotmart.com",
                    name: "Debug WA",
                    phone: "5567981720357"
                },
                product: {
                    name: "Produto Teste Final"
                }
            }
        };

        const res = await axios.post(`${BACKEND}/api/cart-abandonment/webhook`, payload);
        const eventId = res.data.event_id;
        console.log(`✅ Event ID: ${eventId}\n`);

        // Step 4: Wait and check
        console.log('4️⃣ Aguardando fluxo completo (75 segundos)...');
        console.log('   - Tag 1 deve ser aplicada imediatamente');
        console.log('   - Aguardar 1 minuto');
        console.log('   - Verificar campanha');
        console.log('   - Tag 2 deve ser aplicada após delay\n');

        await new Promise(resolve => setTimeout(resolve, 75000));

        // Step 5: Verify tags
        console.log('5️⃣ Verificando tags aplicadas...\n');
        const finalInfoRes = await axios.get(infoUrl, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const finalTags = finalInfoRes.data.data.tags.map(t => t.name);
        console.log('📋 Tags encontradas:', finalTags.length > 0 ? finalTags.join(', ') : 'NENHUMA\n');

        const hasTag1 = finalTags.includes('abandono_carrinho');
        const hasTag2 = finalTags.includes('abandono_carrinho_2');

        console.log('\n🎯 Resultado:');
        console.log(hasTag1 ? '✅ Tag 1 (abandono_carrinho) - APLICADA' : '❌ Tag 1 - NÃO APLICADA');
        console.log(hasTag2 ? '✅ Tag 2 (abandono_carrinho_2) - APLICADA' : '❌ Tag 2 - NÃO APLICADA');

        if (hasTag1 && hasTag2) {
            console.log('\n🎉🎉🎉 SUCESSO TOTAL! Sistema 100% funcional!');
            console.log('Ambas as tags foram aplicadas corretamente!');
        } else {
            console.log('\n⚠️  Verificando logs para diagnóstico...\n');
            const logsRes = await axios.get(`${BACKEND}/api/cart-abandonment/logs?event_id=${eventId}`, { headers });
            const logs = logsRes.data.logs.reverse();

            logs.forEach(l => {
                const icon = l.status === 'success' ? '✅' : l.status === 'error' ? '❌' : '⚠️';
                console.log(`${icon} [${l.action_type}] ${l.message}`);
                if (l.error_message && !l.error_message.includes('code is updated')) {
                    console.log(`   ERROR: ${l.error_message.substring(0, 100)}`);
                }
            });
        }

    } catch (e) {
        console.error('\n❌ Erro:', e.message);
    }
}

run();
