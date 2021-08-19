import convert from 'xml-js';
import SteamId from 'steamid';
import fetch from 'node-fetch';

const steamId64UrlRegEx = /https:\/\/steamcommunity.com\/profiles\/([0-9]+)\/?/;
const steamIdUrlRegEx = /https:\/\/steamcommunity.com\/id\/([0-9a-zA-Z]+)\/?/;

export const getSteamId = async (steamUrl: string) => {
	try {
		let id64 = null;
		if (steamId64UrlRegEx.test(steamUrl)) {
			id64 = getId64FromProfileUrl(steamUrl);
		} else if (steamIdUrlRegEx.test(steamUrl)) {
			const steamXMLUrl = getSteamXMLUrl(steamUrl);

			const xmlResponse = await fetch(steamXMLUrl);
			const xml = await xmlResponse.text();

			const page = convert.xml2js(xml);

			id64 = page.elements[0].elements[0].elements[0].text;
		} else {
			return null;
		}
		if (id64 === null) return null;

		return id64ToSteamId(id64);
	} catch (err) {
		if (err instanceof Error) {
			console.log(err.message, err.stack);
			throw err;
		}
		console.log(err);
		return null;
	}
};

const steamIdRegEx = /\[[A-Z]:[01]:([0-9]+)\]/;
const id64ToSteamId = (id64: string) => {
	const sid = new SteamId(id64);
	const steamId = sid.getSteam3RenderedID();

	const match = steamId.match(steamIdRegEx);

	if (match) {
		const [, id] = match;

		return id;
	} else {
		return null;
	}
};

const getId64FromProfileUrl = (steamUrl: string) => {
	const match = steamUrl.match(steamId64UrlRegEx);

	if (match) {
		const [, id64] = match;

		return id64;
	} else {
		return null;
	}
};

const getSteamXMLUrl = (steamUrl: string) => steamUrl + '?xml=1';
