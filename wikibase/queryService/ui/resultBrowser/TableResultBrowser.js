var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.TableResultBrowser = ( function( $, window ) {
	'use strict';

	/**
	 * A result browser for tables
	 *
	 * @class wikibase.queryService.ui.resultBrowser.TableResultBrowser
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @author Jonas Keinholz
	 *
	 * @constructor
	 */
	function SELF() {
	}

	var TABLE_PAGE_SIZE = 200;
	var TABLE_PAGE_SIZE_LIST = [ 10, 50, 100, 200, 500, 1000 ];

	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractResultBrowser();

	/**
	 * @property {Object}
	 * @private
	 **/
	SELF.prototype._columns = null;

	/**
	 * @property {Object}
	 * @private
	 **/
	SELF.prototype._rows = null;

	/**
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._sorter = {
		string: function( val1, val2 ) {
			return val1.localeCompare( val2 );
		},

		number: function( val1, val2 ) {
			if ( val1 >= val2 ) {
				return -1;
			}

			return 1;
		},

		generic: function( data1, data2 ) {
			if ( !data2 ) {
				return 1;
			}
			if ( !data1 ) {
				return -1;
			}

			var f = this._getFormatter();
			if ( f.isNumber( data1 ) && f.isNumber( data2 ) ) {
				return this._sorter.number( Number( data1.value ), Number( data2.value ) );
			}

			if ( f.isExploreUrl( data1.value ) && f.isExploreUrl( data2.value ) ) {
				return this._sorter.number( Number( data1.value.replace( /[^0-9]/gi, '' ) ),
						Number( data2.value.replace( /[^0-9]/gi, '' ) ) );
			}

			// default is string sorter
			return this._sorter.string( data1.value, data2.value );
		}
	};

	/**
	 * Draw browser to the given element
	 *
	 * @param {jQuery} $element to draw at
	 */
	SELF.prototype.draw = function( $element ) {
		var data = this._result;

		if ( typeof data.boolean !== 'undefined' ) {
			// ASK query
			var $table = $( '<table>' ).attr( 'class', 'table' );
			$table.append( '<tr><td>' + data.boolean + '</td></tr>' ).addClass( 'boolean' );
			$element.html( $table );
			return;
		}

		this.columns = data.head.vars;
		this.rows = data.results.bindings;

		var $wrapper = $( '<table/>' );
		$element.html( $wrapper );
		this.drawBootstrapTable( $wrapper );

		if ( $wrapper.children().width() > $( window ).width() ) {
			$wrapper.bootstrapTable( 'toggleView' );
		}
	};

	/**
	 * Draw browser to the given element
	 *
	 * @param {jQuery} $element to draw at
	 */
	SELF.prototype.drawBootstrapTable = function( $element ) {
		var self = this, showPagination = ( this.rows.length > TABLE_PAGE_SIZE );

		jQuery.fn.bootstrapTable.columnDefaults.formatter = function( data, row, index ) {
			if ( !data ) {
				return '';
			}
			self.processVisitors( data, this.field );
			return self._getFormatter().formatValue( data ).html();
		};

		var events = {
			'click .explore': $.proxy( this._getFormatter().handleExploreItem, this ),
			'click .gallery': this._getFormatter().handleCommonResourceItem
		};

		$element.bootstrapTable( {
			columns: this.columns.map( function( column ) {
				return {
					title: column,
					field: column,
					events: events,
					sortable: true,
					sorter: $.proxy( self._sorter.generic, self )
				};
			} ),
			data: this.rows,
			mobileResponsive: true,
			search: showPagination,
			pagination: showPagination,
			showPaginationSwitch: showPagination,
			pageSize: TABLE_PAGE_SIZE,
			pageList: TABLE_PAGE_SIZE_LIST,
			keyEvents: true,
			cookie: true,
			cookieIdTable: '1',
			cookieExpire: '1y',
			cookiesEnabled: [ 'bs.table.pageList' ]
		} );
	};

	/**
	 * Checks whether the browser can draw the given result
	 *
	 * @return {boolean}
	 **/
	SELF.prototype.isDrawable = function() {
		return true;
	};

	/**
	 * Receiving data from the a visit
	 *
	 * @param {Object} data
	 * @return {boolean} false if there is no revisit needed
	 */
	SELF.prototype.visit = function( data ) {
		return false;
	};

	return SELF;
}( jQuery, window ) );
