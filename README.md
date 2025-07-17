# AI Assistant and Co-Streamer for Twitch (Beta)

> Una solución TTS + LLM diseñada para mejorar la experiencia de streaming en Twitch mediante comandos de voz y moderación automatizada.

[![Node.js LTS](https://img.shields.io/badge/Node.js-LTS-green.svg)]() [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 Tabla de Contenidos

1. [Descripción](#descripción)  
2. [Características](#características)  
3. [Tecnologías](#tecnologías)  
4. [Instalación](#instalación)  
5. [Uso](#uso)  
6. [Contribución](#contribución)  
7. [Licencia](#licencia)  

---

## Descripción

**AI Assistant and Co-Streamer for Twitch (Beta)** es un sistema de Inteligencia Artificial basado en TTS (Text‑to‑Speech) y LLM (Language Model) que:

- Facilita la **moderación** de chat mediante **comandos de voz**.  
- Integra a **Sara**, una IA que interactúa con el chat en directo:  
  - Selecciona mensajes de forma aleatoria o a través del canjeo de puntos del canal.  
  - Responde vocalmente usando un motor de TTS.  

Nuestro objetivo es elevar la experiencia de streaming para creadores pequeños, ofreciendo co‑streaming y moderación sin necesidad de personal humano adicional.

## Características

- Moderación de chat activada por voz.  
- Interacción en tiempo real con la IA **Sara**.  
- Selección de mensajes vía canjeo de puntos del canal.  
- Respuestas de voz generadas por TTS.  
- Arquitectura modular y extensible para futuras integraciones.

## Tecnologías

- **Lenguaje y entorno**:
  - Node.js  
  - JavaScript  
- **Librerías y paquetes**:
  - [Twurple](https://github.com/twurple/twurple)  
  - [dotenv](https://github.com/motdotla/dotenv)  
  - [fetch-blob](https://github.com/node-fetch/fetch-blob)  
  - [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static)  
  - [form-data](https://github.com/form-data/form-data)  
  - [mic](https://github.com/ashishbajaj99/mic)  
  - [node-global-key-listener](https://github.com/…)  
  - [node-record-lpcm16](https://github.com/…)  
  - [play-sound](https://github.com/…)  
  - [sound-play](https://github.com/…)  
- **APIs externas**:
  - **yuntian-deng/ChatGPT**: generación de lenguaje natural (LLM).  
  - **skspavithiran/whisper**: transcripción de audio a texto.  
  - **hamza2923/Text_To_Voice**: síntesis de voz (TTS).

## Instalación

```bash
git clone https://github.com/tu-usuario/ai-co-streamer-twitch.git
cd ai-co-streamer-twitch
npm install
