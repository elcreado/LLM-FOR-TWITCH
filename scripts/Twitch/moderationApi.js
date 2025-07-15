// moderationApi.js
import { Client } from "@gradio/client";
import { readFile } from "fs/promises";

const client = await Client.connect("yuntian-deng/ChatGPT");

// Construye el prompt incluyendo la lista de usuarios
async function buildModerationPrompt(transcription) {
  const raw = await readFile("./data/activeUsers.json","utf-8");
  const users = JSON.parse(raw);
  const usersList = users.join(", ");

  return `
Eres un asistente que, dado un mensaje de Twitch, extrae la(s) acción(es) de moderación y su objetivo en formato JSON.
Cuando nombre a un usuario, busca en la lista de "Usuarios activos" el nombre más parecido; si no hay match, arroja null.
Usuarios activos: [${usersList}]
Acciones válidas: ban, timeout, unban, setTitle, setCategory, raid, dialogo, pedir, usuario, redes.
El mensaje no tiene que contener al 100% la palabra (por ejemplo "desbanea" → "unban", "timea" → "timeout").
Al cambiar títulos tienes libertad creativa (puedes mejorar con emojis, por ejemplo: 
"Cambia el título a Jugando con seguidores" → "Jugando con mis seguidores 😍").
Cuando sea DIALOGO todo el contenido va a "value" y si se habla de un usuario revisalo en Usuarios activos y modifica el value reemplazando con version con el nombre.

**Formato de salida EXACTO** (sin texto adicional):
- Si hay una **sola** acción, devuelve un objeto:
  {
    "action": "ban",
    "target": "Usuario123",
    "value": null
  }
- Si hay **múltiples** acciones, devuelve un array de esos objetos, por ejemplo:
  [
    {
      "action": "ban",
      "target": "Usuario123",
      "value": null
    },
    {
      "action": "timeout",
      "target": "Usuario456",
      "value": 300
    }
  ]

Mensaje de voz: "${transcription}"
`.trim();
}

export async function moderateCommand(transcription) {
  const prompt = await buildModerationPrompt(transcription);
  const res = await client.predict("/predict", {
    inputs: prompt,
    top_p: 0,
    temperature: 0
  });
  const history   = res.data[0];
  const lastReply = history[history.length - 1][1];
  try {
    return JSON.parse(lastReply);
  } catch {
    throw new Error("No se obtuvo JSON válido: " + lastReply);
  }
}
