import emoji_shortnames from 'data/emoji-shortnames.json';

/**
 * 1,941 emojis, with alternate encodings / skin tone variants excluded.
 * Each is paired with its CLDR shortname, with the first letter
 * capitalized.
 * 
 * @see https://github.com/milesj/emojibase
 * @version 16.0.3
 */
const EMOJI_SHORTNAMES = emoji_shortnames as Record<string, string>;

export default EMOJI_SHORTNAMES;