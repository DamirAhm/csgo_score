import dotenv from 'dotenv';
import { Scenes, session, Telegraf } from 'telegraf';
import { WizardScene } from 'telegraf/typings/scenes';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer';

import subscribe, { subscribeWizard } from './commands/subscribe.js';
import unsubscribe from './commands/unsubscribe.js';
import subscriptions from './commands/subscriptions.js';
import help from './commands/help.js';
import start from './commands/start.js';
import parsingFns from './parsing.js';
import { pollChanges } from './polling.js';
import pickSubscriptionWizard from './scenes/pickSubscription.js';
import mute from './commands/mute.js';
import unmute from './commands/unmute.js';
import rename, { renameSubWizard } from './commands/rename.js';

dotenv.config();

const browser = await puppeteer.launch();
export const { getUserDetails } = parsingFns(browser);

if (process.env.TG_TOKEN === undefined) throw new Error('TG_TOKEN is empty');
const bot = new Telegraf(process.env.TG_TOKEN);
const stage = new Scenes.Stage([
	subscribeWizard,
	pickSubscriptionWizard,
	renameSubWizard,
] as WizardScene<any>[]);

bot.use(session());
bot.use(stage.middleware());

bot.start(start);
bot.help(help);
bot.command('subscriptions', subscriptions);
bot.command('subscribe', subscribe);
bot.command('unsubscribe', unsubscribe);
bot.command('mute', mute);
bot.command('unmute', unmute);
bot.command('rename', rename);
bot.use(Telegraf.reply('Че несёшь?'));

mongoose.connect(
	process.env.MONGODB_URI as string,
	{ useNewUrlParser: true, useUnifiedTopology: true },
	async () => {
		console.log('DataBase connected');
		await bot.launch();
		console.log('Bot launched');

		try {
			pollChangesLoop();
		} catch (err) {
			console.log(err);
		}

		// Enable graceful stop
		process.once('SIGINT', () => bot.stop('SIGINT'));
		process.once('SIGTERM', () => bot.stop('SIGTERM'));
	}
);

async function pollChangesLoop() {
	await Promise.allSettled([pollChanges(bot), asyncTimer(10000)]);
	pollChangesLoop();
}
function asyncTimer(time: number) {
	return new Promise(res => setTimeout(res, time));
}
