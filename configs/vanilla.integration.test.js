/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const webpack = require( 'webpack' );

/**
 * Internal dependencies
 */
const { runWebpackConfigs } = require( '../runner' );
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

	it( 'should build flat JS outputs when entryKey is basename', async () => {
		const jsOutputDirectory = path.join(
			fixturesDirectory,
			'build-js-basename'
		);

		fs.rmSync( jsOutputDirectory, { recursive: true, force: true } );
		fs.mkdirSync( jsOutputDirectory, { recursive: true } );

		const configs = getVanillaConfig( {
			workingDirectory: fixturesDirectory,
			jsPatterns: [ 'admin/settings.js' ],
			cssPatterns: [],
			jsBuildDirectory: jsOutputDirectory,
			cssBuildDirectory: jsOutputDirectory,
			isProduction: true,
			strategy: 'bundled',
			entryKey: 'basename',
		} );

		expect( configs ).toHaveLength( 2 );

		try {
			for ( const config of configs ) {
				await runWebpack( config );
			}

			expect(
				fs.existsSync( path.join( jsOutputDirectory, 'settings.js' ) )
			).toBe( true );
			expect(
				fs.existsSync(
					path.join( jsOutputDirectory, 'settings.min.js' )
				)
			).toBe( true );
			expect(
				fs.existsSync(
					path.join( jsOutputDirectory, 'admin/settings.js' )
				)
			).toBe( false );
		} finally {
			fs.rmSync( jsOutputDirectory, { recursive: true, force: true } );
		}
	} );

	it( 'should run bundled CSS min and unmin configs in parallel', async () => {
		const cssOutputDirectory = path.join(
			fixturesDirectory,
			'build-css-parallel'
		);

		fs.rmSync( cssOutputDirectory, { recursive: true, force: true } );
		fs.mkdirSync( cssOutputDirectory, { recursive: true } );

		const configs = getVanillaConfig( {
			workingDirectory: fixturesDirectory,
			jsPatterns: [],
			cssPatterns: [ 'admin/style.css' ],
			jsBuildDirectory: cssOutputDirectory,
			cssBuildDirectory: cssOutputDirectory,
			isProduction: true,
			strategy: 'bundled',
		} );

		expect( configs ).toHaveLength( 2 );

		try {
			await runWebpackConfigs( configs, { concurrency: 2 } );

			expect(
				fs.existsSync(
					path.join( cssOutputDirectory, 'admin/style.css' )
				)
			).toBe( true );
			expect(
				fs.existsSync(
					path.join( cssOutputDirectory, 'admin/style.min.css' )
				)
			).toBe( true );
		} finally {
			fs.rmSync( cssOutputDirectory, { recursive: true, force: true } );
		}
	} );

	it( 'should not emit extra chunks when entries share a local import', async () => {
		const jsOutputDirectory = path.join(
			fixturesDirectory,
			'build-js-shared'
		);

		fs.rmSync( jsOutputDirectory, { recursive: true, force: true } );
		fs.mkdirSync( jsOutputDirectory, { recursive: true } );

		const configs = getVanillaConfig( {
			workingDirectory: fixturesDirectory,
			jsPatterns: [ 'js/src/entry-a.js', 'js/src/entry-b.js' ],
			cssPatterns: [],
			jsBuildDirectory: jsOutputDirectory,
			cssBuildDirectory: jsOutputDirectory,
			isProduction: true,
			strategy: 'bundled',
			entryKey: 'basename',
		} );

		try {
			await runWebpackConfigs( configs, { concurrency: 2 } );

			const outputFiles = fs.readdirSync( jsOutputDirectory );
			const jsOutputs = outputFiles.filter( ( file ) =>
				file.endsWith( '.js' )
			);

			expect( jsOutputs.sort() ).toEqual(
				[
					'entry-a.js',
					'entry-a.min.js',
					'entry-b.js',
					'entry-b.min.js',
				].sort()
			);
		} finally {
			fs.rmSync( jsOutputDirectory, { recursive: true, force: true } );
		}
	} );
} );
