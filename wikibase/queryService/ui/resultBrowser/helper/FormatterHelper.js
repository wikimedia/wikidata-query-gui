var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};
wikibase.queryService.ui.resultBrowser.helper = wikibase.queryService.ui.resultBrowser.helper || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.resultBrowser.helper.FormatterHelper = ( function( $, mw, moment ) {
	'use strict';

	var EXPLORE_URL = 'http://www.wikidata.org/entity/Q';
	var COMMONS_FILE_PATH = 'http://commons.wikimedia.org/wiki/special:filepath/';
	var DATATYPE_DATETIME = 'http://www.w3.org/2001/XMLSchema#dateTime';
	var TYPE_URI = 'uri';
	var DATATYPE_MATHML = 'http://www.w3.org/1998/Math/MathML';

	var NUMBER_TYPES = [
			'http://www.w3.org/2001/XMLSchema#double', 'http://www.w3.org/2001/XMLSchema#float',
			'http://www.w3.org/2001/XMLSchema#decimal', 'http://www.w3.org/2001/XMLSchema#integer',
			'http://www.w3.org/2001/XMLSchema#long', 'http://www.w3.org/2001/XMLSchema#int',
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
	 * Formatting helper provides methods useful for formatting results
	 *
	 * @class wikibase.queryService.ui.resultBrowser.helper.FormatterHelper
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 */
	function SELF() {
	}

	/**
	 * Format a data row
	 *
	 * @param {Object} row
	 * @param {boolean} embed media files
	 * @return {jQuery} element
	 */
	SELF.prototype.formatRow = function( row, embed ) {
		var self = this;

		var $result = $( '<div/>' );

		$.each( row, function( key, value ) {
			$result.prepend( $( '<div>' ).append( self.formatValue( value, key, embed ) ) );
		} );

		return $result;
	};

	/**
	 * Format a data value
	 *
	 * @param {Object} data
	 * @param {string} title (optional)
	 * @param {boolean} embed (optional) media files
	 * @return {jQuery} element
	 */
	SELF.prototype.formatValue = function( data, title, embed ) {
		var value = data.value, $html = $( '<span>' );

		if ( !title ) {
			title = data.dataType || '';
		}

		if ( !data.type ) {
			return $( '<span>' ).text( value ).attr( 'title', title );
		}

		switch ( data.datatype || data.type ) {
		case TYPE_URI:
			var $link = $( '<a>' ).attr( 'href', value ).attr( 'target', '_blank' ).attr( 'title',
					title );
			$html.append( $link );

			if ( this.isCommonsResource( value ) ) {
				if ( embed ) {
					$link.click( this.handleCommonResourceItem );
					$link.append(
							$( '<img>' ).attr( 'src',
									this.getCommonsResourceFileNameThumbnail( value, '120' ) ) )
							.width( '120' );
				} else {
					$link.text( 'commons:' +
							decodeURIComponent( this.getCommonsResourceFileName( value ) ) );
					$html.prepend( this.createGalleryButton( value, title ), ' ' );
				}
			} else {
				$link.text( this.abbreviateUri( value ) );

				if ( this.isExploreUrl( value ) ) {
					$html.prepend( this.createExploreButton( value ), ' ' );
				}
			}
			break;
		case DATATYPE_DATETIME:
			if ( !title ) {
				title = this._i18n( 'wdqs-app-result-formatter-title-datetime', 'Raw ISO timestamp' );
			}
			var $dateLabel = $( '<span>' ).text( this._formatDate( value ) );
			$dateLabel.attr( 'title', title + ': ' + value );
			$html.append( $dateLabel );
			break;

		case DATATYPE_MATHML:
			$html.append( $( data.value ) );
			break;

		default:
			var $label = $( '<span>' ).text( value );
			if ( data['xml:lang'] ) {
				$label.attr( 'title', title + ': ' + value + '@' + data['xml:lang'] );
			} else {
				$label.attr( 'title', title );
			}
			$html.append( $label );
		}

		return $html;
	};

	/**
	 * @param {string} dateTime
	 * @return {string}
	 * @protected
	 */
	SELF.prototype._formatDate = function( dateTime ) {
		var isBce = false,
			positiveDate = dateTime.replace( /^(?:-\d+|\+?0+\b)/, function( year ) {
				isBce = true;
				return Math.abs( year ) + 1;
			} ),
			moment = this.parseDate( positiveDate ),
			formatted;

		if ( moment.isValid() ) {
			formatted = moment.format( 'll' );
		} else {
			var year = positiveDate.replace( /^\+?(\d+).*/, '$1' );
			formatted = '0000'.slice( year.length ) + year;
		}

		if ( isBce ) {
			// TODO: Translate.
			formatted += ' BCE';
		}

		return formatted;
	};

	/**
	 * Parse dateTime string to Date object
	 * Allows negative years without leading zeros http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.15.1
	 *
	 * @param {string} dateTime
	 * @return {Object}
	 */
	SELF.prototype.parseDate = function( dateTime ) {
		// Add leading plus sign if it's missing
		dateTime = dateTime.replace( /^(?![+-])/, '+' );
		// Pad years to 6 digits
		dateTime = dateTime.replace( /^([+-]?)(\d{1,5}\b)/, function( $0, $1, $2 ) {
			return $1 + ( '00000' + $2 ).slice( -6 );
		} );
		// Remove timezone
		dateTime = dateTime.replace( /Z$/, '' );

		return moment( dateTime, moment.ISO_8601 );
	};

	/**
	 * Checks whether given URL is available for explorer
	 *
	 * @param {string} url
	 * @return {boolean}
	 */
	SELF.prototype.isExploreUrl = function( url ) {
		return typeof url === 'string' && url.startsWith( EXPLORE_URL );
	};

	/**
	 * Creates an explore button
	 *
	 * @return {jQuery}
	 */
	SELF.prototype.createExploreButton = function( url ) {
		var $button = $( '<a href="' + url +
				'" title="Explore item" class="explore glyphicon glyphicon-search" aria-hidden="true">' );
		$button.click( $.proxy( this.handleExploreItem, this ) );

		return $button;
	};

	/**
	 * Checks whether given url is commons resource URL
	 *
	 * @param {string} url
	 * @return {boolean}
	 */
	SELF.prototype.isCommonsResource = function( url ) {
		return url.toLowerCase().startsWith( COMMONS_FILE_PATH.toLowerCase() );
	};

	/**
	 * Returns the file name of a commons resource URL
	 *
	 * @param {string} url
	 * @return {string}
	 */
	SELF.prototype.getCommonsResourceFileName = function( url ) {
		var regExp = new RegExp( COMMONS_FILE_PATH, 'ig' );

		return decodeURIComponent( url.replace( regExp, '' ) );
	};

	/**
	 * Creates a thumbnail URL from given commons resource URL
	 *
	 * @param {string} url
	 * @param {number} [width]
	 * @return {String}
	 */
	SELF.prototype.getCommonsResourceFileNameThumbnail = function( url, width ) {
		if ( !this.isCommonsResource( url ) ) {
			return url;
		}

		return url.replace( /^http(?=:\/\/)/, 'https' ) + '?width=' + ( width || 400 );
	};

	/**
	 * Creates a gallery button
	 *
	 * @param {string} url
	 * @param {string} galleryId
	 * @return {jQuery}
	 */
	SELF.prototype.createGalleryButton = function( url, galleryId ) {
		var fileName = this.getCommonsResourceFileName( url ), thumbnail = this
				.getCommonsResourceFileNameThumbnail( url, 900 );

		var $button = $(
				'<a title="Show Gallery" class="gallery glyphicon glyphicon-picture" aria-hidden="true">' )
				.attr( 'href', thumbnail ).attr( 'data-gallery', 'G_' + galleryId ).attr(
						'data-title', decodeURIComponent( fileName ) );

		$button.click( this.handleCommonResourceItem );

		return $button;
	};

	/**
	 * Produce abbreviation of the URI.
	 *
	 * @param {string} uri
	 * @return {string}
	 */
	SELF.prototype.abbreviateUri = function( uri ) {
		var nsGroup, ns, NAMESPACE_SHORTCUTS = wikibase.queryService.RdfNamespaces.NAMESPACE_SHORTCUTS;

		for ( nsGroup in NAMESPACE_SHORTCUTS ) {
			for ( ns in NAMESPACE_SHORTCUTS[nsGroup] ) {
				if ( uri.indexOf( NAMESPACE_SHORTCUTS[nsGroup][ns] ) === 0 ) {
					return uri.replace( NAMESPACE_SHORTCUTS[nsGroup][ns], ns + ':' );
				}
			}
		}
		return '<' + uri + '>';
	};

	/**
	 * Handler for explore links
	 */
	SELF.prototype.handleExploreItem = function( e ) {
		var url = $( e.target ).attr( 'href' );

		e.preventDefault();

		if ( !this.isExploreUrl( url ) ) {
			return false;
		}

		var $explorer = $( '.explorer' );

		$explorer.empty();
		$( '.explorer-panel' ).show();

		mw.config = {
			get: function() {
				return url.replace( EXPLORE_URL, 'Q' );
			}
		};
		EXPLORER( $, mw, $explorer );

		return false;
	};

	/**
	 * Handler for commons resource links
	 */
	SELF.prototype.handleCommonResourceItem = function( e ) {
		e.preventDefault();

		$( this ).ekkoLightbox( {
			'scale_height': true
		} );
	};

	/**
	 * Checks whether the current cell contains a label
	 *
	 * @private
	 * @param {Object} cell
	 * @return {boolean}
	 */
	SELF.prototype.isLabel = function( cell ) {
		if ( !cell || !cell.hasOwnProperty ) {
			return false;
		}

		return cell.hasOwnProperty( 'xml:lang' );
	};

	/**
	 * Checks whether the current cell contains a number
	 *
	 * @private
	 * @param {Object} cell
	 * @return {boolean}
	 */
	SELF.prototype.isNumber = function( cell ) {
		if ( !cell || !cell.datatype ) {
			return false;
		}

		return NUMBER_TYPES.indexOf( cell.datatype ) !== -1;
	};

	/**
	 * Checks whether the current cell is date time
	 *
	 * @private
	 * @param {Object} cell
	 * @return {boolean}
	 */
	SELF.prototype.isDateTime = function( cell ) {
		if ( !cell || !cell.datatype ) {
			return false;
		}

		return cell.datatype === DATATYPE_DATETIME;
	};

	/**
	 * Checks whether the current cell is a WD entity URI
	 *
	 * @private
	 * @param {Object} cell
	 * @return {boolean}
	 */
	SELF.prototype.isEntity = function( cell ) {
		if ( !cell || !cell.value ) {
			return false;
		}

		return this.isExploreUrl( cell.value );
	};

	/**
	 * Checks whether the current cell is a color string according to the P465 format
	 *
	 * @private
	 * @param {Object} cell
	 * @return {boolean}
	 */
	SELF.prototype.isColor = function ( cell ) {
		if ( !cell || !cell.type || !cell.value ) {
			return false;
		}

		return cell.type === 'literal' && cell.value.match( /^[0-9A-F]{6}$/ );
	};

	/*
	 * Returns an HTML color string for the current cell
	 *
	 * @private
	 * @param {Object} cell
	 * @return {String}
	 */
	SELF.prototype.getColorForHtml = function ( cell ) {
		return '#' + cell.value;
	};

	/**
	 * Calculate the luminance of the given sRGB color.
	 *
	 * This uses the reverse sRGB transformation,
	 * as documented on https://en.wikipedia.org/wiki/SRGB#The_reverse_transformation,
	 * to calculate the luminance (Y coordinate in the CIE XYZ model).
	 *
	 * @private
	 * @param {string} color as six hex digits (no #)
	 * @return {number} luminance of the color, or NaN if the color string is invalid
	 */
	SELF.prototype.calculateLuminance = function( color ) {
		var r = parseInt( color.substr( 1, 2 ), 16 ) / 255;
		var g = parseInt( color.substr( 3, 2 ), 16 ) / 255;
		var b = parseInt( color.substr( 5, 2 ), 16 ) / 255;
		if ( isFinite( r ) && isFinite( g ) && isFinite( b ) ) {
			// linearize gamma-corrected sRGB values
			r = r <= 0.04045 ? r / 12.92 : Math.pow( ( r + 0.055 ) / 1.055, 2.4 );
			g = g <= 0.04045 ? g / 12.92 : Math.pow( ( g + 0.055 ) / 1.055, 2.4 );
			b = b <= 0.04045 ? b / 12.92 : Math.pow( ( b + 0.055 ) / 1.055, 2.4 );
			// calculate luminance using Rec. 709 coefficients
			var luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			return luminance;
		} else {
			return NaN;
		}
	};

	/**
	 * Get an i18n string
	 *
	 * @protected
	 * @param {string} key for the i18n message
	 * @param {string} message default text
	 *
	 * @return {string}
	 */
	SELF.prototype._i18n = function( key, message ) {
		var i18nMessage = null;

		if ( !$.i18n || ( i18nMessage = $.i18n( key ) ) === key ) {
			return message;
		}

		return i18nMessage;
	};

	return SELF;
}( jQuery, mediaWiki, moment ) );
