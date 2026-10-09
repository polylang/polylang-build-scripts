/**
 * Internal dependencies
 */
const { getBundledEntryKey } = require( './entry-keys' );

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
