import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import sound from "sound-play";

async function ttsAndPlay(text, voice) {
  try {
    // 1. Predicción y descarga
    const { Client } = await import("@gradio/client");
    const client = await Client.connect("hamza2923/Text_To_Voice");
    const [fileData] = (await client.predict("/text_to_speech", { text, voice })).data;

    const res = await fetch(fileData.url);
    const tempPath = path.resolve(process.cwd(), "tts_output.mp3");
    const dest = fs.createWriteStream(tempPath);
    await new Promise((r, e) => {
      res.body.pipe(dest);
      res.body.on("error", e);
      dest.on("finish", r);
    });

    // 2. Verificar archivo
    if (!fs.existsSync(tempPath)) throw new Error(`No se descargó el archivo`);
    const size = fs.statSync(tempPath).size;
    if (size === 0) throw new Error(`Archivo vacío: ${tempPath}`);

    // 3. Reproducir al máximo volumen
    await sound.play(tempPath, 1.0);
    console.log("Reproducción completada.");
  } catch (err) {
    console.error("Error en ttsAndPlay:", err);
  }
}

ttsAndPlay(
  "¡Hola, mi fan número uno! Estoy genial, cuidando a nuestro guapo, carismático, lindo y pobre streamer Elcreado, ¿y tú qué tal?",
  "Salome (Female, CO)"
);
