import fs from 'fs/promises';
import fss from "fs";
import fetch from "node-fetch";

import sound from "sound-play";
import path from "path";

//Configuracion del TTS
let ttsBusy = false;

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

export { ttsAndPlay };