import { Markup, Scenes } from 'telegraf';

import { actions } from '../constants.js';
import { backKeyboard } from '../utils/markup.js';
import { SubscriptionDocument } from '../models/user.model.js';
import { message } from '../types.js';

export const PICK_SUBSCRIPTION_WIZARD = 'PICK_SUBSCRIPTION_WIZARD';

export type pickSubscriptionIn = {
	subscriptions: SubscriptionDocument[];
	callback: (picked: string | null) => void;
	filter: (sub: SubscriptionDocument) => boolean;
};

const pickSubscriptionWizard = new Scenes.WizardScene(
	PICK_SUBSCRIPTION_WIZARD,
	ctx => {
		try {
			const { subscriptions, callback, filter } = ctx.wizard
				.state as pickSubscriptionIn;

			if (subscriptions === undefined) {
				throw new Error('Не прокинул юзера в сцену выбора подписки');
			}

			const subscriptionNames = subscriptions
				.filter(el => (filter ? filter(el) : true))
				.map(({ name }) => name);
			//@ts-ignore
			ctx.wizard.state.subscriptions = subscriptionNames;

			if (subscriptionNames.length === 0) {
				callback(null);
				ctx.scene.leave();
				return;
			}

			let text = 'выберите подписку?';

			for (let i = 0; i < subscriptionNames.length; i++) {
				text += `\n${i + 1}) ${subscriptionNames[i]}`;
			}

			ctx.reply(text, backKeyboard());
			ctx.wizard.next();
		} catch (err) {
			if (err instanceof Error) {
				console.log(err.message, err.stack);
			} else {
				console.log(err);
			}
		}
	},
	ctx => {
		try {
			const { callback } = ctx.wizard.state as pickSubscriptionIn;

			//@ts-ignore
			if (ctx.message.text === undefined) {
				ctx.reply('Вы должны отправить номер пидписки или её имя');
				return;
			} else if (
				//@ts-ignore
				ctx.message.text.toLowerCase() === actions.BACK.toLowerCase()
			) {
				ctx.reply('Как скажешь босс', Markup.removeKeyboard());
				ctx.scene.leave();
				return;
			}

			const { text } = ctx.message as any as message;
			const { subscriptions } = ctx.wizard.state as {
				subscriptions: string[];
			};

			if (
				subscriptions.findIndex(
					s => s.toLowerCase() === text.toLowerCase()
				) === -1 &&
				(isNaN(+text) || +text < 1 || +text > subscriptions.length)
			) {
				ctx.reply('Вы должны отправить номер пидписки или её имя');
				return;
			}

			const subName =
				subscriptions.find(
					s => s.toLowerCase() === text.toLowerCase()
				) ?? subscriptions[+text - 1];

			callback(subName);
			ctx.scene.leave();
		} catch (err) {
			if (err instanceof Error) {
				console.log(err.message, err.stack);
			} else {
				console.log(err);
			}
		}
	}
);

export default pickSubscriptionWizard;
