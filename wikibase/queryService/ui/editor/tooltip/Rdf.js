var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.editor = wikibase.queryService.ui.editor || {};
wikibase.queryService.ui.editor.tooltip = wikibase.queryService.ui.editor.tooltip || {};

wikibase.queryService.ui.editor.tooltip.Rdf = ( function ( CodeMirror, $ ) {
	'use strict';

	/**
	 * Wikibase RDF tooltip for codemirror editor
	 *
	 * @license GNU GPL v2+
	 * @class wikibase.queryService.ui.editor.tooltip.Rdf
	 *
	 * @author Jonas Kress
	 * @constructor
	 * @param {wikibase.queryService.api.Wikibase} api
	 */
	function SELF( api ) {
		this._api = api;

		if ( !this._api ){
			this._api = new wikibase.queryService.api.Wikibase();
		}
	}

	SELF.prototype.editor = null;
	SELF.prototype.tooltipTimeoutHandler = null;

	var ENTITY_TYPES = {
		'http://www.wikidata.org/prop/direct/': 'property',
		'http://www.wikidata.org/prop/': 'property',
		'http://www.wikidata.org/prop/novalue/': 'property',
		'http://www.wikidata.org/prop/statement/': 'property',
		'http://www.wikidata.org/prop/statement/value/': 'property',
		'http://www.wikidata.org/prop/qualifier/': 'property',
		'http://www.wikidata.org/prop/qualifier/value/': 'property',
		'http://www.wikidata.org/prop/reference/': 'property',
		'http://www.wikidata.org/prop/reference/value/': 'property',
		'http://www.wikidata.org/wiki/Special:EntityData/': 'item',
		'http://www.wikidata.org/entity/': 'item'
	};

	/**
	 * Set the editor the onmouseover callback is registered to
	 *
	 * @param {wikibase.queryService.ui.editor.Editor} editor
	 */
	SELF.prototype.setEditor = function ( editor ) {
		this.editor = editor;
		this._registerHandler();
	};

	SELF.prototype._registerHandler = function () {
		CodeMirror.on( this.editor.getWrapperElement(), 'mouseover', $.proxy( this._triggerTooltip, this ) );
	};//TODO: Remove CodeMirror dependency

	SELF.prototype._triggerTooltip = function ( e ) {
		clearTimeout( this.tooltipTimeoutHandler );
		this._removeToolTip();

		var self = this;
		this.tooltipTimeoutHandler = setTimeout( function () {
			self._createTooltip( e );
		}, 500 );
	};

	SELF.prototype._createTooltip = function ( e ) {
		var posX = e.clientX,
			posY = e.clientY + $( window ).scrollTop(),
			token = this.editor.getTokenAt( this.editor.coordsChar( { left: posX, top: posY } ) ).string;

		if ( !token.match( /.+\:(Q|P)[0-9]*/ ) ) {
			return;
		}

		var prefixes = this._extractPrefixes( this.editor.doc.getValue() );
		var prefix = token.split( ':' ).shift();
		var entityId = token.split( ':' ).pop();

		if ( !prefixes[prefix] ) {
			return;
		}

		var self = this;
		this._searchEntities( entityId, prefixes[prefix] ).done( function ( list ) {
			self._showToolTip( list.shift(), { x: posX, y: posY } );
		} );
	};

	SELF.prototype._removeToolTip = function () {
		$( '.wikibaseRDFtoolTip' ).remove();
	};

	SELF.prototype._showToolTip = function ( text, pos ) {
		if ( !text || !pos ) {
			return;
		}
		$( '<div/>' )
		.text( text )
		.css( 'position', 'absolute' )
		.css( 'background-color', 'white' )
		.css( 'z-index', '100' )
		.css( 'border', '1px solid grey' )
		.css( 'max-width', '200px' )
		.css( 'padding', '5px' )
		.css( { top: pos.y + 2, left: pos.x + 2 } )
		.addClass( 'wikibaseRDFtoolTip' )
		.appendTo( 'body' )
		.fadeIn( 'slow' );
	};

	SELF.prototype._extractPrefixes = function ( text ) {
		var prefixes = wikibase.queryService.RdfNamespaces.getPrefixMap(ENTITY_TYPES),
			lines = text.split( '\n' ),
			matches;

		$.each( lines, function ( index, line ) {
			// PREFIX wd: <http://www.wikidata.org/entity/>
			if ( ( matches = line.match( /(PREFIX) (\S+): <([^>]+)>/ ) ) ) {
				if ( ENTITY_TYPES[ matches[ 3 ] ] ) {
					prefixes[ matches[ 2 ] ] = ENTITY_TYPES[ matches[ 3 ] ];
				}
			}
		} );

		return prefixes;
	};

	SELF.prototype._searchEntities = function ( term, type ) {
		var entityList = [],
			deferred = $.Deferred();

		this._api.searchEntities( term, type ).done( function ( data ) {

			$.each( data.search, function ( key, value ) {
				entityList.push( value.label + ' (' + value.id + ')\n' +
								( value.description ? value.description: '' ) );
			} );

			deferred.resolve( entityList );
		} );

		return deferred.promise();
	};

	return SELF;

}( CodeMirror, jQuery ) );
