import { readFile } from 'fs/promises';
import { Context } from "telegraf";
import path from 'path';

const HELP_TEXT = await readFile(path.join(process.cwd(), '/help.txt'), {encoding: 'utf-8'});

function help(ctx: Context) {
    ctx.reply(HELP_TEXT);
}

export default help;