import axios from 'axios';

async function runTest() {
    console.log("🚀 Iniciando teste automatizado da integração ManyChat...");
    
    const payload = {
        name: 'Kaio IA Test',
        phone: '5562999981718',
        email: 'automacao@crm.com',
        tag: '[HMS]-[COMPRA]'
    };

    console.log("Payload:", payload);

    try {
        const response = await axios.post('http://localhost:3000/api/manychat/test-automation', payload);
        console.log("✅ SUCESSO!");
        console.log("RESPOSTA DO SERVIDOR:", response.data);
    } catch (error) {
        console.error("❌ ERRO NO TESTE!");
        if (error.response) {
            console.error("DADOS DO ERRO:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("MENSAGEM:", error.message);
        }
    }
}

runTest();
