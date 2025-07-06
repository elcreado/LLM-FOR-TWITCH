import dotenv from 'dotenv';
dotenv.config();

import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { ApiClient } from '@twurple/api';

import fs from 'fs/promises';

//Conectando con la IA 

import { Client, handle_file } from "@gradio/client";
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { channel } from 'diagnostics_channel';

import { startVoiceRecorder } from './scripts/voiceRecorder.cjs';
import { messageApi, ragMemory } from './scripts/chatbotCall.js';


let twitchListener;

const activeUsers = new Set();


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

// Antes de main(), podrías hacer:
try {
    const prev = JSON.parse(await fs.readFile('./data/activeUsers.json', 'utf-8'));
    prev.forEach(u => activeUsers.add(u));
    console.log(`🔰 Cargados ${prev.length} usuarios del archivo.`);
} catch { }

//Volcamos todo a un JSON

async function saveActiveUsers() {
    const arr = [...activeUsers];
    await fs.writeFile('./data/activeUsers.json', JSON.stringify(arr, null, 2), 'utf-8');
    console.log(`✅ Guardados ${arr.length} usuarios activos.`);
}

//Conexion con TWITCH y mandado de mensaje

async function main() {
    const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_BROADCASTER_LOGIN } = process.env;
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET || !TWITCH_BROADCASTER_LOGIN) {
        console.error('❌ Faltan variables: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET o TWITCH_BROADCASTER_LOGIN');
        process.exit(1);
    }

    startVoiceRecorder();
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
        //Metemos el usuario a la lista
        activeUsers.add(user);
        console.log(`🔰 El usuario ${user} ah sido añadido a la lista.`);

        if (msg.isRedemption) {
            console.log("🔰| El mensaje es mediante puntos del canal.");
            return;
        }

        if (ttsBusy) {
            console.log("🔰| TTS ocupado, el mensaje será completamente ignorado.");
            return;
        }

        // Decisión de responder: 1 de cada 5 o si menciona "sara"
        const shouldRespond = Math.floor(Math.random() * 12) === 0;

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

setInterval(saveActiveUsers, 30_000);

main();