// moderationSystem.js
import { ttsAndPlay } from "../Bot/ttsVoice.js";
import { messageApi, buildPrompt } from "../Bot/chatbotCall.js";

export async function executeModeration(
  { action, target, value },
  apiClient,
  chatClient,
  broadcasterId,
  channelName
) {

  let user;

  if (target) {
    user = await apiClient.users.getUserByName(target);
    console.log(user.id)

    if (!user) {
      await chatClient.say(channelName,
        `/me ⚠️ No encontré al usuario “${target}” en Twitch.`
      );
      return;
    }

    // 3) Si no lo encontramos, informamos y abortamos
    if (!user) {
      await chatClient.say(
        channelName,
        `/me ⚠️ Usuario “${target}” no encontrado en Twitch.`
      );
      return;
    }

  } else if (target == null) {
      console.log("El target es null");
  }

  // 4) Ahora que user existe, ejecutamos la acción
  try {
    switch (action) {
      case 'ban':
        console.log(user);

        await apiClient.moderation.banUser(broadcasterId, {
          user: user.id,
          reason: value || "Moderación automática"
        });

        await chatClient.say(channelName, `/me 🚫 ${user.displayName} baneado.`);
        break;

      case 'timeout':
        await apiClient.moderation.banUser(broadcasterId, {
          user: user.id,
          reason: value || "Moderación automática",
          duration: value
        });

        await chatClient.say(channelName, `/me ⏱️ ${user.displayName} timeout de ${value}s.`);
        break;

      case 'unban':
        await apiClient.moderation.unbanUser(broadcasterId, user.id);

        await chatClient.say(channelName, `/me ✅ ${user.displayName} desbaneado.`);
        break;

      case 'setTitle':
        await apiClient.channels.updateChannelInfo(broadcasterId, { title: value });
        await chatClient.say(channelName, `/me ✏️ Título cambiado a: ${value}`);
        break;

      case 'setCategory':
        await chatClient.say(channelName, `!game ${value}`);
        break;

      case 'raid':
        await chatClient.say(channelName, `/raid ${user.displayName}`);
        break;

      case 'dialogo':
        const prompt = buildPrompt(value, "Elcreado_GG");
        await messageApi(prompt, user, value);
        
        break;

      default:
        await chatClient.say(channelName, `/me ❓ Acción desconocida: ${action}`);
    }
  } catch (err) {
    console.error('Error en executeModeration:', err);
    await chatClient.say(
      channelName,
      `/me ⚠️ No pude ejecutar "${action}" sobre ${user.displayName}.`
    );
  }
}
