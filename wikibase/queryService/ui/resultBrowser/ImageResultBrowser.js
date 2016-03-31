var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.ImageResultBrowser = ( function( $ ) {
	"use strict";

	/**
	 * A result browser for images
	 *
	 * @class wikibase.queryService.ui.resultBrowser.ImageResultBrowser
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 */
	function SELF() {
	}

	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractResultBrowser();

	/**
	 * @property {jQuery}
	 * @private
	 **/
	SELF.prototype._grid = null;

	/**
	 * Draw browser to the given element
	 * @param {jQuery} $element to draw at
	 **/
	SELF.prototype.draw = function( $element ) {
		var self = this;
		this._grid = $( '<div class="masonry">' );

		this._iterateResult( function( field, key, row ) {

			if( field && self._isCommonsResource( field.value ) ){
				var url = field.value,
					fileName = self._getFormatter().getCommonsResourceFileName( url );

				self._grid.append( self._getItem( self._getThumbnail( url ),
						self._getThumbnail( url, 1000 ),
						fileName,
						row ) );
			}

		} );

		$element.html( this._grid );
	};

	/**
	 * @private
	 **/
	SELF.prototype._getItem = function( thumbnailUrl, url, title, row ) {
		var $image = $( '<a data-gallery="g">' )
			.click( this._getFormatter().handleCommonResourceItem )
			.attr( 'data-title',  title )
			.attr( 'href', url )
			.append(
				$( '<img>' )
				.attr( 'src', thumbnailUrl )
			),
			$summary = this._getFormatter().formatRow( row );

		return $( '<div class="item">' ).append( $image, $summary );
	};

	/**
	 * @private
	 **/
	SELF.prototype._isCommonsResource = function( url ) {
		return this._getFormatter().isCommonsResource( url );
	};

	/**
	 * @private
	 **/
	SELF.prototype._getThumbnail = function( url, width ) {
		return this._getFormatter().getCommonsResourceFileNameThumbnail( url, width );
	};

	/**
	 * Receiving data from the a visit
	 * @param data
	 * @return {boolean} false if there is no revisit needed
	 */
	SELF.prototype.visit = function( data ) {
		return this._checkImage( data );
	};


	/**
	 * Check if this value contains an image.
	 */
	SELF.prototype._checkImage = function ( data ) {
		if( data && data.value && this._isCommonsResource( data.value ) ){
			this._drawable = true;
			return false;
		}

		return true;
	};

	return SELF;
}( jQuery ) );
