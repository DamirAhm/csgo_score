import { Markup, Context } from 'telegraf';
import { readFile } from 'fs/promises';
import path from 'path';

import { commands } from '../constants.js';

const HELP_TEXT = await readFile(path.join(process.cwd(), '/help.txt'), {
	encoding: 'utf-8',
});

function help(ctx: Context) {
	ctx.reply(
		HELP_TEXT,
		Markup.inlineKeyboard([
			[
				Markup.button.callback(commands.SUBSCRIBE, 'SUBSCRIBE'),
				Markup.button.callback(commands.UNSUBSCRIBE, 'UNSUBSCRIBE'),
			],
			[
				Markup.button.callback(commands.SUBSCRIPTIONS, 'SUBSCRIPTIONS'),
				Markup.button.callback(commands.RENAME, 'RENAME'),
			],
			[
				Markup.button.callback(commands.MUTE, 'MUTE'),
				Markup.button.callback(commands.UNMUTE, 'UNMUTE'),
			],
		])
	);
}

export default help;
