import { Context, Telegraf } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { getUserDetails } from './index.js';
import UserModel, {
	SubscriptionDocument,
	UserDetails,
	UserDetailsDocument,
	UserDocument,
} from './models/user.model.js';

export async function pollChanges(bot: Telegraf<Context<Update>>) {
	try {
		const users = await UserModel.find({});

		const subscriptions = new Set<string>();
		const toNotify = new Map<string, UserDocument[]>();

		for (const user of users) {
			if (user.subscriptions.length > 0) {
				for (const subscription of user.subscriptions) {
					subscriptions.add(subscription.url);

					const toNotifyForSubscription =
						toNotify.get(subscription.url) ?? [];
					toNotify.set(subscription.url, [
						...toNotifyForSubscription,
						user,
					]);
				}
			}
		}

		const updatedDetails = new Map<string, UserDetails | null>();

		for (const subscription of subscriptions) {
			const userDetails = await getUserDetails(subscription);

			const notifiables = toNotify.get(subscription);

			if (notifiables !== undefined) {
				updatedDetails.set(subscription, userDetails);
			}
		}

		for (const user of users) {
			const subPrevStates = new Map<
				string,
				[string, SubscriptionDocument['previousState']]
			>();

			for (const subscription of user.subscriptions) {
				if (subscription.active) {
					subPrevStates.set(subscription.url, [
						subscription.name,
						subscription.previousState,
					]);
				}
				subscription.previousState = updatedDetails.get(
					subscription.url
				) as UserDetailsDocument;
			}

			await user.save();

			for (const [url, [name, prevSubState]] of subPrevStates) {
				if (!isEqualDetails(updatedDetails.get(url), prevSubState)) {
					await sendSubNotification(
						name,
						prevSubState,
						updatedDetails.get(url) as UserDetails | null,
						text => bot.telegram.sendMessage(user.id, text)
					);
				}
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

export function isEqualDetails(
	cur: UserDetails | null | undefined,
	prev: UserDetails | null | undefined
) {
	return (
		cur?.state === prev?.state &&
		cur?.gameState === prev?.gameState &&
		cur?.gameDetails === prev?.gameDetails
	);
}

function sendSubNotification(
	name: string,
	prevSubState: SubscriptionDocument['previousState'],
	userDetails: UserDetails | null,
	sendMessage: (text: string) => void
) {
	const text = formNotificationText(name, userDetails, prevSubState);

	sendMessage(text);
}
function formNotificationText(
	name: string,
	userDetails: UserDetails | null,
	previousState: UserDetailsDocument | null
) {
	let text = `${name}: `;

	if (userDetails?.state !== previousState?.state) {
		text += userDetails?.state ?? 'не играет';
	}
	if (userDetails && userDetails.gameState !== previousState?.gameState) {
		text += `\n${userDetails.gameState}`;
	}

	if (
		userDetails?.gameDetails &&
		userDetails.gameDetails !== previousState?.gameDetails
	) {
		text += `\n${userDetails.gameDetails}`;
	}

	return text;
}
