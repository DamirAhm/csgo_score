import { Markup } from "telegraf";
import { actions } from "../constants.js";
import { HideableKBtn } from "../types";

export function backKeyboard(buttons?: HideableKBtn[][]) {
    return Markup.keyboard([...(buttons ?? []), [actions.BACK]]).resize();
}