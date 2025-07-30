import emoji_shortcodes from 'data/emoji-shortcodes.json';

/**
 * 2581 shortcodes, each paired with an emoji. Generated from
 * emojibase-data.
 * 
 * All of the shortcodes are licensed under MIT. Copyright (c) 2017-2019
 * Miles Johnson at Emojibase.
 * 
 * @see https://github.com/milesj/emojibase
 * @version 16.0.3
 */
const EMOJI_SHORTCODES = emoji_shortcodes as Record<string, string>;

export default EMOJI_SHORTCODES;