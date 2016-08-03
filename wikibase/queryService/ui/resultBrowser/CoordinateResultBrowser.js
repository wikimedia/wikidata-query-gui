var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.CoordinateResultBrowser = ( function( $, L, window ) {
	'use strict';

	var MAP_DATATYPE = 'http://www.opengis.net/ont/geosparql#wktLiteral';
	var GLOBE_EARTH = 'Q2';

	var TILE_LAYER = {
		wikimedia: {
			url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
			options: {
				id: 'wikipedia-map-01',
				attribution: ' <a href="http://maps.wikimedia.org/">Wikimedia</a> | &copy; <a href="http://openstreetmap.org/copyright">Open Street Map</a> contributors'
			}
		},
		osm: {
			url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
			options: {
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
			}
		}
	};

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
	 */
	SELF.prototype._grid = null;

	/**
	 * Draw a map to the given element
	 *
	 * @param {jQuery} $element target element
	 */
	SELF.prototype.draw = function( $element ) {
		var container = $( '<div>' ).attr( {
			'id': 'map'
		} ).height( '100vh' );

		$element.html( container );

		var markerGroup = this._getMarkerGroup(), map = L.map( 'map', {
			center: [
					0, 0
			],
			maxZoom: 18,
			minZoom: 2,
			fullscreenControl: true
		} ).fitBounds( markerGroup.getBounds() );

		this._setTileLayer( map );

		map.addControl( L.control.zoomBox( {
			modal: false,
			className: 'glyphicon glyphicon-zoom-in'
		} ) );
		map.addControl( new ScrollToTopButton() );
		markerGroup.addTo( map );

		$element.html( container );
	};

	/**
	 * @private
	 */
	SELF.prototype._getMarkerGroup = function() {
		var self = this, markers = [];

		this._iterateResult( function( field, key, row ) {
			if ( field && field.datatype === MAP_DATATYPE ) {
				var longLat = self._extractLongLat( field.value );
				if ( longLat === null || !longLat[0] || !longLat[1] ) {
					return true;
				}

				var popup = L.popup(),
					lon = longLat[0],
					lat = longLat[1];

				var marker = L.circleMarker( [ lat, lon ], self._getMarkerStyle() )
					.bindPopup( popup );

				marker.on( 'click', function() {
					var info = self._getItemDescription( row );
					popup.setContent( info[0] );
				} );

				markers.push( marker );
			}
		} );

		if ( markers.length === 0 ) {
			var marker = L.marker( [
					0, 0
			] ).bindPopup( 'Nothing found!' ).openPopup();
			markers.push( marker );
		}

		return L.featureGroup( markers );
	};

	/**
	 * @private
	 */
	SELF.prototype._getMarkerStyle = function() {
		return {
			radius: 2,
			color: '#e04545',
			opacity: 0.8,
			fillColor: '#e04545',
			fillOpacity: 0.9
		};
	};

	/**
	 * @private
	 */
	SELF.prototype._extractLongLat = function( point ) {

		var globe = this._extractGlobe( point );
		if ( globe !== null && globe !== GLOBE_EARTH ) {
			return null;
		}

		point = point.match( /Point\((.*)\)/ ).pop();

		return point.split( ' ' );
	};

	/**
	 * @private
	 */
	SELF.prototype._extractGlobe = function( point ) {
		var globe = null;

		if ( ( globe = point.match( /<http\:\/\/www\.wikidata\.org\/entity\/(.+)>/i ) ) ) {
			globe = globe.pop();
		}

		return globe;
	};

	/**
	 * @private
	 */
	SELF.prototype._getItemDescription = function( row ) {
		var $result = $( '<div/>' ).append( this._getFormatter().formatRow( row, true ) );

		return $result;
	};

	/**
	 * @private
	 */
	SELF.prototype._setTileLayer = function( map ) {
		var layer = TILE_LAYER.osm;
		if ( window.location.host === 'query.wikidata.org' ||
				window.location.host === 'localhost' ||
				window.location.host.endsWith( '.wmflabs.org' ) ) {
			layer = TILE_LAYER.wikimedia;
		}

		L.tileLayer( layer.url, layer.options ).addTo( map );
	};

	ScrollToTopButton = L.Control.extend( {
		options: {
			position: 'topright'
		},

		onAdd: function( map ) {
			var container = L.DomUtil.create( 'button' );
			$( container ).addClass( 'btn btn-default' );
			$( container ).append( $( ' <span class="glyphicon glyphicon-chevron-up"/> ' ) );

			container.onclick = function() {
				if ( map.isFullscreen() ) {
					map.toggleFullscreen();
				}
				$( window ).scrollTop( 0, 0 );
			};

			return container;
		}
	} );

	/**
	 * Receiving data from the a visit
	 *
	 * @param {Object} data
	 * @return {boolean} false if there is no revisit needed
	 */
	SELF.prototype.visit = function( data ) {
		return this._checkCoordinate( data );
	};

	/**
	 * Check if this value contains an coordinate value.
	 */
	SELF.prototype._checkCoordinate = function( value ) {
		if ( value && value.datatype === MAP_DATATYPE ) {
			var globe = this._extractGlobe( value.value );
			if ( globe === null || globe === GLOBE_EARTH ) {
				this._drawable = true;
				return false;
			}
		}
		return true;
	};

	return SELF;
}( jQuery, L, window ) );
