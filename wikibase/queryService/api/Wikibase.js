var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.Wikibase = ( function ( $ ) {
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
		QUERY_ENTITIES_DATA = {
			action: 'wbgetentities',
			props: 'labels|descriptions',
			format: 'json',
			languages: LANGUAGE,
			languagefallback: '1'
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
	 * API for the Wikibase API
	 *
	 * @class wikibase.queryService.api.Wikibase
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 * @param {string} endpoint default: 'https://www.wikidata.org/w/api.php'
	 */
	function SELF( endpoint, defaultLanguage ) {
		this._endpoint = API_ENDPOINT;

		if ( endpoint ) {
			this._endpoint = endpoint;
		}

		if ( defaultLanguage ) {
			this._language = defaultLanguage;
		}

		this._entitiesDataCache = wikibase.queryService.api.EntityInLanguageCache();
	}

	/**
	 * @property {wikibase.queryService.api.EntityInLanguageCache}
	 * @private
	 */
	SELF.prototype._entitiesDataCache = null;

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
	SELF.prototype.searchEntities = function ( term, type, language ) {
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
	};

	/**
	 * Get some data of entities with using wbgetentities
	 *
	 * @param {string[]} ids ids to search for
	 * @param {string} language of search string default:en
	 *
	 * @return {jQuery.Promise<Map>} Map with id as key and the api response as value
	 */
	SELF.prototype.getEntitiesData = function ( ids, language ) {
		var self = this;
		var lang = language || this._language;
		var uncachedIds = ids.filter( function ( id ) {
			return !self._entitiesDataCache.hasKeyInLanguage( id, lang );
		} );
		var deferred = $.Deferred();

		if ( uncachedIds.length !== 0 ) {
			var query = QUERY_ENTITIES_DATA;
			query.ids = uncachedIds.join( '|' );
			query.languages = lang;

			this._query( query ).then(
				function ( data ) {
					if ( data.entities ) {
						Object.keys( data.entities ).forEach( function ( id ) {
							self._entitiesDataCache.setKeyInLanguage( id, lang, data.entities[id] );
						} );
						deferred.resolve( self._entitiesDataCache.getDataForKeysInLanguage( ids, lang ) );
					} else {
						deferred.reject();
					}
				}
			).catch( deferred.reject );
			return deferred.promise();
		}

		return deferred.resolve( this._entitiesDataCache.getDataForKeysInLanguage( ids, lang ) );
	};

	/**
	 * List of supported languages
	 *
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.getLanguages = function () {
		return this._query( QUERY_LANGUGES );
	};

	/**
	 * Get labels for given entities
	 *
	 * @param {string|string[]} ids entity IDs
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.getLabels = function ( ids ) {

		if ( typeof ids === 'string' ) {
			ids = [ ids ];
		}

		var query = QUERY_LABELS;
		query.ids = ids.join( '|' );

		if ( this._language ) {
			query.languages = this._language;
		}

		return this._query( query );
	};

	/**
	 * Get datatype of property
	 *
	 * @param {string} id property ID
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.getDataType = function ( id ) {
		var query = QUERY_DATATYPE,
			deferred = $.Deferred();

		query.ids = id;

		this._query( query ).done( function ( data ) {
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
	SELF.prototype._query = function ( query ) {
		return $.ajax( {
			url: this._endpoint + '?origin=*&' + jQuery.param( query )
		} );
	};

	/**
	 * Set the default language
	 *
	 * @param {string} language of search string default:en
	 */
	SELF.prototype.setLanguage = function ( language ) {
		this._language = language;
	};

	return SELF;

}( jQuery ) );
