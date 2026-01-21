import axios from 'axios';

const BACKEND = 'http://localhost:3001';

async function run() {
    try {
        console.log('Sending webhook...');
        const payload = {
            event: "PURCHASE_OUT_OF_SHOPPING_CART",
            data: {
                buyer: {
                    email: "debug.wa.final.v8@test.com",
                    name: "Debug WA",
                    phone: "5567981720357"
                },
                product: {
                    name: "Produto Teste Final 5"
                }
            }
        };

        const res = await axios.post(`${BACKEND}/api/cart-abandonment/webhook`, payload);
        console.log('Event Created:', res.data.event_id);

    } catch (e) {
        console.error('Error:', e.message);
    }
}
run();
