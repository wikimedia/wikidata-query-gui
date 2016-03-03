var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.resultBrowser.TableResultBrowser = ( function ( $, mw ) {
	"use strict";

	var EXPLORE_URL = 'http://www.wikidata.org/entity/Q';
	var COMMONS_FILE_PATH = "http://commons.wikimedia.org/wiki/special:filepath/";
	var COMMONS_SPECIAL_RESIZE = "http://commons.wikimedia.org/wiki/Special:FilePath/";

	/**
	 * Represents a Bootstrap Table
	 *
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Keinholz
	 * @constructor
	 */
	function BootstrapTable( columns, rows ) {
		this.columns = columns;
		this.rows = rows;
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

				if ( this.isExploreUrl( href ) ) {
					$td.append( ' ' );
					$td.append( this.createExploreButton() );
				}

				if ( this.isCommonsResource( href ) ) {
					$td.append( ' ' );
					$td.append( this.createGalleryButton( href, column ) );
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
			if ( this.isCommonsResource( label ) ) {
				label = decodeURIComponent( this.getCommonsResourceFileName( label ) );
			} else {
				label = this.abbreviateUri( label );
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

	/**
	 * @private
	 * @param {string} url
	 * @returns {boolean}
	 */
	BootstrapTable.prototype.isExploreUrl = function ( url ) {
		return url.match( EXPLORE_URL + '(.+)' );
	};

	/**
	 * @private
	 * @returns {jQuery}
	 */
	BootstrapTable.prototype.createExploreButton = function () {
		return $( '<a href="#" title="Explore item" class="explore glyphicon glyphicon-search" aria-hidden="true">' );
	};

	/**
	 * @private
	 * @param {string} url
	 * @returns {boolean}
	 */
	BootstrapTable.prototype.isCommonsResource = function ( url ) {
		return url.toLowerCase().startsWith( COMMONS_FILE_PATH.toLowerCase() );
	};

	/**
	 * @private
	 * @param {string} url
	 * @returns {string}
	 */
	BootstrapTable.prototype.getCommonsResourceFileName = function ( url ) {
		var regExp = new RegExp( COMMONS_FILE_PATH, 'ig' );

		return url.replace( regExp, '' );
	};

	/**
	 * @private
	 * @param {string} url
	 * @param {string} column
	 * @returns {jQuery}
	 */
	BootstrapTable.prototype.createGalleryButton = function ( url, column ) {
		var fileName = this.getCommonsResourceFileName( url ),
			thumbnail = COMMONS_SPECIAL_RESIZE + fileName + '?width=900';

		return $( '<a title="Show Gallery" class="gallery glyphicon glyphicon-picture" aria-hidden="true">' )
			.attr( 'href', thumbnail )
			.attr( 'data-gallery', 'G_' + column )
			.attr( 'data-title', decodeURIComponent( fileName ) );
	};

	/**
	 * Produce abbreviation of the URI.
	 *
	 * @private
	 * @param {string} uri
	 * @returns {string}
	 */
	BootstrapTable.prototype.abbreviateUri = function ( uri ) {
		var nsGroup, ns, NAMESPACE_SHORTCUTS = wikibase.queryService.RdfNamespaces.NAMESPACE_SHORTCUTS;

		for ( nsGroup in NAMESPACE_SHORTCUTS ) {
			for ( ns in NAMESPACE_SHORTCUTS[ nsGroup ] ) {
				if ( uri.indexOf( NAMESPACE_SHORTCUTS[ nsGroup ][ ns ] ) === 0 ) {
					return uri.replace( NAMESPACE_SHORTCUTS[ nsGroup ][ ns ], ns + ':' );
				}
			}
		}
		return '<' + uri + '>';
	};

	BootstrapTable.prototype.initializeBootstrapTable = function () {
		var events = {
			'click .explore': $.proxy( this.handleExploreItem, this ),
			'click .gallery': this.handleCommonResourceItem
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
	 * @private
	 */
	BootstrapTable.prototype.handleExploreItem = function ( e ) {
		var id, url = $( e.target ).prev().attr( 'href' ) || '', match;

		match = url.match( EXPLORE_URL + '(.+)' );
		if ( !match ) {
			return;
		}

		var $explorer = $( '.explorer' );

		$explorer.empty();
		$( '.explorer-panel' ).show();

		id = match[ 1 ];
		mw.config = {
			get: function () {
				return 'Q' + id;
			}
		};
		EXPLORER( $, mw, $explorer );

		return false;
	};

	BootstrapTable.prototype.handleCommonResourceItem = function ( e ) {
		e.preventDefault();
		$( this ).ekkoLightbox( { 'scale_height': true } );
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

		var bootstrapTable = new BootstrapTable( data.head.vars, data.results.bindings );
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
}( jQuery, mediaWiki ) );
