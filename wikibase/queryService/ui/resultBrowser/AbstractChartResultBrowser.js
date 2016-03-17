var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.resultBrowser.AbstractChartResultBrowser = ( function ( $, window ) {
	"use strict";

	var NUMBER_TYPES = [
	            		'http://www.w3.org/2001/XMLSchema#double',
	            		'http://www.w3.org/2001/XMLSchema#float',
	            		'http://www.w3.org/2001/XMLSchema#decimal',
	            		'http://www.w3.org/2001/XMLSchema#integer',
	            		'http://www.w3.org/2001/XMLSchema#long',
	            		'http://www.w3.org/2001/XMLSchema#int',
	            		'http://www.w3.org/2001/XMLSchema#short',
	            		'http://www.w3.org/2001/XMLSchema#nonNegativeInteger',
	            		'http://www.w3.org/2001/XMLSchema#positiveInteger',
	            		'http://www.w3.org/2001/XMLSchema#unsignedLong',
	            		'http://www.w3.org/2001/XMLSchema#unsignedInt',
	            		'http://www.w3.org/2001/XMLSchema#unsignedShort',
	            		'http://www.w3.org/2001/XMLSchema#nonPositiveInteger',
	            		'http://www.w3.org/2001/XMLSchema#negativeInteger'
	            	];

	/**
	 * An abstract result browser for charts
	 *
	 * @class wikibase.queryService.ui.resultBrowser.TreeResultBrowser
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 *
	 * @constructor
	 */
	function SELF() {
	}

	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractResultBrowser();

	/**
	 * Returns all columns that contain numbers
	 * @private
	 * @return {String[]}
	 **/
	SELF.prototype._getLabelColumns = function () {
		var self = this;
		var row = self._getRows()[ 0 ];

		return self._getColumns().filter( function ( column ) {
			return self._isLabel( row[ column ] );
		} );
	};

	/**
	 * Returns all columns that contain numbers
	 * @private
	 * @return {Number[]}
	 **/
	SELF.prototype._getNumberColumns = function () {
		var self = this;
		var row = self._getRows()[ 0 ];

		return self._getColumns().filter( function ( column ) {
			return self._isNumber( row[ column ] );
		} );
	};


	/**
	 * @private
	 * @return {String[]}
	 **/
	SELF.prototype._getColumns = function () {
		return this._result.head.vars;
	};

	/**
	 * @private
	 * @return {Object[]}
	 **/
	SELF.prototype._getRows = function () {
		return this._result.results.bindings;
	};


	/**
	 * Checks whether the current cell contains a label
	 * @private
	 * @param {Object} cell
	 * @return {boolean}
	 **/
	SELF.prototype._isLabel = function ( cell ) {
		if( !cell || !cell.hasOwnProperty ){
			return false;
		}

		return cell.hasOwnProperty( 'xml:lang' );
	};

	/**
	 * Checks whether the current cell contains a number
	 * @private
	 * @param {Object} cell
	 * @return {boolean}
	 **/
	SELF.prototype._isNumber = function ( cell ) {
		return NUMBER_TYPES.indexOf( cell.datatype ) !== -1;
	};

	return SELF;
}( jQuery, window ) );
