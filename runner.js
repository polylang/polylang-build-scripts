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
 *                                                  Rejects on the first compilation failure (fail-fast); successful runs return
 *                                                  stats in the same order as `configs`.
 *
 * @return {Promise<import('webpack').Stats[]>} Stats for each config, in order.
 */
const runWebpackConfigs = async (
	configs,
	{ concurrency = Infinity } = {}
) => {
	if ( ! Array.isArray( configs ) ) {
		throw new TypeError(
			'runWebpackConfigs expects an array of webpack configurations.'
		);
	}

	if ( configs.length === 0 ) {
		return [];
	}

	const isValidConcurrency =
		typeof concurrency === 'number' &&
		( concurrency === Infinity ||
			( Number.isFinite( concurrency ) && concurrency >= 1 ) );

	if ( ! isValidConcurrency ) {
		throw new TypeError(
			'runWebpackConfigs concurrency must be Infinity or a finite number greater than or equal to 1.'
		);
	}

	const results = new Array( configs.length );
	let nextIndex = 0;
	let failed = false;

	const worker = async () => {
		while ( ! failed && nextIndex < configs.length ) {
			const currentIndex = nextIndex;
			nextIndex += 1;

			try {
				results[ currentIndex ] = await runSingleWebpack(
					configs[ currentIndex ]
				);
			} catch ( error ) {
				failed = true;
				throw error;
			}
		}
	};

	const workerCount = Math.min( concurrency, configs.length );

	await Promise.all( Array.from( { length: workerCount }, () => worker() ) );

	return results;
};

module.exports = { runWebpackConfigs };
