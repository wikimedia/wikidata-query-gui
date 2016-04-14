var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.visualEditor = wikibase.queryService.ui.visualEditor || {};

wikibase.queryService.ui.visualEditor.SelectorBox = ( function( $, wikibase ) {
	"use strict";

	/**
	 * A selector box for selecting and changing properties and items
	 *
	 * @class wikibase.queryService.ui.visualEditor.SelectorBox
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 * @param {jQuery} $element
	 * @param {wikibase.queryService.api.Wikibase} api
	 */
	function SELF( $element, api ) {
		this._$element = $element;

		if ( api ){
			this._api = api;
		}else{
			this._api = new wikibase.queryService.api.Wikibase();
		}

		this._create();
	}

	/**
	 * @property {wikibase.queryService.api.Wikibase}
	 * @private
	 */
	SELF.prototype._api = null;

	/**
	 * @property {Function}
	 * @private
	 */
	SELF.prototype._$element = null;

	/**
	 * @property {Function}
	 * @private
	 */
	SELF.prototype._changeListener = null;

	/**
	 * Set the change listener
	 *
	 * @param {Function} listener a function called when value selected
	 */
	SELF.prototype.setChangeListener = function( listener ) {
		this._changeListener = listener;
	};

	/**
	 * Set the change listener
	 *
	 * @param {Function} listener a function called when value selected
	 */
	SELF.prototype.setEntitySearchEndpoint = function( e ) {
		this._entitySearchEndpoint = e;
	};


	/**
	 * @private
	 */
	SELF.prototype._create = function() {
		var self = this;

		var $select = this._getSelectBox();
		var $close = this._getCloseButton();
		var $content = $( '<div>' ).append( $select, $close );

		this._$element.clickover({
			placement: 'bottom',
			'global_close': false,
			'html':true,
			'content':function(){
				return $content;
			}
		}).click( function( e ){
			$.proxy ( self._renderSelect2( $select ), self );
			return false;
		} );


		$select.change( function( e ){
			$select.remove();
			self._$element.clickover( 'hide' );

			if( self._changeListener ){
				self._changeListener( $select.val() );
			}
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._getSelectBox = function() {
		var id = this._$element.data( 'id' );
		var label = this._$element.text();

		var $select =  $( '<select>' ).append( $( '<option>' ).attr( 'value', id ).text( label ) ).append( $( '<option>' ).attr( 'value', id ).text( label ) );

		return $select;
	};

	/**
	 * @private
	 */
	SELF.prototype._getCloseButton= function() {
		return $( '<button type="button" class="close" data-dismiss="clickover" aria-label="Close">' )
				.append( '<span aria-hidden="true">&times;</span>' );
	};

	/**
	 * @private
	 */
	SELF.prototype._renderSelect2 = function( $select ) {
		var self = this;
		var type = this._$element.data( 'type' );

		var formatter = function( item ){
			if( !item.data ){
				return item.text;
			}
			return  $( '<span>'  + item.text +  ' (' +item.data.id + ')' +
					'</span><br/><small>' + item.data.description + '</small>' );
		};

		var transport = function( params, success, failure ) {
			self._api.searchEntities( params.data.term, type ).done( function( data ){
				var r = data.search.map( function( d ) {
					return {
						id : d.id,
						text : d.label,
						data : d
					};
				} );
				success( { results:r } );
			}).fail( failure );
		};

		$select.select2({
			placeholder : 'Select an option',
			width : 'auto',
			minimumInputLength : 1,
			templateResult : formatter,
			ajax : {
			    delay: 250,
				transport : transport
			},
			cache : true
		});
	};

	return SELF;
}( jQuery, wikibase ) );
