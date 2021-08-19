import { Context, Markup, Scenes } from 'telegraf';

import UserModel from './../models/user.model.js';
import { actions, CSGO_NAME } from '../constants.js';
import { backKeyboard } from '../utils/markup.js';
import { getGameState, isPlayingCS } from '../steamMiniprofile.js';
import { getSteamId } from '../steamIds.js';

import { message_from, message } from '../types';
import { updateNonNullChain } from 'typescript';

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
				const steamId = await getSteamId(url);

				if (steamId === null) {
					ctx.reply('Не удается найти профиль, попробуйте еще раз');
					return;
				}

				const isPlaying = await isPlayingCS(steamId);
				let gameState: string | null = null;

				//@ts-ignore
				const { name } = ctx.wizard.state;
				if (!isPlaying) {
					//@ts-ignore
					ctx.reply(
						`Вы подписались на ${name},\nон(она) сейчас не играет`
					);
				} else {
					gameState = await getGameState(steamId);

					ctx.reply(
						`Вы подписались на ${name},\nон(она) сейчас играет\n${gameState}`
					);
				}

				await UserModel.updateOne(
					{ id: id.toString() },
					{
						$push: {
							subscriptions: [
								{ name, steamId, previousState: gameState },
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
