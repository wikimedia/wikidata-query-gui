var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.resultBrowser.CoordinateResultBrowser = ( function( $, L ) {
	"use strict";

	var MAP_DATATYPE = 'http://www.opengis.net/ont/geosparql#wktLiteral';
	var MAP_SERVER = 'https://maps.wikimedia.org/';
    var MAP_STYLE = 'osm-intl';


    var ScrollToTopButton = null;

	/**
	 * A result browser for long lat coordinates
	 *
	 * @class wikibase.queryService.ui.resultBrowser.CoordinateResultBrowser
	 * @licence GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @author Katie Filbert
	 * @constructor
	 *
	 */
	function SELF() {
	}

	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractResultBrowser();

	/**
	 * @property {jQuery}
	 * @private
	 **/
	SELF.prototype._grid = null;

	/**
	 * Draw a map to the given element
	 * @param {jQuery} $element target element
	 */
	SELF.prototype.draw = function( $element ) {
		var container = $( '<div>' )
			.attr( { 'id': 'map' } )
			.height( '100vh' );

		$element.html( container );

		var	markerGroup = this._getMarkerGroup(),
			map = L.map( 'map', {
				center: [0, 0],
				zoom: 3
			} ).fitBounds( markerGroup.getBounds() );

		this._setTileLayer( map );
		map.addControl( new ScrollToTopButton() );
		markerGroup.addTo( map );

	    $element.html( container );
	};

	/**
	 * Checks whether the browser can draw the given result
	 * @return {boolean}
	 */
	SELF.prototype.isDrawable = function() {

		var result = this._result.results.bindings[0] || {},
		isDrawable = false;

		$.each( result, function( key, field ){
			if( field.datatype === MAP_DATATYPE ){
				isDrawable = true;
				return false;
			}
		} );

		return isDrawable;
	};

	/**
	 * @private
	 */
	SELF.prototype._getMarkerGroup = function() {
		var self = this,
			result = this._result.results.bindings || {},
			markers = [];

		$.each( result, function( rowKey){
			$.each( this, function( key, field ){
				if( key >= 300 ){
					window.alert( 'Sorry, at the moment this map can only display 300 markers!' );
					return false;
				}
		    	if( field.datatype === MAP_DATATYPE ){
		    		var longLat = self._extractLongLat( field.value );
		    		if( !longLat[0] || !longLat[1] ){
		    			return true;
		    		}
		    		var info = self._getItemDescription( rowKey );

		    		markers.push(
						L.marker( [ longLat[0], longLat[1] ] ).bindPopup( info[0] )
					);
		    	}
			} );
		} );

		return L.featureGroup( markers );
	};

	/**
	 * @private
	 */
	SELF.prototype._extractLongLat = function( point ) {
		point = point.replace('Point(', '' );
		point = point.replace( ')', '' );

		return point.split( ' ' );
	};

	/**
	 * @private
	 */
	SELF.prototype._getItemDescription = function( rowKey ) {
		var row = this._result.results.bindings[rowKey],
		$result = $( '<div/>' );

		$.each( row, function( key, value ){
			$result.append( $( '<div/>' ).text( key + ': ' + value.value ) );
		} );

		return $result;
	};

	/**
	 * @private
	 */
	SELF.prototype._setTileLayer = function( map ) {
		L.tileLayer( MAP_SERVER + MAP_STYLE + '/{z}/{x}/{y}.png', {
	        maxZoom: 18,
	        id: 'wikipedia-map-01',
	        attribution: 'Wikimedia maps beta | Map data &copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
	    }).addTo( map );
	};


	ScrollToTopButton =  L.Control.extend({
		  options: {
		    position: 'topright'
		  },

		  onAdd: function (map) {
		    var container = L.DomUtil.create( 'button' );
		    $( container ).addClass( 'btn btn-default' );
		    $( container ).append( $(' <span class="glyphicon glyphicon-chevron-up"/> ') );

		    container.onclick = function(){
		        $( window ).scrollTop( 0, 0 );
		      };

		    return container;
		  }
		});

	return SELF;
}( jQuery, L ) );
