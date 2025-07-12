// scripts/voiceRecorder.js
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { GlobalKeyboardListener } from 'node-global-key-listener';
import { moderateCommand } from '../Twitch/moderationApi.js';
import dotenv from 'dotenv';
dotenv.config();

// — Helpers para Whisper via Gradio Client —
let gradioClient = null;
async function ensureGradio() {
  if (!gradioClient) {
    ({ Client: gradioClient } = await import('@gradio/client'));
  }
}

async function sendToWhisper(commandBlob) {
  await ensureGradio();
  const client = await gradioClient.connect('skspavithiran/whisper');
  const result = await client.predict('/predict', { audio_file: commandBlob });
  return Array.isArray(result.data) ? result.data[0] : result.data;
}
// ————————————————————————————————————

const ACTIVATION_KEY = 'F24';
const MIC_DEVICE = 'SteelSeries Sonar - Microphone (SteelSeries Sonar Virtual Audio Device)';
let recording = false;
let ffmpegProc;

function buildModerationPrompt(transcription) {
  return `
Eres un asistente que, dado un mensaje de Twitch, extrae la acción de moderación y su objetivo en formato JSON.
Acciones válidas: ban, timeout, unban, setTitle, setCategory, raid, dialogo.
Formato de salida EXACTO (sin texto adicional):
{
  "action": "ban",
  "target": "Usuario123",
  "value": null
}
Mensaje de voz: "${transcription}"
  `.trim();
}

/**
 * Arranca un listener global de teclado para Shift+F3.
 * Cuando sueltas F3, graba audio, transcribe, llama al LLM
 * y devuelve el JSON de moderación.
 *
 * @param {function(string):void} onCommand recibido el JSON de moderación
 */
export function startVoiceRecorder(onCommand) {
  const keyboard = new GlobalKeyboardListener();

  keyboard.addListener(async (e, down) => {
    // Shift+F3 presionado → inicia FFmpeg
    if (
      e.state === 'DOWN' &&
      e.name === ACTIVATION_KEY  &&
      !recording
    ) {
      recording = true;
      console.log('🎤 Grabando comando…');
      ffmpegProc = spawn(ffmpegPath, [
        '-f', 'dshow',
        '-i', `audio=${MIC_DEVICE}`,
        '-ac', '1',
        '-ar', '16000',
        '-y',
        'command.wav'
      ]);
      ffmpegProc.stderr.on('data', d => process.stdout.write(d));
      ffmpegProc.on('error', err => console.error('Error FFmpeg:', err));
      return;
    }

    // F3 soltado → para grabación y procesa
    if (
      e.state === 'UP' &&
      e.name === ACTIVATION_KEY &&
      recording
    ) {
      console.log('✋ Detenido. Procesando…');
      recording = false;
      ffmpegProc.stdin.write('q');

      ffmpegProc.on('close', async code => {
        if (code !== 0) {
          console.warn(`FFmpeg salió con código ${code}`);
          return;
        }
        try {
          // 1) Lee el WAV y crea un Blob
          const buffer = await readFile('command.wav');
          const commandBlob = new Blob([buffer], { type: 'audio/wav' });

          // 2) Transcribe con Whisper
          console.log('🌩️ Enviando a Whisper…');
          const transcription = await sendToWhisper(commandBlob);
          console.log('📝 Transcripción:', transcription);

          // 3) Genera prompt y llama al LLM para JSON
          const prompt = buildModerationPrompt(transcription);
          const modJson = await moderateCommand(prompt);
          console.log('🔧 JSON de moderación:', modJson);

          // 4) Notifica al orquestador
          onCommand(modJson);
        } catch (err) {
          console.error('❌ Error en voiceRecorder:', err);
        }
      });
    }
  });
}
