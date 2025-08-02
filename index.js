// index.js
import dotenv from 'dotenv';
dotenv.config();

import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';

import { readFile, writeFile } from 'fs/promises';

import { messageApi, ragMemory, buildPrompt } from './scripts/Bot/chatbotCall.js';
import { moderateCommand } from './scripts/Twitch/moderationApi.js';
import { executeModeration } from './scripts/Twitch/moderationSystem.js';
import { startVoiceRecorder } from './scripts/Bot/voiceRecorder.js';
import { exec } from 'child_process';


// ————————————————————————————————————————————————————————————
// CARGA INICIAL DE USUARIOS ACTIVOS
// ————————————————————————————————————————————————————————————

const activeUsers = new Set();

try {
    const raw = await readFile('./data/activeUsers.json', 'utf-8');
    JSON.parse(raw).forEach(u => activeUsers.add(u));
    console.log(`🔰 Cargados ${activeUsers.size} usuarios activos.`);
} catch {
    console.log('🔰 No hay archivo de usuarios activos; arrancando con conjunto vacío.');
}

// Guarda periódicamente la lista de usuarios
async function saveActiveUsers() {
    await writeFile(
        './data/activeUsers.json',
        JSON.stringify([...activeUsers], null, 2),
        'utf-8'
    );
    console.log(`✅ Guardados ${activeUsers.size} usuarios activos.`);
}

// ————————————————————————————————————————————————————————————
// FUNCIÓN PRINCIPAL
// ————————————————————————————————————————————————————————————

async function main() {
    // 1) Variables de entorno
    const {
        TWITCH_CLIENT_ID,
        TWITCH_CLIENT_SECRET,
        TWITCH_BROADCASTER_LOGIN
    } = process.env;
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET || !TWITCH_BROADCASTER_LOGIN) {
        console.error('❌ Faltan TWITCH_CLIENT_ID/SECRET o BROADCASTER_LOGIN en .env');
        process.exit(1);
    }

    // 2) Autenticación y clientes Twurple
    const tokenData = JSON.parse(await readFile('./data/tokens/tokens.json', 'utf-8'));
    const authProvider = new RefreshingAuthProvider({
        clientId: TWITCH_CLIENT_ID,
        clientSecret: TWITCH_CLIENT_SECRET
    });
    authProvider.onRefresh(async (userId, newTokens) => {
        await writeFile(
            `./data/tokens/tokens.${userId}.json`,
            JSON.stringify(newTokens, null, 2),
            'utf-8'
        );
        console.log('🔄 Tokens refrescados y guardados para', userId);
    });
    await authProvider.addUserForToken(tokenData, [
        'chat',
        'channel:read:redemptions',
        'moderator:manage:banned_users',
        'channel:manage:broadcast'
    ]);

    const chatClient = new ChatClient({
        authProvider,
        channels: [TWITCH_BROADCASTER_LOGIN]
    });
    const apiClient = new ApiClient({ authProvider });

    // 3) EventSub para puntos de canal
    const me = await apiClient.users.getUserByName(TWITCH_BROADCASTER_LOGIN);
    const listener = new EventSubWsListener({ authProvider, apiClient });
    await listener.start();

    listener.onChannelRedemptionAdd(me.id, async (event) => {
        const { userDisplayName, rewardTitle, input } = event;
        if (rewardTitle !== 'Sara') return;
        const prompt = buildPrompt(input, userDisplayName);
        await messageApi(prompt, userDisplayName, input);
    });

    // 4) Chat listener
    chatClient.onMessage(async (channel, user, text, msg) => {
        // Mantén lista de usuarios
        if (!activeUsers.has(user)) {
            activeUsers.add(user);
            saveActiveUsers();
            console.log(user);
        } else {
            console.log("✅ Ya está en la lista.");
        }
        // Ignora redemptions (ya gestionados arriba)
        if (msg.isRedemption) return;
        // Decide si responder con SARA

        // const disparoAleatorio = Math.random() < 0.1;

        // console.log(user);
        // if (disparoAleatorio) {
        //     const prompt = buildPrompt(text, user);
        //     await messageApi(prompt, user, text);
        // }
    });

    // 5) Lógica de moderación por voz
    // Dentro de tu index.js, en la parte de startVoiceRecorder:
    startVoiceRecorder(async (modJson) => {

        const channelName = TWITCH_BROADCASTER_LOGIN;
        const broadcasterId = me.id;  // tu ID de broadcaster obtenido antes

        const commands = Array.isArray(modJson) ? modJson : [modJson];

        for (const cmd of commands) {
            // 1) Resolver el login exacto en tu set de activeUsers
            const matched = [...activeUsers].find(u => {
                return (
                    typeof u === 'string' &&
                    typeof target === 'string' &&
                    u.toLowerCase() === target.toLowerCase()
                );
            });

            try {
                await executeModeration(
                    cmd,
                    apiClient,
                    chatClient,
                    broadcasterId,
                    channelName
                );
            } catch (err) {
                console.error('Error en executeModeration: ', err);
                await chatClient.say(
                    channelName,
                    `No se puede ejecutar el comando`
                );
            }
        }
    });


    // 6) Conexión final
    await chatClient.connect();
    console.log('🚀 Bot conectado y listo.');
}

main();
