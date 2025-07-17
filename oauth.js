import dotenv from 'dotenv';
dotenv.config();

import { exchangeCode } from '@twurple/auth';
import { writeFile } from 'fs/promises';

const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_BROADCASTER_LOGIN, TWITCH_ACCESS_CODE } = process.env;

const clientId = TWITCH_CLIENT_ID;
const clientSecret = TWITCH_CLIENT_SECRET;
const redirectUri = 'http://localhost';
const code = TWITCH_ACCESS_CODE;

try {
  const tokenData = await exchangeCode(clientId, clientSecret, code, redirectUri);

  console.log('✅ Tokens generados correctamente:\n', tokenData);

  await writeFile('./data/tokens/tokens.json', JSON.stringify(tokenData, null, 4), 'utf-8');
  console.log('💾 Tokens guardados en tokens.json');
} catch (error) {
  console.error('❌ Error generando tokens:', error);
}
