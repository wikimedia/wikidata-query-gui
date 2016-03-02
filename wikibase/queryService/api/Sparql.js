var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.Sparql = ( function($) {
	'use strict';

	var SPARQL_SERVICE_URI = '//query.wikidata.org/bigdata/namespace/wdq/sparql';

	/**
	 * SPARQL API for the Wikibase query service
	 *
	 * @class wikibase.queryService.api.Sparql
	 * @licence GNU GPL v2+
	 *
	 * @author Stanislav Malyshev
	 * @author Jonas Kress
	 * @constructor
	 *
	 * @param {string} (optional) serviceUri URI to the SPARQL service endpoint
	 */
	function SELF( serviceUri ) {

		if( serviceUri ){
			this._serviceUri = serviceUri;
		}else{
			this._serviceUri = SPARQL_SERVICE_URI;
		}
	}

	/**
	 * @property {int}
	 * @private
	 **/
	SELF.prototype._serviceUri = null;

	/**
	 * @property {int}
	 * @private
	 **/
	SELF.prototype._executionTime = null;

	/**
	 * @property {string}
	 * @private
	 **/
	SELF.prototype._errorMessage = null;

	/**
	 * @property {int}
	 * @private
	 **/
	SELF.prototype._resultLength = null;

	/**
	 * @property {Object}
	 * @private
	 **/
	SELF.prototype._rawData = null;

	/**
	 * @property {string}
	 * @private
	 **/
	SELF.prototype._queryUri = null;

	/**
	 * Submit a query to the API
	 *
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.queryDataUpdatedTime = function() {

		var deferred = $.Deferred(),
		query = encodeURI( 'prefix schema: <http://schema.org/> ' +
				'SELECT * WHERE {<http://www.wikidata.org> schema:dateModified ?y}' ),
		url = this._serviceUri + '?query=' + query, settings = {
			'headers' : {
				'Accept' : 'application/sparql-results+json'
			}
		};

		$.ajax( url, settings ).done(function( data, textStatus, jqXHR ){
			if(!data.results.bindings[ 0 ]) {
				deferred.reject();
				return;
			}
			var updateDate = new Date( data.results.bindings[ 0 ][ data.head.vars[ 0 ] ].value ),
			dateText = updateDate.toLocaleTimeString(
				navigator.language,
				{ timeZoneName: 'short' }
			) + ', ' + updateDate.toLocaleDateString(
				navigator.language,
				{ month: 'short', day: 'numeric', year: 'numeric' }
			);

			deferred.resolve( dateText );
		}).fail(function(){
			deferred.reject();
		});

		return deferred;
	};

	/**
	 * Submit a query to the API
	 *
	 * @param {string[]}
	 *            query
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.query = function(query) {
		var deferred = $.Deferred(), self = this, settings = {
			'headers' : {
				'Accept' : 'application/sparql-results+json'
			}
		};

		this._queryUri = this._serviceUri + '?query=' + encodeURIComponent( query );

		this._executionTime = Date.now();
		$.ajax( this._queryUri, settings ).done(function( data, textStatus, jqXHR ) {
			self._executionTime = Date.now() - self._executionTime;

			if ( typeof  data.boolean === 'boolean' ) {
					self._resultLength = 1;
				} else {
					self._resultLength = data.results.bindings.length || 0;
				}
			self._rawData = data;

			deferred.resolve();
		}).fail(function( jqXHR ) {
			self._executionTime = null;
			self._rawData = null;
			self._resultLength = null;
			self._generateErrorMessage(jqXHR);

			deferred.reject();
		});

		return deferred;
	};

	/**
	 * Get execution time in ms of the submitted query
	 *
	 * @return {int}
	 */
	SELF.prototype._generateErrorMessage = function( jqXHR ) {
		var message = 'ERROR: ';

		if ( jqXHR.status === 0 ) {
			message += 'Could not contact server';
		} else {
			message += jqXHR.responseText;
			if ( jqXHR.responseText.match( /Query deadline is expired/ ) ) {
				message = 'QUERY TIMEOUT\n' + message;
			}
		}
		this._errorMessage = message;
	};

	/**
	 * Get execution time in seconds of the submitted query
	 *
	 * @return {int}
	 */
	SELF.prototype.getExecutionTime = function() {
		return this._executionTime;
	};

	/**
	 * Get error message of the submitted query if it has failed
	 *
	 * @return {int}
	 */
	SELF.prototype.getErrorMessage = function() {
		return this._errorMessage;
	};

	/**
	 * Get result length of the submitted query if it has failed
	 *
	 * @return {int}
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
		if ( result.search( /("|,|\n)/g ) >= 0 ) {
			result = '"' + result + '"';
		}
		return result;
	};

	/**
	 * Get the raw result
	 *
	 * @return {object} result
	 */
	SELF.prototype.getResultRawData= function() {
		return this._rawData;
	};

	/**
	 * Get the result of the submitted query as CSV
	 *
	 * @return {string} csv
	 */
	SELF.prototype.getResultAsCsv = function() {
		var self = this, data = self._rawData;
		var out = data.head.vars.map( this._encodeCsv ).join( ',' ) + '\n';
		out = this._processData( data, function ( row, out ) {
			var rowOut = '';
			for ( var rowVar in row ) {
				var rowCSV = self._encodeCsv( row[rowVar].value );
				if ( rowOut.length > 0 ) {
					rowOut += ',';
				}
				rowOut += rowCSV;
			}
			if ( rowOut.length > 0 ) {
				rowOut += '\n';
			}
			return out + rowOut;
		}, out );
		return out;
	};

	/**
	 * Get the result of the submitted query as JSON
	 *
	 * @return {string}
	 */
	SELF.prototype.getResultAsJson = function() {
		var out = [], data = this._rawData;
		out = this._processData( data, function ( row, out ) {
			var extractRow = {};
			for ( var rowVar in row ) {
				extractRow[rowVar] = row[rowVar].value;
			}
			out.push( extractRow );
			return out;
		}, out );
		return JSON.stringify( out );
	};

	/**
	 * Get the result of the submitted query as JSON
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
						binding.datatype === 'http://www.w3.org/2001/XMLSchema#double'
					) {
						return value;
					}
					return lvalue + '^^<' + binding.datatype + '>';
				}
				return lvalue;
		}
		return value;
	};

	/**
	 * Get the result of the submitted query as TSV
	 *
	 * @return {string}
	 */
	SELF.prototype.getSparqlTsv = function() {
		var data = this._rawData, self = this,
			out = data.head.vars.map( function ( vname ) {
			return '?' + vname;
		} ).join( '\t' ) + '\n';
		out = this._processData( data, function ( row, out ) {
			var rowOut = '';
			for ( var rowVar in row ) {
				var rowTSV = self._renderValueTSV( row[rowVar] );
				if ( rowOut.length > 0 ) {
					rowOut += '\t';
				}
				rowOut += rowTSV;
			}
			if ( rowOut.length > 0 ) {
				rowOut += '\n';
			}
			return out + rowOut;
		}, out );
		return out;
	};

	/**
	 * Get the result of the submitted query as TSV
	 *
	 * @return {string}
	 */
	SELF.prototype.getSimpleTsv = function() {
		var data = this._rawData,
			out = data.head.vars.join( '\t' ) + '\n';
		out = this._processData( data, function ( row, out ) {
			var rowOut = '';
			for ( var rowVar in row ) {
				var rowTSV = row[rowVar].value.replace( /\t/g, '' );
				if ( rowOut.length > 0 ) {
					rowOut += '\t';
				}
				rowOut += rowTSV;
			}
			if ( rowOut.length > 0 ) {
				rowOut += '\n';
			}
			return out + rowOut;
		}, out );
		return out;
	};

	return SELF;

}(jQuery));
