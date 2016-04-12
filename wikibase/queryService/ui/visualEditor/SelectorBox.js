var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.visualEditor = wikibase.queryService.ui.visualEditor || {};

wikibase.queryService.ui.visualEditor.SelectorBox = ( function( $ ) {
	"use strict";

	var ENTITY_SEARCH_API_ENDPOINT_REQUEST = 'api.php?action=wbsearchentities&search={term}&format=json&language=en&uselang=en&type={entityType}&continue=0';

	var ENTITY_SEARCH_API_ENDPOINT_PATH = 'https://www.wikidata.org/w/';


	/**
	 * A selector box for selecting and changing properties and items
	 *
	 * @class wikibase.queryService.ui.this._editor
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 * @param {jQuery} $element
	 */
	function SELF( $element ) {
		this._entitySearchEndpoint = ENTITY_SEARCH_API_ENDPOINT_PATH + ENTITY_SEARCH_API_ENDPOINT_REQUEST;
		this._$element = $element;

		this._create();
	}

	/**
	 * @property {function}
	 * @private
	 */
	SELF.prototype._$element = null;

	/**
	 * @property {function}
	 * @private
	 */
	SELF.prototype._changeListener = null;

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._entitySearchEndpoint = null;

	/**
	 * Set the change listener
	 *
	 * @param {function} listener a function called when value selected
	 */
	SELF.prototype.setChangeListener = function( listener ) {
		this._changeListener = listener;
	};


	/**
	 * Set the change listener
	 *
	 * @param {function} listener a function called when value selected
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

		$select.select2({
			  placeholder: 'Select an option',
			  width: 'auto',
			  minimumInputLength: 1,
			  templateResult: formatter,
			  ajax: {//TODO: implement inversion of control
				    url: self._entitySearchEndpoint.replace( '&search={term}', '' ).replace( '{entityType}', type ),
				    dataType: 'jsonp',
				    delay: 250,
				    data: function (params) {
				      return {
				        search: params.term, // search term
				      };
				    },
				    processResults: function (data, params) {
				      return {
				        results: data.search.map( function( d ){
				        	return {
				        		id: d.id,
				        		text: d.label,
				        		data: d
				        	};
				        } ),
				      };
				    },
				    cache: true
				  }
		});
	};

	return SELF;
}( jQuery) );
