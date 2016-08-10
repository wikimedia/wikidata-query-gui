var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.resultBrowser.BubbleChartResultBrowser = ( function( $, d3, window ) {
	'use strict';

	/**
	 * A bubble chart result browser
	 *
	 * @class wikibase.queryService.ui.resultBrowser.BubbleChartResultBrowser
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 *
	 * @constructor
	 */
	function SELF() {
	}

	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractChartResultBrowser();

	/**
	 * @property {boolean}
	 * @private
	 **/
	SELF.prototype._hasLabel = false;

	/**
	 * @property {boolean}
	 * @private
	 **/
	SELF.prototype._hasNumber = false;

	/**
	 * Draw browser to the given element
	 * @param {jQuery} $element to draw at
	 **/
	SELF.prototype.draw = function( $element ) {
		var self = this;
		var data = {
			'name': 'bubblechart',
			'children': []
		}, labelKey = this._getLabelColumns()[0], numberKey = this._getNumberColumns()[0], prevRow = null, url = null;

		this._iterateResult( function( field, key, row ) {

			if ( field && field.value && self._getFormatter().isExploreUrl( field.value ) ) {
				url = field.value;
			}

			if ( row !== prevRow ) {
				var item = {
					url: url
				};
				url = null;
				prevRow = row;

				if ( row.rgb && row.rgb.value.match( /^[0-9A-F]{6}$/ ) ) {
					item.color = '#' + row.rgb.value;
				}

				if ( row[labelKey] && row[numberKey] ) {
					item.name = row[labelKey].value;
					item.size = row[numberKey].value;
					data.children.push( item );
				}
			}
		} );

		var $wrapper = $( '<center>' );
		$element.html( $wrapper );

		this._drawBubbleChart( $wrapper, data );
	};

	SELF.prototype._drawBubbleChart = function( $element, root ) {

		function classes( root ) {
			var classes = [];
			function recurse( name, node ) {
				if ( node.children ) {
					node.children.forEach( function( child ) {
						recurse( node.name, child );
					} );
				} else {
					classes.push( {
						packageName: name,
						className: node.name,
						value: node.size,
						url: node.url,
						color: node.color
					} );
				}
			}
			recurse( null, root );
			return {
				children: classes
			};
		}

		var diameter = Math.min( $( window ).height(), $( window ).width() ), format = d3
				.format( ',d' ), color = d3.scale.category20c();

		var bubble = d3.layout.pack().sort( null ).size( [
				diameter, diameter
		] ).padding( 1.5 );

		var svg = d3.select( $element[0] ).append( 'svg' ).attr( 'width', diameter ).attr(
				'height', diameter ).attr( 'class', 'bubble' );

		var node = svg.selectAll( '.node' ).data(
				bubble.nodes( classes( root ) ).filter( function( d ) {
					return !d.children;
				} ) ).enter().append( 'g' ).attr( 'class', 'node' ).attr( 'transform',
				function( d ) {
					return 'translate(' + d.x + ',' + d.y + ')';
				} );

		node.append( 'title' ).text( function( d ) {
			return d.className + ': ' + format( d.value );
		} );

		node.append( 'circle' ).attr( 'r', function( d ) {
			return d.r;
		} ).style( 'fill', function( d ) {
			return d.color || color( d.className );
		} );

		node.append( 'text' ).attr( 'dy', '.3em' ).style( 'text-anchor', 'middle' ).text(
				function( d ) {
					return d.className.substring( 0, d.r / 4 );
				} ).on( 'click', function( d ) {
			if ( d.url ) {
				window.open( d.url, '_blank' );
			}
		} ).style( 'fill', function( d ) {
			if ( d.color ) {
				return SELF.prototype._calculateLuma( d.color ) <= 0.5 ? '#FFF' : '#000';
			}
		} ).style( 'cursor', 'pointer' );
	};

	/**
	 * Checks whether the browser can draw the given result
	 *
	 * @return {boolean}
	 */
	SELF.prototype.isDrawable = function() {

		if ( this._hasLabel && this._hasNumber ) {
			return true;
		}

		return false;
	};

	/**
	 * Receiving data from the a visit
	 *
	 * @param {Object} data
	 * @return {boolean} false if there is no revisit needed
	 */
	SELF.prototype.visit = function( data ) {
		return this._checkColumn( data );
	};

	/**
	 * Check if this value contains an coordinate value.
	 */
	SELF.prototype._checkColumn = function( value ) {
		if ( this._getFormatter().isNumber( value ) ) {
			this._hasNumber = true;
		}

		if ( this._getFormatter().isLabel( value ) ) {
			this._hasLabel = true;
		}

		if ( this._hasLabel && this._hasNumber ) {
			return false;
		}

		return true;
	};

	/**
	 * Calculate the luma of the given sRGB color.
	 *
     * @private
	 * @param {string} color as six hex digits (no #)
	 * @return {number} luma of the color, or NaN if the color string is invalid
	 */
	SELF.prototype._calculateLuma = function( color ) {
		var r = parseInt( color.substr( 1, 2 ), 16 ) / 255;
		var g = parseInt( color.substr( 3, 2 ), 16 ) / 255;
		var b = parseInt( color.substr( 5, 2 ), 16 ) / 255;
		if ( isFinite( r ) && isFinite( g ) && isFinite( b ) ) {
			// linearize gamma-corrected sRGB values
			r = r <= 0.04045 ? r / 12.92 : Math.pow( ( r + 0.055 ) / 1.055, 2.4 );
			g = g <= 0.04045 ? g / 12.92 : Math.pow( ( g + 0.055 ) / 1.055, 2.4 );
			b = b <= 0.04045 ? b / 12.92 : Math.pow( ( b + 0.055 ) / 1.055, 2.4 );
			// calculate luma using Rec. 709 coefficients
			var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			return luma;
		} else {
			return NaN;
		}
	};

	return SELF;
}( jQuery, d3, window ) );
