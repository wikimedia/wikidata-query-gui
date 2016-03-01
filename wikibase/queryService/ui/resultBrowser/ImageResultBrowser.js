var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.resultBrowser.ImageResultBrowser = ( function( $ ) {
	"use strict";

	var COMMONS_FILE_PATH = "http://commons.wikimedia.org/wiki/Special:FilePath/";
	var COMMONS_SPECIAL_RESIZE = "http://commons.wikimedia.org/wiki/Special:FilePath/";

	/**
	 * A result browser for images
	 *
	 * @class wikibase.queryService.ui.resultBrowser.ImageResultBrowser
	 * @licence GNU GPL v2+
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


		$.each( this._result.results.bindings, function(){
			$.each( this, function( key, field ){
				if( self._isCommonsRessource( field.value ) ){
					var url = field.value,
						regEx = new RegExp( COMMONS_FILE_PATH, "ig" ),
						fileName = decodeURIComponent( url.replace( regEx, '' ) );

					self._grid.append( self._getItem( self._getThumbnail( url ),  self._getThumbnail( url, 1000 ), fileName ) );
				}
			} );
		} );

		$( $element ).html( this._grid );
	};

	/**
	 * Checks whether the browser can draw the given result
	 * @return {boolean}
	 **/
	SELF.prototype.isDrawable = function() {

		var result = this._result.results.bindings[0] || {},
		isDrawable = false;

		$.each( result, function( key, field ){

			if( field.value.startsWith( COMMONS_FILE_PATH ) ){
				isDrawable = true;
				return false;
			}
		} );

		return isDrawable;
	};

	/**
	 * @private
	 **/
	SELF.prototype._getItem = function( thumbnailUrl, url, title ) {

		var triggerGallery = function(event) {
			event.preventDefault();
			$(this).ekkoLightbox( { 'scale_height' : true } );
			return false;
		},
			heading = $( '<div>' ).text( title ),
			image = $( '<a href="' + url +'" data-gallery="g">' )
			.click( triggerGallery )
			.attr( 'data-title',  title )
			.append( $( '<img src="' + thumbnailUrl +'"></div>' ) );

		return $( '<div class="item">' ).append( heading, image );

	};

	/**
	 * @private
	 **/
	SELF.prototype._isCommonsRessource = function( url ) {
		return url.toLowerCase().startsWith( COMMONS_FILE_PATH.toLowerCase() );

	};

	/**
	 * @private
	 **/
	SELF.prototype._getThumbnail = function( url, width ) {
		if( !this._isCommonsRessource(url) ){
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

	return SELF;
}( jQuery ) );
