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
			contiunue: 0,
			language: LANGUAGE,
			uselang: LANGUAGE
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

		if( endpoint ){
			this._endpoint = endpoint;
		}
	}

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._endpoint= null;

	/**
	 * Search an entity with using wbsearchentities
	 *
	 * @param {string} term search string
	 * @param {string} type entity type to search for
	 * @param {string} language of search string default:en
	 *
	 * @return {jQuery.Deferred}
	 */
	SELF.prototype.searchEntities = function( term, type, language ) {
		var query = SEARCH_ENTITES;
		query.search = term;

		if( type ){
			query.type = type;
		}

		if( language ){
			query.type = type;
		}

		return $.ajax( {
			url: this._endpoint + '?' + jQuery.param( query ),
			dataType: 'jsonp'
		} );
	};

	return SELF;

}( jQuery ) );
