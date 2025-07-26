const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const qrTerminal = require('qrcode-terminal')
const cron = require('node-cron')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth')

    const socket = makeWASocket({
        auth: state
    })

    // Exibe QR Code no terminal quando necessário
    socket.ev.on('connection.update', (update) => {
        const { connection, qr } = update

        if (qr) {
            qrTerminal.generate(qr, {
                small: true,
                errorCorrectionLevel: 'M' // 👈 evita erro de RS block
            })
        }

        if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp com sucesso!')
        } else if (connection === 'close') {
            console.log('⚠️ Conexão encerrada. Reiniciando...')
            startBot()
        }
    })

    // Salva credenciais após login
    socket.ev.on('creds.update', saveCreds)

    // Detecta mensagens e mostra o ID do grupo no console
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (msg?.key?.remoteJid?.endsWith('@g.us')) {
            console.log('🆔 ID do grupo detectado:', msg.key.remoteJid)
        }
    })

    // Agendamento: todo dia 17 às 08h
    cron.schedule('0 8 17 * *', async () => {
        const grupoID = '557199601075-1570291182@g.us' 

        try {
            await socket.sendMessage(grupoID, {
                text: 'Pagamento Spotify. R$5.81. Pix: 71996322012'
            })
            console.log('✅ Mensagem enviada com sucesso!')
        } catch (err) {
            console.error('❌ Erro ao enviar mensagem:', err)
        }
    })
}

startBot()