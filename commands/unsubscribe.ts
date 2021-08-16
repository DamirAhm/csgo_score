import { Context, Markup } from 'telegraf';
import UserModel, { UserDocument } from '../models/user.model.js';
import { PICK_SUBSCRIPTION_WIZARD } from '../scenes/pickSubscription.js';
import { Update } from 'typegram';
import { message_from } from '../types.js';

async function unsubscribe(ctx: Context) {
	try {
		//@ts-ignore
		const { id } = (
			ctx.message !== undefined
				? ctx.message.from
				: ctx.callbackQuery?.from
		) as message_from;

		const user = await UserModel.findOne({ id });

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
			ctx.reply('Вы ни на кого не подписаны');
			return;
		}

		//@ts-ignore
		const { user } = ctx.session as { user: UserDocument };
		user.subscriptions = user.subscriptions.filter(s => s.name !== picked);
		await user.save();

		ctx.reply(`Подписка на ${picked} отменена`, Markup.removeKeyboard());
	};
}

export default unsubscribe;
