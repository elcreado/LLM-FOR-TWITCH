// scripts/voiceRecorder.cjs
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');
const { readFile } = require('fs/promises');
const { GlobalKeyboardListener } = require('node-global-key-listener');
require('dotenv').config();

// —— Import dinámico de Gradio client ——
let gradioClient;
async function ensureGradio() {
    if (!gradioClient) {
        ({ Client: gradioClient } = await import('@gradio/client'));
    }
}
// ————————————————————————

const ACTIVATION_KEY = 'F3';
let recording = false;
let ffmpegProc;

// Ajusta esto a tu dispositivo real
const MIC_DEVICE = 'SteelSeries Sonar - Microphone (SteelSeries Sonar Virtual Audio Device)';

function startVoiceRecorder() {
    async function handleVoiceCommand(transcription) {
        console.log('🗣️ Comando de voz:', transcription);
        
    }

    async function sendToWhisper(commandBlob) {
        await ensureGradio();
        const client = await gradioClient.connect('skspavithiran/whisper');
        // Usamos el mismo objeto con key 'audio_file' que en tu ejemplo
        const result = await client.predict('/predict', {
            audio_file: commandBlob
        });
        // result.data es un array con tu transcripción en [0]
        return Array.isArray(result.data) ? result.data[0] : result.data;
    }

    const keyboard = new GlobalKeyboardListener();
    keyboard.addListener(async (e, down) => {
        if (
            e.state === 'DOWN' &&
            e.name === ACTIVATION_KEY &&
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

        if (e.state === 'UP' && e.name === ACTIVATION_KEY && recording) {
            console.log('✋ Detenido. Procesando…');
            recording = false;
            ffmpegProc.stdin.write('q');

            ffmpegProc.on('close', async code => {
                if (code !== 0) {
                    console.warn(`FFmpeg salió con código ${code}`);
                    return;
                }
                try {
                    // 1) Lee el WAV y lo transformas en Blob
                    const buffer = await readFile('command.wav');
                    const commandBlob = new Blob([buffer], { type: 'audio/wav' });

                    // 2) Llamada a Whisper Space vía gradio-client
                    console.log('🌩️ Enviando a Whisper Space…');
                    const transcription = await sendToWhisper(commandBlob);
                    console.log('📝 Transcripción recibida:', transcription);

                    // 3) Ejecuta tu lógica de moderación
                    handleVoiceCommand(transcription);
                } catch (err) {
                    console.error('❌ Error procesando Whisper Space:', err);
                }
            });
        }
    });
}

module.exports = { startVoiceRecorder };


