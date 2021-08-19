import fetch from 'node-fetch';
import cheerio from 'cheerio';

import { CSGO_NAME } from './constants.js';

import { JSONMiniprofile } from './types';

const getMiniprofileUrl = (steamId: string) =>
	`https://steamcommunity.com/miniprofile/${steamId}`;
const getJSONMiniprofileUrl = (steamId: string) =>
	`https://steamcommunity.com/miniprofile/${steamId}/json`;

export const isPlayingCS = async (steamId: string) => {
	try {
		const jsonMiniprofileUrl = getJSONMiniprofileUrl(steamId);

		const response = await fetch(jsonMiniprofileUrl);

		// if (!response.ok) {
		// 	console.log(response);

		// 	return false;
		// }

		const { in_game } = (await response.json()) as JSONMiniprofile;

		console.log(in_game);

		return in_game ? in_game.name === CSGO_NAME : false;
	} catch (err) {
		if (err instanceof Error) {
			console.log(err.message, err.stack);
			throw err;
		} else {
			console.log(err);
		}
		return false;
	}
};

const GAME_SECTION_QUERY = '.miniprofile_gamesection';
const GAME_DETAILS_QUERY = '.rich_presence';
export const getGameState = async (steamId: string) => {
	try {
		const miniprofileUrl = getMiniprofileUrl(steamId);
		const response = await fetch(miniprofileUrl);
		const html = await response.text();

		const $ = cheerio.load(html);

		const gameSection = $(GAME_SECTION_QUERY);

		if (gameSection.length === 0) return null;
		else {
			const details = $(GAME_DETAILS_QUERY);

			if (details.length === 0) return null;
			else {
				const detailsText = details.text();

				return detailsText;
			}
		}
	} catch (err) {
		if (err instanceof Error) {
			console.log(err.message, err.stack);
			throw err;
		}
		console.log(err);
		return null;
	}
};
