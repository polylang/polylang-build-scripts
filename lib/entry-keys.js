/**
 * External dependencies.
 */
const path = require( 'path' );

/**
 * Derive a stable webpack entry key from a relative source path.
 *
 * Uses the path relative to the working directory (without leading `./`)
 * and without the file extension, so nested outputs preserve directory structure.
 * Example: `./modules/admin/settings.js` → `modules/admin/settings`.
 *
 * Note: the legacy per-file strategy uses only the basename (`settings`), which
 * can collide when two files share a name in different directories.
 *
 * @param {string} filename Relative entry path (e.g. `./admin/settings.js`).
 * @return {string} Entry key for webpack multi-entry configs.
 */
const getBundledEntryKey = ( filename ) => {
	const relativePath = filename.replace( /^\.\//, '' );
	const parsed = path.parse( relativePath );
	const directory = parsed.dir;

	return directory ? `${ directory }/${ parsed.name }` : parsed.name;
};

module.exports = { getBundledEntryKey };
