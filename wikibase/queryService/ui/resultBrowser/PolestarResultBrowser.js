var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.PolestarResultBrowser = ( function( $, window, _ ) {
	'use strict';

	var POLESTAR = 'polestar/embed.html';
	var GRAPH_QUERY_PREFIX = 'wikidatasparql://query.wikidata.org/?query=';

	/**
	 * A polestar graph maker.
	 *
	 * @class wikibase.queryService.ui.resultBrowser.PolestarResultBrowser
	 * @licence GNU GPL v2+
	 *
	 * @constructor
	 *
	 */
	function SELF() {
	}

	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractResultBrowser();

	/**
	 * Draw to the given element
	 *
	 * @param {jQuery} $element target element
	 */
	SELF.prototype.draw = function( $element ) {
		var polestarData = {
			url: GRAPH_QUERY_PREFIX + window.location.hash.substr( 1 ),
			name: 'Imported from Wikidata Query Service',
			_directEmbed: true
		};
		var $container = $( '<iframe>' ).attr( {
			'src': POLESTAR + '#' + JSON.stringify( polestarData ),
			'class': 'graph-iframe'
		} ).height( '100vh' );

		$element.append( $container );
		$container.scrollIntoView();
	};

	/**
	 * Checks whether the browser can draw the given result
	 *
	 * @return {boolean}
	 **/
	SELF.prototype.isDrawable = function() {
		return this._drawable;
	};

	/**
	 * Receiving data from the visit
	 *
	 * @param {Object} data
	 * @return {boolean} false if there is no revisit needed
	 */
	SELF.prototype.visit = function( data ) {
		this._drawable = true;
		return false;
	};

	return SELF;
}( jQuery, window, _ ) );
