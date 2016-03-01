var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.resultBrowser.TableResultBrowser = ( function( $ ) {
	"use strict";

	/**
	 * A result browser for tables
	 *
	 * @class wikibase.queryService.ui.resultBrowser.TableResultBrowser
	 * @licence GNU GPL v2+
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
	SELF.prototype.draw = function( $element ) {
		var data = this._result, thead, tr, td, binding, i,
			table = $( '<table>' ).attr( 'class', 'table' );

		if ( typeof data.boolean !== 'undefined' ) {
			// ASK query
			table.append( '<tr><td>' + data.boolean + '</td></tr>' ).addClass( 'boolean' );
			return;
		}

		thead = $( '<thead>' ).appendTo( table );
		tr = $( '<tr>' );
		for ( i = 0; i < data.head.vars.length; i++ ) {
			tr.append( '<th>' + data.head.vars[i] + '</th>' );
		}
		thead.append( tr );
		table.append( thead );

		for (i = 0; i < data.results.bindings.length; i++ ) {
			tr = $( '<tr>' ) ;
			for ( var j = 0; j < data.head.vars.length; j++ ) {
				td = $( '<td>' ) ;
				if ( data.head.vars[j] in data.results.bindings[i] ) {
					binding = data.results.bindings[i][data.head.vars[j]];
					var text = binding.value;
					if ( binding.type === 'uri' ) {
						text = this.abbreviateUri( text );
					}
					var linkText = $( '<pre>' ).text( text.trim() );
					if ( binding.type === 'typed-literal' ) {
						td.attr( {
							'class': 'literal',
							'data-datatype': binding.datatype
						} ).append( linkText );
					} else {
						td.attr( 'class', binding.type );
						if ( binding.type === 'uri' ) {
							td.append( $( '<a>' )
								.attr( 'href', binding.value )
								.append( linkText )
							);
						} else {
							td.append( linkText );
						}

						if ( binding['xml:lang'] ) {
							td.attr( {
								'data-lang': binding['xml:lang'],
								title: binding.value + '@' + binding['xml:lang']
							} );
						}
					}
				} else {
					// no binding
					td.attr( 'class', 'unbound' );
				}
				tr.append( td );
			}
			table.append( tr );
		}

		$( $element ).html( table );
	};

	/**
	 * Checks whether the browser can draw the given result
	 * @return {boolean}
	 **/
	SELF.prototype.isDrawable = function() {
		return true;
	};

	/**
	 * Produce abbreviation of the URI.
	 *
	 * @private
	 * @param {string} uri
	 * @returns {string}
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

	return SELF;
}( jQuery ) );
