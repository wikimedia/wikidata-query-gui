var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.resultBrowser.TableResultBrowser = ( function ( $ ) {
	"use strict";

	/**
	 * Represents a Bootstrap Table
	 *
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Keinholz
	 * @constructor
	 */
	function BootstrapTable( columns, rows, contentHelper ) {
		this.columns = columns;
		this.rows = rows;

		this.contentHelper = contentHelper;
	}

	/**
	 * @param {jQuery} $wrapper
	 */
	BootstrapTable.prototype.createTable = function ( $wrapper ) {
		this.$table = $( '<table>' ).attr( 'class', 'table' );

		$wrapper.html( this.$table );

		this.createTableHeader().appendTo( this.$table );
		this.createTableBody().appendTo( this.$table );
		this.initializeBootstrapTable();
	};

	/**
	 * @private
	 * @returns {jQuery}
	 */
	BootstrapTable.prototype.createTableHeader = function () {
		var $thead = $( '<thead>' );
		var $tr = $( '<tr>' );

		this.columns.forEach( function ( column ) {
			$( '<th>' ).text( column ).appendTo( $tr );
		} );

		$thead.append( $tr );

		return $thead;
	};

	/**
	 * @private
	 * @returns {jQuery}
	 */
	BootstrapTable.prototype.createTableBody = function () {
		var $tbody = $( '<tbody>' );
		var self = this;

		self.rows.forEach( function ( row ) {
			var $tr = $( '<tr>' ).appendTo( $tbody );

			self.columns.forEach( function ( column ) {
				self.createTableCell( row, column ).appendTo( $tr );
			} );
		} );

		return $tbody;
	};

	/**
	 * @private
	 * @param {Object} row
	 * @param {string} column
	 * @returns {jQuery}
	 */
	BootstrapTable.prototype.createTableCell = function ( row, column ) {
		if ( !( column in row ) ) {
			return $( '<td>' ).attr( 'class', 'unbound' );
		}

		var $td = $( '<td>' );
		var data = row[ column ];

		var $linkText = this.createLabel( data );
		$td.attr( this.getAttributes( data ) );

		switch ( data.type ) {
			case 'uri':
				var href = data.value;

				$( '<a>' ).attr( 'href', href ).append( $linkText ).appendTo( $td );

				if ( this.contentHelper.isExploreUrl( href ) ) {
					$td.prepend( ' ' );
					$td.prepend( this.contentHelper.createExploreButton( href ) );
				}

				if ( this.contentHelper.isCommonsResource( href ) ) {
					$td.prepend( ' ' );
					$td.prepend( this.contentHelper.createGalleryButton( href, column ) );
				}

				break;
			default:
				$td.append( $linkText );
		}

		return $td;
	};

	/**
	 * @private
	 * @param {Object} data
	 * @returns {jQuery}
	 * */
	BootstrapTable.prototype.createLabel = function ( data ) {
		var label = data.value;

		if ( data.type === 'uri' ) {
			if ( this.contentHelper.isCommonsResource( label ) ) {
				label = 'commons:' + decodeURIComponent( this.contentHelper.getCommonsResourceFileName( label ) );
			} else {
				label = this.contentHelper.abbreviateUri( label );
			}
		}

		return $( '<span>' ).text( label.trim() );
	};

	/**
	 * @private
	 * @param {Object} data
	 * @returns {Object}
	 */
	BootstrapTable.prototype.getAttributes = function ( data ) {
		if ( data.type === 'typed-literal' ) {
			return {
				'class': 'literal',
				'data-datatype': data.datatype
			};
		}

		var attr = {
			'class': data.type
		};

		if ( data[ 'xml:lang' ] ) {
			attr[ 'data-lang' ] = data[ 'xml:lang' ];
			attr.title = data.value + '@' + data[ 'xml:lang' ];
		}

		return attr;
	};

	BootstrapTable.prototype.initializeBootstrapTable = function () {
		var events = {
			'click .explore': $.proxy( this.contentHelper.handleExploreItem, this ),
			'click .gallery': this.contentHelper.handleCommonResourceItem
		};

		this.$table.bootstrapTable( {
			columns: this.columns.map( function ( column ) {
				return {
					title: column,
					field: column,
					events: events,
					sortable: true
				};
			} ),
			mobileResponsive: true
		} );
	};

	/**
	 * A result browser for tables
	 *
	 * @class wikibase.queryService.ui.resultBrowser.TableResultBrowser
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 */
	function SELF() {
	}

	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractResultBrowser();

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

		var bootstrapTable = new BootstrapTable( data.head.vars, data.results.bindings, this._contentHelper );
		bootstrapTable.createTable( $element );
	};

	/**
	 * Checks whether the browser can draw the given result
	 * @return {boolean}
	 **/
	SELF.prototype.isDrawable = function () {
		return true;
	};

	return SELF;
}( jQuery ) );
