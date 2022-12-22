var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};

wikibase.queryService.ui.Banner = ( function ( $, download, window ) {
	'use strict';
	var DISMISSED = 'dismissed';
	/**
	 * A banner for WDQS User Research Survey 2021
	 *
	 * @class wikibase.queryService.ui.Banner
	 * @license GNU GPL v2+
	 *
	 * @author Adam Hammad
	 * @constructor
	 *
	 * @param {string} key A unique key to track if the banner has been dismissed
	 * @param {Function} renderBanner A function that takes the banner element to render
	 * @param {Function} onDismiss Callback function when banner is dismissed
	 * @param {Boolean} withHelpMessage Show the help message with the hint
	 * @param {string} content Content of the banner (HTML)
	 */
	function SELF( key, renderBanner, onDismiss, withHelpMessage, content ) {
		this._storageKey = this.trackingNamespace + key;
		this._renderBanner = renderBanner;
		this._onDismiss = onDismiss;
		this._content = content;
		this._init( withHelpMessage );
	}

	/**
	 * @property {jQuery}
	 * @private
	 */
	SELF.prototype._$element = null;

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._storageKey = null;

	/**
	 * @property {Function}
	 * @private
	 */
	SELF.prototype._onDismiss = null;

	/**
	 * @property {string}
	 */
	SELF.prototype.trackingNamespace = 'wikibase.queryService.ui.';

	/**
	 * Initialize private members and call delegate to specific init methods
	 *
	 * @private
	 */
	SELF.prototype._init = function ( withHelpMessage ) {
		var isDismissed = localStorage.getItem( this._storageKey ) === DISMISSED;

		if ( isDismissed ) {
			return;
		}

		var closeButton = $( '<button>' )
			.attr( {
				class: 'close',
				type: 'button',
				'aria-label': 'Dismiss'
			} ).html( '<span aria-hidden="true">×</span>' ).on( 'click', ( function () {
				this.dismiss();
			} ).bind( this ) );

		var bannerContent = $( '<div>' ).attr( 'class', 'banner__text' );
		var message = $( '<span>' ).html( this._content );
		bannerContent.prepend( message );

		bannerContent.prepend( '<span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>' );
		var banner = $( '<div>' ).attr( 'class', 'banner' ).attr( 'data-key', this._key );
		banner.append( bannerContent );
		banner.append( closeButton );

		this._$element = banner;
		this._renderBanner( this._$element );
	};

	/**
	 * Dismiss the banner
	 */
	SELF.prototype.dismiss = function () {
		this._$element.hide();
		localStorage.setItem( this._storageKey, DISMISSED );

		if ( this._onDismiss ) {
			this._onDismiss();
		}
	};

	return SELF;

}( jQuery, download, window ) );
