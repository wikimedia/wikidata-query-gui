var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.ImageResultBrowser = ( function( $ ) {
	"use strict";

	var COMMONS_FILE_PATH = "http://commons.wikimedia.org/wiki/Special:FilePath/";
	var COMMONS_SPECIAL_RESIZE = "http://commons.wikimedia.org/wiki/Special:FilePath/";

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


		$.each( this._result.results.bindings, function( rowNum, row ){
			$.each( this, function( key, field ){
				if( self._isCommonsResource( field.value ) ){
					var url = field.value,
						regEx = new RegExp( COMMONS_FILE_PATH, "ig" ),
						fileName = decodeURIComponent( url.replace( regEx, '' ) );

					self._grid.append( self._getItem( self._getThumbnail( url ),
							self._getThumbnail( url, 1000 ),
							fileName,
							row ) );
				}
			} );
		} );

		$element.html( this._grid );
	};

	/**
	 * @private
	 **/
	SELF.prototype._getItem = function( thumbnailUrl, url, title, row ) {
		var $image = $( '<a href="' + url +'" data-gallery="g">' )
			.click( this._contentHelper.handleCommonResourceItem )
			.attr( 'data-title',  title )
			.append( $( '<img src="' + thumbnailUrl +'"></div>' ) ),
			$summary = this._contentHelper.formatRow( row );

		return $( '<div class="item">' ).append( $image, $summary );
	};

	/**
	 * @private
	 **/
	SELF.prototype._isCommonsResource = function( url ) {
		return url.toLowerCase().startsWith( COMMONS_FILE_PATH.toLowerCase() );

	};

	/**
	 * @private
	 **/
	SELF.prototype._getThumbnail = function( url, width ) {
		if( !this._isCommonsResource(url) ){
			return url;
		}
		if( !width ){
			width = 400;
		}

		var regEx = new RegExp( COMMONS_FILE_PATH, "ig" ),
		fileName = url.replace( regEx, '' ),
		thumbnail = COMMONS_SPECIAL_RESIZE + fileName + '?width=' + width;

		return thumbnail;
	};

	/**
	 * Receiving data from the a visit
	 * @param data
	 */
	SELF.prototype.visit = function( data ) {
		this._checkImage( data );
	};


	/**
	 * Check if this value contains an image.
	 */
	SELF.prototype._checkImage = function ( data ) {
		if( data && data.value && data.value.startsWith( COMMONS_FILE_PATH ) ){
			this._drawable = true;
		}
	};

	return SELF;
}( jQuery ) );
