var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.Wikibase = ( function( $ ) {
	'use strict';
	
	var API_ENDPOINT = 'https://www.wikidata.org/w/api.php';
	var LANGUAGE = 'en';

	var SEARCH_ENTITES = {
		action: 'wbsearchentities',
		format: 'json',
		limit: 50,
		continue: 0,
		language: LANGUAGE,
		uselang: LANGUAGE
	},
	QUERY_LANGUGES = {
		action: 'query',
		meta: 'siteinfo',
		format: 'json',
		siprop: 'languages'
	},
	QUERY_LABELS = {
		action: 'wbgetentities',
		props: 'labels',
		format: 'json',
		languages: LANGUAGE,
		languagefallback: '1'
	},
	QUERY_DATATYPE = {
		action: 'wbgetentities',
		props: 'datatype',
		format: 'json'
	};

	/**
	 * API for the Wikibase Europeana API
	 *
	 * @class wikibase.queryService.api.Wikibase
	 * @license GNU GPL v2+
	 *
	 * @author Srdjan Stevanetic
	 * @constructor
	 * @param {string} endpoint default: ''
	 */
	function SELF( endpoint, defaultLanguage, sparqlUri, wikibaseConfig ) {
		this._endpoint = API_ENDPOINT;

		if ( endpoint ) {
			this._endpoint = endpoint;
		}

		if ( defaultLanguage ) {
			this._language = defaultLanguage;
		}
		
		if ( !sparqlUri ) {
			throw new Error( 'Invalid method call wikibase.queryService.api.Wikibase: sparqlUri parameter is missing!' );
		}
		this._sparqlUri = sparqlUri;
		if(!this._sparqlUri.includes("wikidata.org") && !this._sparqlUri.includes("europeana.eu")) {
			throw new Error( 'Invalid sparqlUri parameter in the method wikibase.queryService.api.Wikibase!' )
		}

		if(this._sparqlUri.includes("europeana.eu")) {
			if ( !wikibaseConfig ) {
				throw new Error( 'Invalid method call wikibase.queryService.api.Wikibase: wikibaseConfig parameter is missing!' );
			}	
			this._querySamplesTagLabelsJsonEuropeana = wikibaseConfig.querySamplesTagLabelsJsonEuropeana;
			this._tooltipsEdmJsonEuropeana = wikibaseConfig.tooltipsEdmJsonEuropeana;
		}

	}

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._endpoint = null;

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._language = null;

	/**
	 * Search an entity with using wbsearchentities
	 *
	 * @param {string} term search string
	 * @param {string} type entity type to search for
	 * @param {string} language of search string default:en
	 *
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.searchEntities = function( term, type, language ) {
		if( this._sparqlUri.includes("wikidata.org") ) {
			var query = SEARCH_ENTITES;
			query.search = term;
	
			if ( type ) {
				query.type = type;
			}
			if ( this._language || language ) {
				query.language = language || this._language;
				query.uselang = language || this._language;
			} else {
				query.language = LANGUAGE;
				query.uselang = LANGUAGE;
			}
	
			return this._query( query );
		}
		else if( this._sparqlUri.includes("europeana.eu") ) {
			var deferred = $.Deferred();
			$.getJSON( this._tooltipsEdmJsonEuropeana, function( allTooltips ) {
					var tooltip=[];
					$.each(allTooltips , function(index, item) { 
						if(item.id.localeCompare(term)==0) {
							tooltip.push(item);
							return false;	
						}
					});
					return deferred.resolve({"search":tooltip});			
			});
			return deferred.promise();
		}			
	};

	/**
	 * List of supported languages
	 *
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.getLanguages = function() {
		return this._query( QUERY_LANGUGES );
	};

	/**
	 * Get labels for given entities
	 *
	 * @param {string|string[]} ids entity IDs
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.getLabels = function( ids ) {
		if(this._sparqlUri.includes("wikidata.org")) {
			if ( typeof ids === 'string' ) {
				ids = [ ids ];
			}
	
			var query = QUERY_LABELS;
			query.ids = ids.join( '|' );
	
			if ( this._language  ) {
				query.languages = this._language;
			}
	
			return this._query( query );
		}
		if(this._sparqlUri.includes("europeana.eu")) {
			return $.getJSON( this._querySamplesTagLabelsJsonEuropeana )
				.fail( function( jqXHR, textStatus, errorThrown ) {
					console.error( 'Failed loading the query samples tags labels json: ' + textStatus + ", " + errorThrown );
					throw errorThrown;
				} );			
		}
	};

	/**
	 * Get datatype of property
	 *
	 * @param {string} id property ID
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.getDataType = function( id ) {
		var query = QUERY_DATATYPE,
			deferred = $.Deferred();

		query.ids = id;

		this._query( query ).done( function( data ) {
			if ( data.entities && data.entities[id] && data.entities[id].datatype ) {
				deferred.resolve( data.entities[id].datatype );
			}
			deferred.reject();

		} ).fail( deferred.reject );

		return deferred.promise();
	};

	/**
	 * @private
	 */
	SELF.prototype._query = function( query ) {
		return $.ajax( {
			url: this._endpoint + '?origin=*&' + jQuery.param( query )
		} );
	};

	/**
	 * Set the default language
	 *
	 * @param {string} language of search string default:en
	 */
	SELF.prototype.setLanguage = function( language ) {
		this._language = language;
	};

	return SELF;

}( jQuery ) );
