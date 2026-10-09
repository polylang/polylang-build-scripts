/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const webpack = require( 'webpack' );

/**
 * Internal dependencies
 */
const { getVanillaConfig } = require( './vanilla' );

describe( 'getVanillaConfig bundled integration', () => {
	const fixturesDirectory = path.join( __dirname, '__fixtures__/vanilla' );

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

	it( 'should build nested JS/CSS outputs and resolve @import', async () => {
		const jsOutputDirectory = path.join( fixturesDirectory, 'build-js' );
		const cssOutputDirectory = path.join( fixturesDirectory, 'build-css' );

		fs.rmSync( jsOutputDirectory, { recursive: true, force: true } );
		fs.rmSync( cssOutputDirectory, { recursive: true, force: true } );
		fs.mkdirSync( jsOutputDirectory, { recursive: true } );
		fs.mkdirSync( cssOutputDirectory, { recursive: true } );

		const configs = getVanillaConfig( {
			workingDirectory: fixturesDirectory,
			jsPatterns: [ '**/*.js' ],
			cssPatterns: [ 'admin/style.css' ],
			jsBuildDirectory: jsOutputDirectory,
			cssBuildDirectory: cssOutputDirectory,
			isProduction: true,
			strategy: 'bundled',
		} );

		expect( configs ).toHaveLength( 4 );

		try {
			for ( const config of configs ) {
				await runWebpack( config );
			}

			expect(
				fs.existsSync(
					path.join( jsOutputDirectory, 'admin/settings.js' )
				)
			).toBe( true );
			expect(
				fs.existsSync(
					path.join( jsOutputDirectory, 'admin/settings.min.js' )
				)
			).toBe( true );
			expect(
				fs.existsSync(
					path.join( jsOutputDirectory, 'modules/admin/widget.js' )
				)
			).toBe( true );
			expect(
				fs.existsSync(
					path.join(
						jsOutputDirectory,
						'modules/admin/widget.min.js'
					)
				)
			).toBe( true );

			const unminifiedCss = fs.readFileSync(
				path.join( cssOutputDirectory, 'admin/style.css' ),
				'utf8'
			);
			const minifiedCss = fs.readFileSync(
				path.join( cssOutputDirectory, 'admin/style.min.css' ),
				'utf8'
			);

			expect( unminifiedCss ).not.toContain( '@import' );
			expect( minifiedCss ).not.toContain( '@import' );
			expect( unminifiedCss ).toContain( '.partial {' );
			expect( unminifiedCss ).toContain( '.entry {' );
			expect( minifiedCss ).toContain( '.partial{' );
			expect( minifiedCss ).toContain( '.entry{' );
		} finally {
			fs.rmSync( jsOutputDirectory, { recursive: true, force: true } );
			fs.rmSync( cssOutputDirectory, { recursive: true, force: true } );
		}
	} );
} );
