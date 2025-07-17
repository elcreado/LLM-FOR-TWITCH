# AI Assistant and Co-Streamer for Twitch (Beta)

> A TTS + LLM solution designed to enhance the Twitch streaming experience with voice commands and automated moderation.

[![Node.js LTS](https://img.shields.io/badge/Node.js-LTS-green.svg)]() [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 Table of Contents

1. [Overview](#overview)  
2. [Features](#features)  
3. [Technologies](#technologies)  
4. [Installation](#installation)  
5. [Usage](#usage)  
6. [Contributing](#contributing)  
7. [License](#license)  

---

## Overview

**AI Assistant and Co-Streamer for Twitch (Beta)** is an AI-driven system combining TTS (Text‑to‑Speech) and an LLM (Language Model) to:

- Enable **voice-activated** chat moderation.  
- Integrate **Sara**, an AI that interacts live in chat by:  
  - Selecting messages randomly or via channel point redemptions.  
  - Responding vocally using a TTS engine.  

Our goal is to elevate the streaming experience for smaller creators by providing co-streaming and moderation without relying on additional human staff.

## Features

- Voice-activated chat moderation  
- Real-time interaction with AI **Sara**  
- Message selection through channel point redemptions  
- Voice responses generated via TTS  
- Modular and extensible architecture for future integrations  

## Technologies

- **Runtime**: Node.js  
- **Language**: JavaScript  

- **Libraries & Packages**:
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

- **External APIs**:
  - **yuntian-deng/ChatGPT**: Natural language generation (LLM).  
  - **skspavithiran/whisper**: Audio-to-text transcription.  
  - **hamza2923/Text_To_Voice**: Text-to-speech synthesis (TTS).  

## Installation

```bash
git clone https://github.com/your-username/ai-co-streamer-twitch.git
cd ai-co-streamer-twitch
npm install
