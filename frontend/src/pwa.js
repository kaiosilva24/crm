
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {
        console.log('New content available, click on reload button to update.')
        // You can show a toast here to ask user to reload
    },
    onOfflineReady() {
        console.log('App ready to work offline')
    },
})
