import {
	InlineKeyboardButton,
	KeyboardButton,
} from 'telegraf/typings/core/types/typegram';

export type message = {
	from: message_from;
	text: string;
};
export type message_from = {
	id: string;
	first_name: string;
};

export type Hideable<B> = B & { hide?: boolean };
export type HideableKBtn = Hideable<KeyboardButton>;
export type HideableIKBtn = Hideable<InlineKeyboardButton>;

export interface JSONMiniprofile {
	in_game?: InGame;
}

export interface InGame {
	name: string;
	is_non_steam: boolean;
	logo: string;
}
