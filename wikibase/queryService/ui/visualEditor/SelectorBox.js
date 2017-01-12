var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.visualEditor = wikibase.queryService.ui.visualEditor || {};

wikibase.queryService.ui.visualEditor.SelectorBox = ( function( $, wikibase ) {
	'use strict';

	/**
	 * A selector box for selecting and changing properties and items
	 *
	 * @class wikibase.queryService.ui.visualEditor.SelectorBox
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 * @param {wikibase.queryService.api.Wikibase} [api]
	 */
	function SELF( api ) {
		this._api = api || new wikibase.queryService.api.Wikibase();
	}

	/**
	 * @property {wikibase.queryService.api.Wikibase}
	 * @private
	 */
	SELF.prototype._api = null;

	/**
	 * Add selector box to element
	 *
	 * @param {jQuery} $element
	 * @param {Function} listener a function called when value selected
	 * @param {Object} toolbar {icon:callback}
	 */
	SELF.prototype.add = function( $element, listener, toolbar ) {
		switch ( $element.data( 'type' ).toLowerCase() ) {
		case 'number':
			this._createInput( $element, listener, toolbar );
			break;

		default:
			this._createSelect( $element, listener, toolbar );
		}
	};

	/**
	 * @private
	 */
	SELF.prototype._createInput = function( $element, listener, toolbar ) {
		var $input = $( '<input>' ).attr( 'type', $element.data( 'type' ) ),
			$close = this._getCloseButton(),
			$toolbar = this._getToolbar( toolbar, $element ),
			$content = $( '<div>' ).append( $close, ' ', $input, ' ', $toolbar );

		$element.clickover( {
			placement: 'bottom',
			'global_close': false,
			'html': true,
			'content': function() {
				return $content;
			}
		} ).click( function( e ) {
			$input.val( $element.data( 'value' ) || '' );
		} );

		$input.on( 'keyup mouseup', function() {
			if ( listener ) {
				listener( $input.val() );
			}
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._createSelect = function( $element, listener, toolbar ) {
		var self = this,
			$select = this._getSelectBox( $element ),
			$close = this._getCloseButton(),
			$toolbar = this._getToolbar( toolbar, $element ),
			$content = $( '<div>' ).append( $close, ' ', $select, ' ', $toolbar );

		$element.clickover( {
			placement: 'bottom',
			'global_close': false,
			'html': true,
			'content': function() {
				return $content;
			}
		} ).click( function( e ) {
			$select.toggleClass( 'open' );

			if ( !$select.data( 'select2' ) ) {
				$.proxy( self._renderSelect2( $select, $element ), self );
			}

			if ( $select.hasClass( 'open' ) ) {
				if ( $element.data( 'auto_open' ) ) {
					$select.data( 'select2' ).open();
				}
			}
			return false;
		} );

		$select.change( function( e ) {
			if ( listener ) {
				listener( $select.val(), $select.find( 'option:selected' ).text() );
			}
			$element.click();// hide clickover
			$select.html( '' );
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._getSelectBox = function( $element ) {
		var id = $element.data( 'id' );
		var label = $element.text();

		var $select = $( '<select>' );
		if ( id ) {
			$select.append( $( '<option>' ).attr( 'value', id ).text( label ) );
		}

		return $select;
	};

	/**
	 * @private
	 */
	SELF.prototype._getCloseButton = function() {
		return $( '<a href="#" data-dismiss="clickover">' ).append(
				'<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' );
	};

	/**
	 * @private
	 */
	SELF.prototype._getToolbar = function( toolbar, $element ) {
		var $toolbar = $( '<span>' );

		$.each( toolbar, function( icon, callback ) {
			var $link = $( '<a>' ).attr( 'href', '#' );
			$link.prepend( '<span class="glyphicon glyphicon-' + icon +
					'" aria-hidden="true"></span>', ' ' );

			$link.click( function() {
				if ( callback() ) {
					$element.click();// close popover
				}

				return false;
			} );
			$toolbar.append( $link, ' ' );
		} );

		return $toolbar;
	};

	/**
	 * @private
	 */
	SELF.prototype._renderSelect2 = function( $select, $element ) {
		var self = this,
			type = $element.data( 'type' );

		var formatter = function( item ) {
			if ( !item.data ) {
				return item.text;
			}
			return $( '<span>' + item.text + ' (' + item.data.id + ')' + '</span><br/><small>' +
					item.data.description + '</small>' );
		};

		var transport = function( params, success, failure ) {
			self._api.searchEntities( params.data.term, type ).done( function( data ) {
				var r = data.search.map( function( d ) {
					return {
						id: d.id,
						text: d.label,
						data: d
					};
				} );
				success( {
					results: r
				} );
			} ).fail( failure );
		};

		$select.select2( {
			width: 'auto',
			minimumInputLength: 1,
			templateResult: formatter,
			ajax: {
				delay: 250,
				transport: transport
			},
			cache: true
		} );
	};

	return SELF;
}( jQuery, wikibase ) );
