import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';

import UserModel, {
	SubscriptionDocument,
	UserDocument,
} from './models/user.model.js';
import { getGameState, isPlayingCS } from './steamMiniprofile.js';

export async function pollChanges(bot: Telegraf<Context<Update>>) {
	try {
		const users = await UserModel.find({});

		for (const user of users) {
			const sendMessage = (message: string) =>
				bot.telegram.sendMessage(user.id, message);
			const { subscriptions } = user;

			for (const subscription of subscriptions.filter(s => s.active)) {
				const { steamId, previousState, name } = subscription;
				const isPlaying = await isPlayingCS(steamId);

				let gameState = null;

				if (!isPlaying && previousState !== null) {
					sendMessage(`${name} перестал играть`);
				} else if (isPlaying && previousState === null) {
					gameState = await getGameState(steamId);

					if (gameState !== null) {
						sendMessage(`${name} начал играть\n${gameState}`);
					}
				} else if (isPlaying && previousState !== null) {
					gameState = await getGameState(steamId);

					if (gameState !== previousState) {
						if (gameState !== null) {
							sendMessage(`${name}: ${gameState}`);
						}
					}
				}

				subscription.previousState = gameState;
				user.save();
			}
		}

		return;
	} catch (err) {
		if (err instanceof Error) {
			console.log(err.message, err.stack);
		} else {
			console.log(err);
		}
	}
}
