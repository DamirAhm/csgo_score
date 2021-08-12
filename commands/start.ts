import { Context } from "telegraf";
import UserModel from '../models/user.model.js';
import { message_from } from '../types';

async function start(ctx: Context) {
    try {
        //@ts-ignore
        const { id, first_name: name } = ctx.update.message.from as message_from;

        const user = await UserModel.findOne({ id });

        if (user === null) {
            const newUser = new UserModel({ id, name });
            await newUser.save();
        }
        ctx.reply(`Привет ${name}`);
    } catch (err) {
        if (err instanceof Error) {
            console.log(err.message, err.stack);
        } else {
            console.log(err);
        }
    }
}

export default start;