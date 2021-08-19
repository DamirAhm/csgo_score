import { Context } from 'telegraf';
import UserModel, { SubscriptionDocument } from '../models/user.model.js';
import { message_from } from '../types';

async function subscriptions(ctx: Context) {
	//@ts-ignore
	const { id } = (
		ctx.message !== undefined ? ctx.message.from : ctx.callbackQuery?.from
	) as message_from;

	const user = await UserModel.findOne({ id });

	if (user == null) {
		ctx.reply('Сначала напишите /start');
		return;
	}

	const subscriptions = user.subscriptions;

	if (subscriptions.length === 0) {
		ctx.reply('Вы ни на кого не подписаны');
		return;
	}

	for (const sub of subscriptions) {
		await sendSubInfo(sub, text =>
			ctx.tg.sendMessage(ctx.chat?.id || '', text)
		);
	}
}

export function sendSubInfo(
	sub: SubscriptionDocument,
	sendMessage: (text: string) => void
) {
	const subText = formSubText(sub);

	return sendMessage(subText);
}

function formSubText(sub: SubscriptionDocument) {
	const { previousState } = sub;

	let mainInfo = `${sub.name}: ${previousState ?? 'не играет'}`;

	return mainInfo;
}

export default subscriptions;
