var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.Sparql = ( function( $ ) {
	'use strict';

	var SPARQL_SERVICE_URI = 'https://query.wikidata.org/bigdata/namespace/wdq/sparql';

	var ERROR_CODES = {
			TIMEOUT: 10,
			MALFORMED: 20,
			SERVER: 30,
			UNKNOWN: 100
	};

	var ERROR_MAP = {
		'QueryTimeoutException: Query deadline is expired': ERROR_CODES.TIMEOUT,
		'MalformedQueryException: ': ERROR_CODES.MALFORMED
	};

	/**
	 * SPARQL API for the Wikibase query service
	 *
	 * @class wikibase.queryService.api.Sparql
	 * @license GNU GPL v2+
	 *
	 * @author Stanislav Malyshev
	 * @author Jonas Kress
	 * @constructor
	 *
	 * @param {string} [serviceUri] Optional URI to the SPARQL service endpoint
	 */
	function SELF( serviceUri ) {
		this._serviceUri = serviceUri || SPARQL_SERVICE_URI;
	}

	/**
	 * @property {Object}
	 */
	SELF.prototype.ERROR_CODES = ERROR_CODES;

	/**
	 * @property {Number}
	 * @private
	 */
	SELF.prototype._serviceUri = null;

	/**
	 * @property {Number}
	 * @private
	 */
	SELF.prototype._executionTime = null;

	/**
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._error = null;

	/**
	 * @property {Number}
	 * @private
	 */
	SELF.prototype._resultLength = null;

	/**
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._rawData = null;

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._queryUri = null;

	/**
	 * Submit a query to the API
	 *
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.queryDataUpdatedTime = function() {
		// Cache the update time only for a minute
		var deferred = $.Deferred(), query = encodeURI( 'prefix schema: <http://schema.org/> ' +
				'SELECT * WHERE {<http://www.wikidata.org> schema:dateModified ?y}' ), url = this._serviceUri +
				'?query=' + query + '&nocache=' + Math.floor( Date.now() / 60000 ), settings = {
			headers: {
				Accept: 'application/sparql-results+json'
			}
		};

		$.ajax( url, settings )
			.done(
					function( data, textStatus, jqXHR ) {
						if ( !data.results.bindings[0] ) {
							deferred.reject();
							return;
						}
						var updateDate = new Date(
								data.results.bindings[0][data.head.vars[0]].value ), dateText = updateDate
								.toLocaleTimeString( navigator.language, {
									timeZoneName: 'short'
								} ) +
								', ' + updateDate.toLocaleDateString( navigator.language, {
									month: 'short',
									day: 'numeric',
									year: 'numeric'
								} );
							var differenceInSeconds = Math
									.round( ( new Date() - updateDate ) / 1000 );

						deferred.resolve( dateText, differenceInSeconds );
					} ).fail( function() {
				deferred.reject();
			} );

		return deferred;
	};

	/**
	 * Submit a query to the API
	 *
	 * @param {string[]} query
	 * @return {jQuery.Promise} query
	 */
	SELF.prototype.query = function( query ) {
		var self = this, deferred = $.Deferred(), settings = {
			headers: {
				Accept: 'application/sparql-results+json'
			}
		};

		this._queryUri = this._serviceUri + '?query=' + encodeURIComponent( query );

		this._executionTime = Date.now();
		$.ajax( this._queryUri, settings ).done( function( data, textStatus, request ) {
			self._executionTime = Date.now() - self._executionTime;

			if ( typeof data.boolean === 'boolean' ) {
				self._resultLength = 1;
			} else {
				self._resultLength = data.results.bindings.length || 0;
			}
			self._rawData = data;

			deferred.resolve();
		} ).fail( function( request, options, exception ) {
			self._executionTime = null;
			self._rawData = null;
			self._resultLength = null;
			self._generateErrorMessage( request, options, exception );

			deferred.reject();
		} );

		return deferred;
	};

	/**
	 * Get execution time in ms of the submitted query
	 */
	SELF.prototype._generateErrorMessage = function( request, options, exception ) {
		var error = {
			code: ERROR_CODES.UNKNOWN,
			message: null,
			debug: request.responseText
		};

		if ( request.status === 0 || exception ) {
			error.code = ERROR_CODES.SERVER;
			error.message = exception.message;
		}

		try {//extract error from server response
			var errorToMatch = error.debug.substring( error.debug
					.indexOf( 'java.util.concurrent.ExecutionException:' ) );

			for ( var errorKey in ERROR_MAP ) {
				if ( errorToMatch.indexOf( errorKey ) !== -1 ) {
					error.code = ERROR_MAP[ errorKey ];
					error.message = null;
				}
			}

			if ( error.code === ERROR_CODES.UNKNOWN || error.code === ERROR_CODES.MALFORMED ) {
				error.message = error.debug
						.match(
								/(java\.util\.concurrent\.ExecutionException\:)+(.*)(Exception\:)+(.*)/ )
						.pop().trim();
			}

		} catch ( e ) {
		}

		this._error = error;
	};

	/**
	 * Get execution time in seconds of the submitted query
	 *
	 * @return {Number}
	 */
	SELF.prototype.getExecutionTime = function() {
		return this._executionTime;
	};

	/**
	 * Get error of the submitted query if it has failed
	 *
	 * @return {object}
	 */
	SELF.prototype.getError = function() {
		return this._error;
	};

	/**
	 * Get result length of the submitted query if it has failed
	 *
	 * @return {Number}
	 */
	SELF.prototype.getResultLength = function() {
		return this._resultLength;
	};

	/**
	 * Get query URI
	 *
	 * @return {string}
	 */
	SELF.prototype.getQueryUri = function() {
		return this._queryUri;
	};

	/**
	 * Process SPARQL query result.
	 *
	 * @param {Object} data
	 * @param {Function} rowHandler
	 * @param {*} context
	 * @private
	 * @return {*} The provided context, modified by the rowHandler.
	 */
	SELF.prototype._processData = function( data, rowHandler, context ) {
		var results = data.results.bindings.length;
		for ( var i = 0; i < results; i++ ) {
			var rowBindings = {};
			for ( var j = 0; j < data.head.vars.length; j++ ) {
				if ( data.head.vars[j] in data.results.bindings[i] ) {
					rowBindings[data.head.vars[j]] = data.results.bindings[i][data.head.vars[j]];
				} else {
					rowBindings[data.head.vars[j]] = undefined;
				}
			}
			context = rowHandler( rowBindings, context );
		}
		return context;
	};

	/**
	 * Encode string as CSV.
	 *
	 * @param {string} string
	 * @return {string}
	 */
	SELF.prototype._encodeCsv = function( string ) {
		var result = string.replace( /"/g, '""' );
		if ( /[",\n]/.test( result ) ) {
			result = '"' + result + '"';
		}
		return result;
	};

	/**
	 * Get the raw result
	 *
	 * @return {Object} result
	 */
	SELF.prototype.getResultRawData = function() {
		return this._rawData;
	};

	/**
	 * Get the result of the submitted query as CSV
	 *
	 * @return {string} csv
	 */
	SELF.prototype.getResultAsCsv = function() {
		var self = this,
			data = self._rawData,
			output = data.head.vars.map( this._encodeCsv ).join( ',' ) + '\n';

		output = this._processData( data, function( row, out ) {
			var rowOut = '';
			var first = true;
			var rowCSV;
			for ( var rowVar in row ) {
				if ( row[rowVar] === undefined ) {
					rowCSV = '';
				} else {
					rowCSV = self._encodeCsv( row[rowVar].value );
				}
				if ( !first ) {
					rowOut += ',';
				} else {
					first = false;
				}
				rowOut += rowCSV;
			}
			rowOut += '\n';
			return out + rowOut;
		}, output );
		return output;
	};

	/**
	 * Get the result of the submitted query as JSON
	 *
	 * @return {string}
	 */
	SELF.prototype.getResultAsJson = function() {
		var output = [],
			data = this._rawData;

		output = this._processData( data, function( row, out ) {
			var extractRow = {};
			for ( var rowVar in row ) {
				extractRow[rowVar] = ( row[rowVar] || {} ).value;
			}
			out.push( extractRow );
			return out;
		}, output );
		return JSON.stringify( output );
	};

	/**
	 * Get the result of the submitted query as raw JSON
	 *
	 * @return {string}
	 */
	SELF.prototype.getResultAsAllJson = function() {
		return JSON.stringify( this._rawData );
	};

	/**
	 * Render value as per http://www.w3.org/TR/sparql11-results-csv-tsv/#tsv
	 *
	 * @param {Object} binding
	 * @return {string}
	 */
	SELF.prototype._renderValueTSV = function( binding ) {
		var value = binding.value.replace( /\t/g, '' );
		switch ( binding.type ) {
		case 'uri':
			return '<' + value + '>';
		case 'bnode':
			return '_:' + value;
		case 'literal':
			var lvalue = JSON.stringify( value );
			if ( binding['xml:lang'] ) {
				return lvalue + '@' + binding['xml:lang'];
			}
			if ( binding.datatype ) {
				if ( binding.datatype === 'http://www.w3.org/2001/XMLSchema#integer' ||
						binding.datatype === 'http://www.w3.org/2001/XMLSchema#decimal' ||
						binding.datatype === 'http://www.w3.org/2001/XMLSchema#double' ) {
					return value;
				}
				return lvalue + '^^<' + binding.datatype + '>';
			}
			return lvalue;
		}
		return value;
	};

	/**
	 * Get the result of the submitted query as SPARQL TSV
	 *
	 * @return {string}
	 */
	SELF.prototype.getSparqlTsv = function() {
		var self = this,
			data = this._rawData,
			output = data.head.vars.map( function( vname ) {
			return '?' + vname;
		} ).join( '\t' ) + '\n';

		output = this._processData( data, function( row, out ) {
			var rowOut = '';
			var first = true;
			var rowTSV;
			for ( var rowVar in row ) {
				if ( row[rowVar] === undefined ) {
					rowTSV = '';
				} else {
					rowTSV = self._renderValueTSV( row[rowVar] );
				}
				if ( !first ) {
					rowOut += '\t';
				} else {
					first = false;
				}
				rowOut += rowTSV;
			}
			rowOut += '\n';
			return out + rowOut;
		}, output );
		return output;
	};

	/**
	 * Get the result of the submitted query as simplified TSV
	 *
	 * @return {string}
	 */
	SELF.prototype.getSimpleTsv = function() {
		var data = this._rawData,
			output = data.head.vars.join( '\t' ) + '\n';

		output = this._processData( data, function( row, out ) {
			var rowOut = '';
			var first = true;
			var rowTSV;
			for ( var rowVar in row ) {
				if ( row[rowVar] === undefined ) {
					rowTSV = '';
				} else {
					rowTSV = row[rowVar].value.replace( /\t/g, '' );
				}
				if ( !first ) {
					rowOut += '\t';
				} else {
					first = false;
				}
				rowOut += rowTSV;
			}
			rowOut += '\n';
			return out + rowOut;
		}, output );
		return output;
	};

	return SELF;

}( jQuery ) );
