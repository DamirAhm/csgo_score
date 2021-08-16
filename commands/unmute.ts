import { Context, Markup } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';

import UserModel, { SubscriptionDocument } from '../models/user.model.js';
import { PICK_SUBSCRIPTION_WIZARD } from '../scenes/pickSubscription.js';
import { message_from } from '../types.js';

async function unmute(ctx: Context) {
	try {
		//@ts-ignore
		const { id } = (
			ctx.message !== undefined
				? ctx.message.from
				: ctx.callbackQuery?.from
		) as message_from;
		const user = await UserModel.findOne({ id: id.toString() });

		if (user === null) {
			ctx.reply('Сначала напишите /start');
			return;
		}

		//@ts-ignore
		ctx.session.user = user;

		//@ts-ignore
		ctx.scene.enter(PICK_SUBSCRIPTION_WIZARD, {
			subscriptions: user.subscriptions,
			callback: createPickCallback(ctx),
			filter: (sub: SubscriptionDocument) => !sub.active,
		});
	} catch (err) {
		if (err instanceof Error) {
			console.log(err.message, err.stack);
		} else {
			console.log(err);
		}
	}
}

function createPickCallback(ctx: Context<Update>) {
	return async (picked: string | null) => {
		if (picked === null) {
			ctx.reply('Вы ни на кого не подписаны или никто не замьючен');
			return;
		}

		//@ts-ignore
		const { user } = ctx.session as { user: UserDocument };

		for (const sub of user.subscriptions) {
			if (sub.name === picked) {
				sub.active = true;
			}
		}

		await user.save();

		ctx.reply(
			`Вы начнёте получать обновления от игрока ${picked}`,
			Markup.removeKeyboard()
		);
	};
}

export default unmute;
