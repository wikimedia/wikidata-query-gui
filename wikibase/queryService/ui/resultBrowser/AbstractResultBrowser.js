var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.AbstractResultBrowser = ( function( $, wikibase ) {
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
		this._visitors = [];
	}

	/**
	 * @property {wikibase.queryService.ui.resultBrowser.helper.FormatterHelper}
	 * @private
	 */
	SELF.prototype._formatter = null;


	/**
	 * @property {object}
	 * @private
	 **/
	SELF.prototype._result = null;

	/**
	 * @property {function}
	 * List of visitor callbacks
	 */
	SELF.prototype._visitors = null;

	/**
	 * @property {boolean}
	 * @protected
	 * Is the browser drawable?
	 * Not drawable by default.
	 */
	SELF.prototype._drawable = false;

	/**
	 * Sets the result to be browsed
	 * @param {Object} result set
	 **/
	SELF.prototype.setResult = function( result ) {
		this._result = result;
	};

	/**
	 * Iterate the result set and calls the visitors
	 * @protected
	 * @param {resultCallback} cb - called for every column of the resultset
	 **/
	SELF.prototype._iterateResult = function( cb ) {
		var self = this;

		$.each( this._result.results.bindings, function( rowNum, row ){
			$.each( self._result.head.vars, function( rowNum1, key ){
				var field = null;
				if( row[key] ){
					field = row[key];
				}
				self.processVisitors( field );

				cb( field, key, row );
			} );
		} );
	};

	/**
	 * Callback used by _iterateResult
	 * @callback resultCallback
	 * @param {object} field
	 * @param {string} key of the field
	 * @param {object} row
	 */

	/**
	 * Checks whether the result browser can draw the given result
	 * @return {boolean}
	 **/
	SELF.prototype.isDrawable = function() {
		return this._drawable;
	};

	/**
	 * Draws the result browser to the given element
	 * @param {jQuery} $element to draw at
	 **/
	SELF.prototype.draw = function( $element ) {
		jQuery.error( 'Method draw() needs to be implemented!' );
	};

	/**
	 * Add visitor function.
	 * @param {function} callback
	 */
	SELF.prototype.addVisitor = function( callback ) {
		this._visitors.push( callback );
	};

	/**
	 * Call all visitors for the piece of data
	 * @protected
	 * @param data
	 */
	SELF.prototype.processVisitors = function( data ) {
		var self = this,
		removeVisitors = [];


		$.each( this._visitors, function ( key, v ) {
			if( v.visit && typeof v.visit === 'function' ){
				if( v.visit( data ) === false ){
					removeVisitors.push( key );
				}
			}
		} );

		$.each( removeVisitors, function( key, visitorIndex ){
			self._visitors.splice( removeVisitors, 1 );
		} );
	};

	/**
	 * Receiving data from the a visit
	 * @param data
	 * @return {boolean} false if there is no revisit needed
	 */
	SELF.prototype.visit = function( data ) {
	};

	/**
	 * Set a formatter in order to replace the default formatter
	 * @param formatter {wikibase.queryService.ui.resultBrowser.helper.FormatterHelper}
	 */
	SELF.prototype.setFormatter = function( formatter ) {
		this._formatter = formatter;
	};


	/**
	 * Get the formatter
	 * @protected
	 * @return {wikibase.queryService.ui.resultBrowser.helper.FormatterHelper}
	 */
	SELF.prototype._getFormatter = function() {
		if( this._formatter === null ){
			this._formatter = new wikibase.queryService.ui.resultBrowser.helper.FormatterHelper();
		}

		return this._formatter;
	};


	return SELF;
}( jQuery, wikibase ) );
