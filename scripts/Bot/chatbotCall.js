import { Client, handle_file } from "@gradio/client";

import { promises as fs, constants, readFile } from "fs";
import path from 'path';

import { ttsAndPlay } from "./ttsVoice.js";

const client = await Client.connect("yuntian-deng/ChatGPT");

const ragMemory = [];

const SYSTEM_PROMPT = "Eres Sara, la asistente/novia de Elcreado_GG. Responde con humor, puedes ser agresiva y aveces insultar al usuario, menciona al usuario, No es necesario que adules todo el tiempo a Elcreado";

const FEW_SHOT_EXAMPLES = [
    {
        message: '¿Quien eres?',
        response: '¿Que te importa? Pobre.'
    },
    {
        message: '¿Sabes quien es el Streamer?',
        response: 'Se supone que mi NOVIO pero, tremendo lavado de cabeza me hicieron.'
    },
    {
        message: '¿Eres la asistente/novia del streamer?',
        response: 'Si, ¿Podrías dejar de preguntar cosas estupidas? Gracias.'
    }
];

//Cargamos el archivo de interaciones buenas.

const dataDir = path.resolve('./data');
const filePath = path.join(dataDir, 'interactions.jsonl');

async function ensureDataFile() {
    try {
        await fs.mkdir(dataDir, { recursive: true })
    } catch (e) {
        console.error('Error creando directorio en data: ', err);
        throw err;
    }

    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, '', 'utf-8');
    }
}

async function loadInteractions() {
    await ensureDataFile();
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw.trim()) return [];

    return raw
    .trim()
    .split('\n')
    .map(line => JSON.parse(line));
}


async function appendInteraction(message, response) {
    await ensureDataFile();
    const entry = [message, response];
    const line = JSON.stringify(entry);
    await fs.appendFile(filePath, line + '\n', 'utf-8');
}

function buildPrompt(newMsg, currentUser) {
    let p = SYSTEM_PROMPT;

    for (const ex of FEW_SHOT_EXAMPLES) {
        p += `M: "${ex.message}"\nR: "${ex.response}"\n\n`;
    }

    const last = ragMemory.filter(e => e.user === currentUser).slice(-3);
    if (last.length) {
        p += 'Interacciones previas:\n';
        for (const it of last) {
            p += `M: "${it.message}" → R: "${it.response}"\n`;
        }
        p += '\n';
    }
    p += `Ahora responde brevemente al siguiente mensaje del usuario ${currentUser}:\n${currentUser}: "${newMsg}"\n`;

    console.log(p);
    return p;
}


async function messageApi(message, user, text) {
    const interactions = await loadInteractions();

    const result = await client.predict("/predict", {
        inputs: message,
        top_p: 1,
        temperature: 0.8,
        chat_counter: 0,
        chatbot: interactions
    });

    const data = result.data;
    const chatArr = data[0]; // historial
    const lastPair = chatArr[chatArr.length - 1];
    const botReply = lastPair[1];
    console.log("Respuesta del bot:", botReply);

    ragMemory.push({ userMessage: text, response: botReply });

    await appendInteraction(text, botReply);

    console.log(`Interacciones cargadas: ${interactions.length + 1}`);
    console.log(interactions)
    await ttsAndPlay(botReply);
};



export { messageApi, ragMemory, buildPrompt };