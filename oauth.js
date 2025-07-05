import { exchangeCode } from '@twurple/auth';
import { writeFile } from 'fs/promises';

const clientId = 'k5mrdmmpanc86ykeec581ai1v5338o';
const clientSecret = 'b87b83l6akkha2ff3t9d8x3x5p5hru';
const redirectUri = 'http://localhost';
const code = 'g4lnvrk14pla8oz8ft5lfgogrcdeyc';

try {
  const tokenData = await exchangeCode(clientId, clientSecret, code, redirectUri);

  console.log('✅ Tokens generados correctamente:\n', tokenData);

  await writeFile('./data/tokens/tokens.json', JSON.stringify(tokenData, null, 4), 'utf-8');
  console.log('💾 Tokens guardados en tokens.json');
} catch (error) {
  console.error('❌ Error generando tokens:', error);
}
