/**
 * Peer dependencies.
 */
const webpack = require( 'webpack' );

/**
 * Run a single webpack compilation.
 *
 * @param {Object} config Webpack configuration.
 * @return {Promise<import('webpack').Stats>} Compilation stats.
 */
const runSingleWebpack = ( config ) =>
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

/**
 * Run webpack compilations with optional concurrency limiting.
 *
 * Use this instead of webpack-cli MultiCompiler when many configs would run in
 * parallel and exhaust memory (e.g. legacy per-file vanilla builds).
 *
 * @param {Object[]} configs                        Webpack configurations to run.
 * @param {Object}   [options]                      Runner options.
 * @param {number}   [options.concurrency=Infinity] Max parallel compilations.
 * @return {Promise<import('webpack').Stats[]>} Stats for each config, in order.
 */
const runWebpackConfigs = async (
	configs,
	{ concurrency = Infinity } = {}
) => {
	if ( ! Array.isArray( configs ) || configs.length === 0 ) {
		return [];
	}

	const results = new Array( configs.length );
	let nextIndex = 0;

	const worker = async () => {
		while ( nextIndex < configs.length ) {
			const currentIndex = nextIndex;
			nextIndex += 1;
			results[ currentIndex ] = await runSingleWebpack(
				configs[ currentIndex ]
			);
		}
	};

	const workerCount = Math.min( Math.max( 1, concurrency ), configs.length );

	await Promise.all( Array.from( { length: workerCount }, () => worker() ) );

	return results;
};

module.exports = { runWebpackConfigs };
