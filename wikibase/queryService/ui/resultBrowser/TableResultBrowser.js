var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.resultBrowser.TableResultBrowser = ( function ( $ ) {
	"use strict";

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
	var TABLE_PAGE_SIZE_LIST = [10, 50, 100, 200, 500, 1000];


	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractResultBrowser();

	/**
	 * @property {object}
	 * @private
	 **/
	SELF.prototype._columns = null;

	/**
	 * @property {object}
	 * @private
	 **/
	SELF.prototype._rows = null;


	/**
	 * Draw browser to the given element
	 * @param {jQuery} $element to draw at
	 **/
	SELF.prototype.draw = function ( $element ) {
		var data = this._result;

		if ( typeof data.boolean !== 'undefined' ) {
			// ASK query
			var $table = $( '<table>' ).attr( 'class', 'table' );
			$table.append( '<tr><td>' + data.boolean + '</td></tr>' ).addClass( 'boolean' );
			$element.html( $table );
			return;
		}


		this.columns =  data.head.vars;
		this.rows = data.results.bindings;

		var $wrapper = $( '<table/>' ).attr( 'class', 'table' );
		$element.html( $wrapper );
		this.drawBootstrapTable( $wrapper );
	};

	/**
	 * Draw browser to the given element
	 * @param {jQuery} $element to draw at
	 **/
	SELF.prototype.drawBootstrapTable = function ( $element ) {
		var self = this,
			showPagination = (this.rows.length > TABLE_PAGE_SIZE);

		jQuery.fn.bootstrapTable.columnDefaults.formatter = function( data ){
			if( !data ){
				return '';
			}
			self.processVisitors( data );
			return self._getFormatter().formatValue( data ).html();
		};

		var stringSorter = function( data1, data2 ){
			return data1.value.localeCompare( data2.value );
		};

		var events = {
				'click .explore': $.proxy( this._getFormatter().handleExploreItem, this ),
				'click .gallery': this._getFormatter().handleCommonResourceItem
		};

		$element.bootstrapTable( {
			columns: this.columns.map( function ( column ) {
				return {
					title: column,
					field: column,
					events: events,
					sortable: true,
					sorter: stringSorter
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
			cookiesEnabled: ['bs.table.pageList']
		} );

	};

	/**
	 * Checks whether the browser can draw the given result
	 * @return {boolean}
	 **/
	SELF.prototype.isDrawable = function () {
		return true;
	};

	/**
	 * Receiving data from the a visit
	 * @param data
	 * @return {boolean} false if there is no revisit needed
	 */
	SELF.prototype.visit = function( data ) {
		return false;
	};

	return SELF;
}( jQuery ) );
