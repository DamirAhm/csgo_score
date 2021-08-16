import { Context, Markup, Scenes } from 'telegraf';
import { Update } from 'typegram';

import { actions } from './../constants.js';
import UserModel, { UserDocument } from '../models/user.model.js';
import { PICK_SUBSCRIPTION_WIZARD } from '../scenes/pickSubscription.js';
import { backKeyboard } from '../utils/markup.js';
import { message, message_from } from '../types';

async function rename(ctx: Context<Update>) {
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
	return (picked: string | null) => {
		if (picked === null) {
			ctx.reply('Вы ни на кого не подписаны');
			return;
		}

		//@ts-ignore
		ctx.scene.enter(RENAME_SUB_WIZARD, {
			//@ts-ignore
			user: ctx.session.user,
			subName: picked,
		});
	};
}

const RENAME_SUB_WIZARD = 'RENAME_SUB_WIZARD';

export const renameSubWizard = new Scenes.WizardScene(
	RENAME_SUB_WIZARD,
	ctx => {
		ctx.reply('Введите новое имя для подписки', backKeyboard());
		ctx.wizard.next();
	},
	async ctx => {
		//@ts-ignore
		const { user, subName } = ctx.wizard.state as {
			user: UserDocument;
			subName: string;
		};

		//@ts-ignore
		if (ctx.message?.text === undefined) {
			ctx.reply('Имя должно быть текстом');
			return;
			//@ts-ignore
		} else if (ctx.message.text.toLowerCase() === actions.BACK) {
			//@ts-ignore
			ctx.scene.enter(PICK_SUBSCRIPTION_WIZARD, {
				subscriptions: user.subscriptions,
				callback: createPickCallback(ctx),
			});
			return;
		}

		//@ts-ignore
		const { text } = ctx.message as message;

		const subscription = user.subscriptions.find(
			({ name }) => name === subName
		);

		if (subscription) {
			subscription.name = text;
			await user.save();
			ctx.reply(
				`Имя подписки изменено на ${text}`,
				Markup.removeKeyboard()
			);
		} else {
			ctx.reply('Простите произошла ошибка');
		}
		ctx.scene.leave();
	}
);

export default rename;
