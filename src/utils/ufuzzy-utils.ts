import uFuzzy from '@leeoniya/ufuzzy';

export const DEFAULT_UFUZZY_OPT = {
	intraMode: 0, // IntraMode.MultiInsert
	intraIns: Infinity,
	sort: typeAheadSort
};

const ALPHABETIC_CMP = new Intl.Collator('en').compare;

/**
 * Sort preset for type ahead best matches. Based on uFuzzy sort preset.
 * This code is licensed under MIT. Copyright (c) 2022 Leon Sorokin.
 * 
 * @see https://github.com/leeoniya/uFuzzy/blob/main/demos/compare.html
 */
function typeAheadSort(info: uFuzzy.Info, haystack: string[], _needle: string): number[] {
	let { idx, chars, terms, interLft2, interLft1, start, intraIns, interIns } = info;

	return idx.map((_v, i) => i).sort((ia, ib) => (
		// most contig chars matched
		chars[ib] - chars[ia] ||
		// least char intra-fuzz (most contiguous)
		intraIns[ia] - intraIns[ib] ||
		// earliest start of match
		start[ia] - start[ib] ||
		// shortest match first
		haystack[idx[ia]].length - haystack[idx[ib]].length ||
		// most prefix bounds, boosted by full term matches
		(
			(terms[ib] + interLft2[ib] + 0.5 * interLft1[ib]) -
			(terms[ia] + interLft2[ia] + 0.5 * interLft1[ia])
		) ||
		// highest density of match (least term inter-fuzz)
		interIns[ia] - interIns[ib] ||
		// alphabetic
		ALPHABETIC_CMP(haystack[idx[ia]], haystack[idx[ib]])
	));
}