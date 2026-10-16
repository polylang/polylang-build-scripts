/**
 * Internal dependencies
 */
const {
	getBundledEntryKey,
	getBasenameEntryKey,
	buildBundledEntry,
	getEntryKeyResolver,
} = require( './entry-keys' );

describe( 'getBundledEntryKey', () => {
	it( 'should strip leading ./ and file extension', () => {
		expect( getBundledEntryKey( './admin/settings.js' ) ).toBe(
			'admin/settings'
		);
	} );

	it( 'should preserve nested directory structure', () => {
		expect( getBundledEntryKey( './modules/admin/widget.js' ) ).toBe(
			'modules/admin/widget'
		);
	} );

	it( 'should use basename only for root-level files', () => {
		expect( getBundledEntryKey( './main.js' ) ).toBe( 'main' );
	} );
} );

describe( 'getBasenameEntryKey', () => {
	it( 'should use basename regardless of directory', () => {
		expect( getBasenameEntryKey( './js/src/settings.js' ) ).toBe(
			'settings'
		);
		expect( getBasenameEntryKey( './vendor/pkg/js/src/settings.js' ) ).toBe(
			'settings'
		);
	} );
} );

describe( 'buildBundledEntry', () => {
	it( 'should throw when two files resolve to the same key', () => {
		expect( () =>
			buildBundledEntry(
				[ './a/foo.js', './b/foo.js' ],
				getEntryKeyResolver( 'basename' )
			)
		).toThrow( /Duplicate bundled entry key "foo"/ );
	} );
} );
