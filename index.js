import dotenv from 'dotenv';
dotenv.config();

import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { ApiClient } from '@twurple/api';


import fs from 'fs/promises';
import { blobFromSync } from 'fetch-blob/from.js';

import sound from "sound-play";
import path from "path";

import fss from "fs";
import fetch from "node-fetch";

let twitchListener;
let ttsBusy = false;

//Conectando con la IA 

import { Client, handle_file } from "@gradio/client";
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { channel } from 'diagnostics_channel';
const client = await Client.connect("yuntian-deng/ChatGPT");

async function messageApi(message, user, text) {
    const result = await client.predict("/predict", {
        inputs: message,
        top_p: 0,
        temperature: 0,
        chat_counter: 3
    });

    const data = result.data;
    const chatArr = data[0]; // historial
    const lastPair = chatArr[chatArr.length - 1];
    const botReply = lastPair[1];
    console.log("Respuesta del bot:", botReply);

    ragMemory.push({userMessage: text, response: message});

    await ttsAndPlay(botReply);
};

//Configuracion del TTS

async function ttsAndPlay(text, user) {
    if (ttsBusy) {
        console.log("🔰| TTS ocupado, el mensaje será ignorado.");
        return;
    }

    ttsBusy = true;
    try {
        //Guardar el mensaje en el archivo
        const subtitleText = `${text}`;
        await fs.writeFile('subtitles.txt', subtitleText, 'utf-8');

        console.log('✅ Subtitulos actualizados.');
        // 1. Predicción y descarga
        const voice = "Salome (Female, CO)";
        const { Client } = await import("@gradio/client");
        const client = await Client.connect("hamza2923/Text_To_Voice");
        const [fileData] = (await client.predict("/text_to_speech", { text, voice })).data;

        const res = await fetch(fileData.url);
        const tempPath = path.resolve(process.cwd(), "tts_output.mp3");
        const dest = fss.createWriteStream(tempPath);
        await new Promise((r, e) => {
            res.body.pipe(dest);
            res.body.on("error", e);
            dest.on("finish", r);
        });

        // 2. Verificar archivo
        if (!fss.existsSync(tempPath)) throw new Error(`No se descargó el archivo`);
        const size = fss.statSync(tempPath).size;
        if (size === 0) throw new Error(`Archivo vacío: ${tempPath}`);

        // 3. Reproducir al máximo volumen
        await sound.play(tempPath, 1.0);

        console.log("Reproducción completada.");
    } catch (err) {
        console.error("Error en ttsAndPlay:", err);
    } finally {
        ttsBusy = false;
        await fs.writeFile('subtitles.txt', '', 'utf-8');
    }
}

//Configuracion de PROMPT

const SYSTEM_PROMPT = "Eres Sara, la asistente/novia de Elcreado_GG. Responde con humor, menciona al usuario.";

const FEW_SHOT_EXAMPLES = [
    {
        message: '¿Quien eres?',
        response: 'Soy sara, la acompañante de nuestro guapo, carismatico, lindo, y pobre streamer Elcreado'
    },
    {
        message: '¿Sabes quien es el Streamer?',
        response: 'El guapo carismatico y lindo novio mio Elcreado por supuesto.'
    },
    {
        message: '¿Eres la asistente/novia del streamer?',
        response: 'Asi es, en un tiempo fue mi enemigo, en un tiempo, fue mi aliado y amigo. Esta relacion se basa en hechos un poco, complicados.'
    }
];

const ragMemory = [];

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

//Conexion con TWITCH y mandado de mensaje

async function main() {
    const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_BROADCASTER_LOGIN } = process.env;
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET || !TWITCH_BROADCASTER_LOGIN) {
        console.error('❌ Faltan variables: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET o TWITCH_BROADCASTER_LOGIN');
        process.exit(1);
    }

    const tokenData = JSON.parse(await fs.readFile('./data/tokens/tokens.json', 'utf-8'));

    const authProvider = new RefreshingAuthProvider({
        clientId: TWITCH_CLIENT_ID,
        clientSecret: TWITCH_CLIENT_SECRET
    });

    authProvider.onRefresh(async (userId, newTokenData) => {
        console.log("Ah entrado")
        try {
            await fs.writeFile(`./data/tokens/tokens.${userId}.json`, JSON.stringify(newTokenData, null, 4), 'utf-8');
            console.log("✅ Archivo de TOKEN actualizado correctamente.");
        } catch (err) {
            console.error("⚠️ Ah ocurrido un error: ", err);
        }
    });

    await authProvider.addUserForToken(tokenData, ['chat', 'channel:read:redemptions']);

    const chatClient = new ChatClient({ authProvider, channels: [TWITCH_BROADCASTER_LOGIN] });

    chatClient.onConnect(() => {
        console.log("✅ Bot conectado a Twitch y listo para leer el chat.");
    });

    const api = new ApiClient({ authProvider });

    const user = await api.users.getUserByName(TWITCH_BROADCASTER_LOGIN);

    twitchListener = new EventSubWsListener({ authProvider, apiClient: api });

    await twitchListener.start();

    twitchListener.onChannelRedemptionAdd(user.id, event => {
        (async () => {
            try {
                const user = event.userDisplayName;
                const title = event.rewardTitle;
                if (title == "Sara") {
                    const message = event.input;
                    const prompt = buildPrompt(message, user);

                    await messageApi(prompt, user, message);
                } else {
                    return console.log("🔰| La recompensa no es para SARA.");
                }
            } catch (err) {
                console.error("⚠️| Ah ocurrido un error respecto a las recompensas: ", err);
            }
        })();
    });

    chatClient.onMessage(async (channel, user, text, msg) => {
        if (msg.isRedemption) {
            console.log("🔰| El mensaje es mediante puntos del canal.");
            return;
        }

        if (ttsBusy) {
            console.log("🔰| TTS ocupado, el mensaje será completamente ignorado.");
            return;
        }

        // Decisión de responder: 1 de cada 5 o si menciona "sara"
        const shouldRespond = Math.floor(Math.random() * 12) === 0; // random 0–4, 1/5 de chance

        if (!shouldRespond) {
            return console.log(`[SKIP] ${user}: "${text}" (no le tocó)`);
        }

        const newPrompt = buildPrompt(text, user);

        try {
            console.log(text);
            await messageApi(newPrompt, user, text);
        } catch (e) {
            console.log("Ah sucedido un error: ", e);
        }
    });

    await chatClient.connect();

};

main();