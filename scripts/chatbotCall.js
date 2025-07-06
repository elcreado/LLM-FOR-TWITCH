import { Client, handle_file } from "@gradio/client";
import { ttsAndPlay } from "./ttsVoice.js";

const client = await Client.connect("yuntian-deng/ChatGPT");

const ragMemory = [];

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



export { messageApi, ragMemory };