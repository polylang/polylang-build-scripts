/**
 * External dependencies
 */
const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );
const webpack = require( 'webpack' );

/**
 * Internal dependencies
 */
const { transformCssEntry } = require( './css.js' );

describe( 'transformCssEntry integration', () => {
	const fixturesDirectory = path.join( __dirname, '__fixtures__/css' );
	const entryFile = path.join( fixturesDirectory, 'entry.css' );

	const runWebpack = ( config ) =>
		new Promise( ( resolve, reject ) => {
			webpack( config, ( error, stats ) => {
				if ( error ) {
					reject( error );
					return;
				}

				if ( stats.hasErrors() ) {
					reject( new Error( stats.toString( { colors: false } ) ) );
					return;
				}

				resolve( stats );
			} );
		} );

	it( 'should resolve @import in unminified and minified CSS output', async () => {
		const outputDirectory = fs.mkdtempSync(
			path.join( os.tmpdir(), 'pll-css-build-' )
		);

		try {
			await runWebpack(
				transformCssEntry( outputDirectory, false, true )( entryFile )
			);
			await runWebpack(
				transformCssEntry( outputDirectory, true, true )( entryFile )
			);

			const unminifiedCss = fs.readFileSync(
				path.join( outputDirectory, 'entry.css' ),
				'utf8'
			);
			const minifiedCss = fs.readFileSync(
				path.join( outputDirectory, 'entry.min.css' ),
				'utf8'
			);

			expect( unminifiedCss ).not.toContain( '@import' );
			expect( minifiedCss ).not.toContain( '@import' );
			expect( unminifiedCss ).toContain( '.partial' );
			expect( minifiedCss ).toContain( '.partial' );
			expect( unminifiedCss ).toContain( '.entry' );
			expect( minifiedCss ).toContain( '.entry' );
			expect( fs.existsSync( path.join( outputDirectory, 'lib' ) ) ).toBe(
				false
			);
		} finally {
			fs.rmSync( outputDirectory, { recursive: true, force: true } );
		}
	} );
} );
