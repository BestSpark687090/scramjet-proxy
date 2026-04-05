"use strict";
/**
 *
 * @param {string} input
 * @param {string} template Template for a search query.
 * @returns {string} Fully qualified URL
 */
function search(input, template) {
	try {
		// input is a valid URL:
		// eg: https://example.com, https://example.com/test?q=param
		return new URL(input).toString();
	} catch (err) {
		// input was not a valid URL
	}

	try {
		// input is a valid URL when http:// is added to the start:
		// eg: example.com, https://example.com/test?q=param
		const url = new URL(`http://${input}`);
		// only if the hostname has a TLD/subdomain
		if (url.hostname.includes(".")) return url.toString();
	} catch (err) {
		// input was not valid URL
	}
	if (
		input.includes("strongdog") ||
		input.includes("copchurch.org") ||
		input.includes("venustexas.org") ||
		input.includes("strong dog")
	) {
		alert(
			"You do know I have StrongDog, right...? It's in the 'Other Games, I guess' section."
		);
		alert(
			"If you do need a working strongdog link for your blocker, email me at bestspark687090@gmail.com or DM me on discord at BestSpark687090."
		);
	}
	// input may have been a valid URL, however the hostname was invalid

	// Attempts to convert the input to a fully qualified URL have failed
	// Treat the input as a search query
	return template.replace("%s", encodeURIComponent(input));
}
