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
	 * @param {wikibase.queryService.api.Wikibase} api
	 */
	function SELF( api ) {

		if ( api ) {
			this._api = api;
		} else {
			this._api = new wikibase.queryService.api.Wikibase();
		}
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
	 */
	SELF.prototype.add = function( $element, listener ) {
		this._create( $element, listener );
	};

	/**
	 * @private
	 */
	SELF.prototype._create = function( $element, listener ) {
		var self = this;

		var $select = this._getSelectBox( $element );
		var $close = this._getCloseButton();
		var $content = $( '<div>' ).append( $select, $close );

		$element.clickover( {
			placement: 'bottom',
			'global_close': false,
			'html': true,
			'content': function() {
				return $content;
			}
		} ).click( function( e ) {
			$.proxy( self._renderSelect2( $select, $element ), self );
			return false;
		} );

		$select.change( function( e ) {
			$select.remove();
			$element.clickover( 'hide' );

			if ( listener ) {
				listener( $select.val() );
			}
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._getSelectBox = function( $element ) {
		var id = $element.data( 'id' );
		var label = $element.text();

		var $select = $( '<select>' ).append( $( '<option>' ).attr( 'value', id ).text( label ) )
				.append( $( '<option>' ).attr( 'value', id ).text( label ) );

		return $select;
	};

	/**
	 * @private
	 */
	SELF.prototype._getCloseButton = function() {
		return $(
				'<button type="button" class="close" data-dismiss="clickover" aria-label="Close">' )
				.append( '<span aria-hidden="true">&times;</span>' );
	};

	/**
	 * @private
	 */
	SELF.prototype._renderSelect2 = function( $select, $element ) {
		var self = this;
		var type = $element.data( 'type' );

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
			placeholder: 'Select an option',
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
