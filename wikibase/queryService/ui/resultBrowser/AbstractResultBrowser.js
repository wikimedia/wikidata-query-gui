var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.AbstractResultBrowser = ( function( $ ) {
	"use strict";

	/**
	 * Abstract result browser
	 *
	 * @class wikibase.queryService.ui.resultBrowser.AbstractResultBrowser
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 */
	function SELF() {

		this._contentHelper = new wikibase.queryService.ui.resultBrowser.helper.ContentHelper();
	}

	/**
	 * @property {wikibase.queryService.ui.resultBrowser.helper.ContentHelper}
	 * @private
	 **/
	SELF.prototype._formattingHelper = null;

	/**
	 * @property {object}
	 * @private
	 **/
	SELF.prototype._result = null;

	/**
	 * Sets the result to be browsed
	 * @param {Object} result set
	 **/
	SELF.prototype.setResult = function( result ) {
		this._result = result;
	};

	/**
	 * Checks whether the result browser can draw the given result
	 * @return {boolean}
	 **/
	SELF.prototype.isDrawable = function() {
		jQuery.error( 'Method isDrawable() needs to be implemented!' );
	};

	/**
	 * Draws the result browser to the given element
	 * @param {jQuery} $element to draw at
	 **/
	SELF.prototype.draw = function( $element ) {
		jQuery.error( 'Method draw() needs to be implemented!' );
	};

	return SELF;
}( jQuery ) );
