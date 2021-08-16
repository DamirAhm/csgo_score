import { Context, Markup, Scenes } from 'telegraf';

import UserModel from './../models/user.model.js';
import { message_from, message } from '../types';
import { getUserDetails } from '../index.js';
import { actions, CSGO_NAME } from '../constants.js';
import { backKeyboard } from '../utils/markup.js';

const SUBSCRIBE_WIZARD = 'SUBSCRIBE_WIZARD';

const URL_REGEX =
	/(https:\/\/)?steamcommunity.com\/(profiles|id)\/[a-zA-Z0-9]+/;

async function subscribe(ctx: Context) {
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
		ctx.scene.enter(SUBSCRIBE_WIZARD);
	} catch (err) {
		if (err instanceof Error) {
			console.log(err.message, err.stack);
		} else {
			console.log(err);
		}
	}
}

export const subscribeWizard = new Scenes.WizardScene(
	SUBSCRIBE_WIZARD,
	ctx => {
		ctx.reply('Дайте имя подписке', backKeyboard());
		ctx.wizard.next();
	},
	async ctx => {
		//@ts-ignore
		if (ctx.message.text === undefined) {
			ctx.reply('Имя должно быть текстом');
			return;
		} else if (
			//@ts-ignore
			ctx.message.text.toLowerCase() === actions.BACK.toLowerCase()
		) {
			ctx.reply('Отмена подписки', Markup.removeKeyboard());
			ctx.scene.leave();
			return;
		}

		const {
			from: { id },
			text: name,
			//@ts-ignore
		} = ctx.message as message;

		const user = await UserModel.findOne({ id });

		if (user == null)
			throw new Error(
				'Не зареганный юзер ворвался на 2 step subscribe`а'
			);

		const subscriptions = user.subscriptions.map(({ name }) =>
			name.toLowerCase()
		);

		if (subscriptions.includes(name.toLowerCase())) {
			ctx.reply(
				'Подписка с таким именем уже существует, придумай что то пооригинальнее'
			);
			return;
		}

		//@ts-ignore
		ctx.wizard.state.name = name;

		ctx.reply('Скинь ссылку на аккаунт');
		ctx.wizard.next();
	},
	async ctx => {
		try {
			//@ts-ignore
			if (ctx.message.text === undefined) {
				ctx.reply('Ссылка должна быть тестком');
			} else if (
				//@ts-ignore
				ctx.message.text.toLowerCase() === actions.BACK.toLowerCase()
			) {
				ctx.reply('Дайте имя подписке');
				ctx.wizard.selectStep(1);
				return;
			}
			const {
				//@ts-ignore
				from: { id },
				//@ts-ignore
				text: url,
			} = ctx.message;

			if (URL_REGEX.test(url)) {
				ctx.tg.sendMessage(
					ctx.chat!.id,
					'Обрабатываю страницу',
					Markup.removeKeyboard()
				);
				const userDetails = await getUserDetails(url);

				//@ts-ignore
				const { name } = ctx.wizard.state;

				if (userDetails === null) {
					//@ts-ignore
					ctx.reply(
						`Вы подписались на ${name},\nон(она) сейчас не играет`
					);
				} else if (userDetails.gameState === CSGO_NAME) {
					ctx.reply(
						`Вы подписались на ${name},\nон(она) сейчас играет в кс\n${userDetails.gameDetails}`
					);
				} else {
					ctx.reply(
						`Вы подписались на ${name},\nон(она) сейчас играет в ${userDetails.gameState}`
					);
				}

				await UserModel.updateOne(
					{ id: id.toString() },
					{
						$push: {
							subscriptions: [
								{ name, url, previousState: userDetails },
							],
						},
					}
				);
				ctx.scene.leave();
			} else {
				ctx.reply('Неправильный формат ссылки, попробуйте еще раз');
			}
		} catch (err) {
			if (err instanceof Error) {
				console.log(err.message, err.stack);
			} else {
				console.log(err);
			}
		}
	}
);

export default subscribe;
