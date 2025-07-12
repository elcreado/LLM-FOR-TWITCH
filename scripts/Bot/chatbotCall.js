import { Client, handle_file } from "@gradio/client";
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

    ragMemory.push({ userMessage: text, response: message });

    await ttsAndPlay(botReply);
};



export { messageApi, ragMemory, buildPrompt };