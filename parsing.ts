import { Browser } from 'puppeteer';
import cheerio from 'cheerio';

import { UserDetails } from './models/user.model.js';

// const USER_DETAILS_QUERY = '.miniprofile_game_details';
const USER_STATE_QUERY = '.game_state';
const USER_GAME_QUERY = '.miniprofile_game_name';
const USER_GAME_DETAILS_QUERY = '.rich_presence';

export default (browser: Browser) => {
	async function getUserPage(steamUrl: string) {
		try {
			const page = await browser.newPage();
			await page.goto(steamUrl, { timeout: 0 });

			const statusInfo = await page.$$(
				'.profile_in_game.persona.in-game'
			);

			if (statusInfo.length === 0) {
				return null;
			}

			const avatars = await page.$$('.playerAvatar.profile_header_size');
			for (const avatar of avatars) await avatar.hover();
			await page.waitForSelector('.miniprofile_container', {
				timeout: 5000,
			});

			const content = await page.content();

			await page.close();

			return content;
		} catch (err) {
			if (err instanceof Error) {
				console.log(err.message, err.stack);
			} else {
				console.log(err);
			}

			return '';
		}
	}

	async function getUserDetails(
		steamUrl: string
	): Promise<UserDetails | null> {
		const userPage = await getUserPage(steamUrl);

		if (userPage === null) return null;

		const $ = cheerio.load(userPage);

		const userDetails = $('.miniprofile_gamesection');

		if (userDetails.children().length > 0) {
			const state = userDetails.find(USER_STATE_QUERY).text();
			const gameState = userDetails.find(USER_GAME_QUERY).text();
			const gameDetails = userDetails
				.find(USER_GAME_DETAILS_QUERY)
				.text();

			return {
				state,
				gameState,
				gameDetails,
			};
		} else {
			return null;
		}
	}

	return {
		getUserDetails,
	};
};
