import { Context } from 'telegraf';
import UserModel from '../models/user.model.js';
import { message_from } from '../types';
import help from './help.js';

async function start(ctx: Context) {
	try {
		//@ts-ignore
		const { id, first_name: name } = ctx.update.message
			.from as message_from;

		const user = await UserModel.findOne({ id });

		if (user === null) {
			const newUser = new UserModel({ id, name });
			await newUser.save();
		}

		ctx.tg.sendMessage(
			ctx.chat?.id || '',
			`Привет  ${name}, этот бот поможет тебе отслеживать активность твоих друзей`
		);
		help(ctx);
	} catch (err) {
		if (err instanceof Error) {
			console.log(err.message, err.stack);
		} else {
			console.log(err);
		}
	}
}

export default start;
