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

/**
 * Derive a webpack entry key from the file basename (legacy per-file naming).
 *
 * @param {string} filename Relative entry path (e.g. `./js/src/settings.js`).
 * @return {string} Basename without extension.
 */
const getBasenameEntryKey = ( filename ) => path.parse( filename ).name;

/**
 * @param {'relative'|'basename'} entryKeyMode Entry key mode.
 * @return {(filename: string) => string} Key resolver for bundled multi-entry configs.
 */
const getEntryKeyResolver = ( entryKeyMode ) => {
	if ( entryKeyMode === 'basename' ) {
		return getBasenameEntryKey;
	}
	if ( entryKeyMode === 'relative' ) {
		return getBundledEntryKey;
	}

	throw new Error(
		`Invalid entryKey "${ entryKeyMode }". Expected "relative" or "basename".`
	);
};

/**
 * Build a webpack entry object from relative file paths, detecting key collisions.
 *
 * @param {string[]}                     fileNames   Relative entry paths.
 * @param {(filename: string) => string} keyResolver Resolves each path to an entry key.
 * @return {Object<string, string>} Webpack entry map.
 */
const buildBundledEntry = ( fileNames, keyResolver ) => {
	const entry = {};

	for ( const filename of fileNames ) {
		const key = keyResolver( filename );

		if ( Object.prototype.hasOwnProperty.call( entry, key ) ) {
			throw new Error(
				`Duplicate bundled entry key "${ key }" for "${ filename }" and "${ entry[ key ] }".`
			);
		}

		entry[ key ] = filename;
	}

	return entry;
};

module.exports = {
	getBundledEntryKey,
	getBasenameEntryKey,
	getEntryKeyResolver,
	buildBundledEntry,
};
