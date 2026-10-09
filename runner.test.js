/**
 * External dependencies
 */
const webpack = require( 'webpack' );

/**
 * Internal dependencies
 */
const { runWebpackConfigs } = require( './runner' );

jest.mock( 'webpack', () => {
	const mockWebpack = jest.fn();
	return mockWebpack;
} );

describe( 'runWebpackConfigs', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return an empty array for empty input', async () => {
		await expect( runWebpackConfigs( [] ) ).resolves.toEqual( [] );
		expect( webpack ).not.toHaveBeenCalled();
	} );

	it( 'should run all configs and return stats in order', async () => {
		const statsA = { hasErrors: () => false };
		const statsB = { hasErrors: () => false };
		let callIndex = 0;

		webpack.mockImplementation( ( config, callback ) => {
			const stats = callIndex === 0 ? statsA : statsB;
			callIndex += 1;
			callback( null, stats );
		} );

		const configs = [ { entry: './a.js' }, { entry: './b.js' } ];
		const results = await runWebpackConfigs( configs );

		expect( webpack ).toHaveBeenCalledTimes( 2 );
		expect( results ).toEqual( [ statsA, statsB ] );
	} );

	it( 'should reject when a compilation reports errors', async () => {
		webpack.mockImplementation( ( config, callback ) => {
			callback( null, {
				hasErrors: () => true,
				toString: () => 'compilation failed',
			} );
		} );

		await expect(
			runWebpackConfigs( [ { entry: './a.js' } ] )
		).rejects.toThrow( 'compilation failed' );
	} );

	it( 'should limit parallel compilations when concurrency is set', async () => {
		let inFlight = 0;
		let maxInFlight = 0;

		webpack.mockImplementation( ( config, callback ) => {
			inFlight += 1;
			maxInFlight = Math.max( maxInFlight, inFlight );

			setTimeout( () => {
				inFlight -= 1;
				callback( null, { hasErrors: () => false } );
			}, 10 );
		} );

		const configs = Array.from( { length: 4 }, ( _, index ) => ( {
			entry: `./file-${ index }.js`,
		} ) );

		await runWebpackConfigs( configs, { concurrency: 2 } );

		expect( maxInFlight ).toBeLessThanOrEqual( 2 );
		expect( webpack ).toHaveBeenCalledTimes( 4 );
	} );
} );
