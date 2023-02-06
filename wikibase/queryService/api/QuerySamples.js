var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.QuerySamples = ( function ( $ ) {
	'use strict';

	/**
	 * QuerySamples API for the Europeana query service
	 *
	 * @class wikibase.queryService.api.QuerySamples
	 * @license GNU GPL v2+
	 *
	 * @author Srdjan Stevanetic
	 * @constructor
	 */
	function SELF( language, settings ) {
		this._language = language;
		if ( !settings ) {
			throw new Error( 'Invalid method call: query sample settings are missing!' );
		}
		this._jsonFile = settings.jsonFile;
	}

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._language = null;
	SELF.prototype._jsonFile = null;
	SELF.prototype._examples = null;

	/**
	 * @return {jQuery.Promise} Object taking list of example queries { title:, query: }
	 */
	SELF.prototype.getExamples = function () {
		return $.getJSON( this._jsonFile, function( examples ) {
			// group by category
  			return _.flatten( _.toArray( _.groupBy( examples, 'category' ) ) );
		});
	};

	/**
	 * Get the language for the query samples.
	 *
	 * @return {string} language
	 */
	SELF.prototype.getLanguage = function() {
		return this._language;
	};

	/**
	 * Get the URL of the page where query examples are defined.
	 *
	 * @return {string} URL
	 */
	SELF.prototype.getExamplesPageUrl = function() {
		return null;
	};

	return SELF;

}( jQuery ) );
