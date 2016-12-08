var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.Wikibase = ( function( $ ) {
	'use strict';

	var API_ENDPOINT = 'https://www.wikidata.org/w/api.php';
	var LANGUAGE = 'en';

	var SEARCH_ENTITES = {
		action: 'wbsearchentities',
		format: 'json',
		continue: 0,
		language: LANGUAGE,
		uselang: LANGUAGE
	};

	var QUERY_LANGUGES = {
		action: 'query',
		meta: 'siteinfo',
		format: 'json',
		siprop: 'languages'
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
		var query = SEARCH_ENTITES;
		query.search = term;

		if ( type ) {
			query.type = type;
		}
		if ( this._language || language ) {
			query.language = language ? language : this._language;
			query.uselang = language ? language : this._language;
		}

		return this._query( query );
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
	 * @private
	 */
	SELF.prototype._query = function( query ) {
		return $.ajax( {
			url: this._endpoint + '?' + jQuery.param( query ),
			dataType: 'jsonp'
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
