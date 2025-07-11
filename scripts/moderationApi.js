// moderationApi.js
import { Client } from "@gradio/client";
import { readFile } from "fs/promises";

const client = await Client.connect("yuntian-deng/ChatGPT");

// Construye el prompt incluyendo la lista de usuarios
async function buildModerationPrompt(transcription) {
  // 1) Lee el JSON de usuarios activos
  const raw = await readFile("./data/activeUsers.json","utf-8");
  const users = JSON.parse(raw);
  const usersList = users.join(", ");

  // 2) Incorpóralo en el prompt
  return `
Eres un asistente que, dado un mensaje de Twitch, extrae la acción de moderación y su objetivo en formato JSON.
Cuando nombre a un usuario busca en la lista de "Usuarios activos" el nombre mas parecido a el, sino arroja null.
Usuarios activos: [${usersList}]
Acciones válidas: ban, timeout, unban, setTitle, setCategory, raid, dialogo.
El mensaje no tiene que contener al 100% la palabra, por ejemplo "unban" sino que puedes interpretar desbanea como "unban" asi como "timea" = "timeout".
Cuando intente cambiar el titulo tienes la libertad de darle tu toque, es decir ponerle emojis y mejorarlo, por ejemplo: "Cambia el titulo a Jugando con seguidores" tu lo puedes volver "Jugando con mis seguidores 😍".
Cuando el mensaje no tenga ninguna de esas opciones entonces será dialogo, el "value" en esté caso será el mensaje de voz.
Formato de salida EXACTO (sin texto adicional):
{
  "action": "ban",
  "target": "Usuario123",
  "value": null
}
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
