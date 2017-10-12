var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.CoordinateResultBrowser = ( function( $, L, d3, _, wellknown, window ) {
	'use strict';

	/**
	 * A list of datatypes that contain geo:wktLiteral values conforming with GeoSPARQL.
	 * @private
	 */
	var MAP_DATATYPES = [
		'http://www.opengis.net/ont/geosparql#wktLiteral', // used by Wikidata
		'http://www.openlinksw.com/schemas/virtrdf#Geometry' // used by LinkedGeoData.org
	];
	var GLOBE_EARTH = 'http://www.wikidata.org/entity/Q2';
	var CRS84 = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';
	/**
	 * A list of coordinate reference systems / spatial reference systems
	 * that refer to Earth and use longitude-latitude axis order.
	 * @private
	 */
	var EARTH_LONGLAT_SYSTEMS = [
		GLOBE_EARTH,
		CRS84
	];

	var LAYER_COLUMNS = [ 'layerLabel', 'layer' ];
	var LAYER_DEFAULT_GROUP = '_LAYER_DEFAULT_GROUP';

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
		this._getMarkerGroupColor = d3.scale.category10();

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
	}

	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractResultBrowser();

	/**
	 * @property {L.Map}
	 * @private
	 */
	SELF.prototype._map = null;

	/**
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._markerGroups = null;

	/**
	 * Maps group name to a certain color
	 * @private
	 */
	SELF.prototype._getMarkerGroupColor = null;

	/**
	 * Draw a map to the given element
	 *
	 * @param {jQuery} $element target element
	 */
	SELF.prototype.draw = function( $element ) {
		var container = $( '<div>' ).attr( 'id', 'map' ).height( '100vh' );

		$element.html( container );

		this._createMarkerGroups();
		this._map = L.map( 'map', {
			center: [ 0, 0 ],
			maxZoom: 18,
			minZoom: 2,
			fullscreenControl: true,
			preferCanvas: true,
			layers: _.compact( this._markerGroups ) // convert object to array
		} ).fitBounds( this._markerGroups[ LAYER_DEFAULT_GROUP ].getBounds() );

		this._setTileLayer();
		this._createControls();
		this._createMarkerZoomResize();

		$element.html( container );
	};

	/**
	 * Create map controls
	 *
	 * @private
	 */
	SELF.prototype._createControls = function() {
		var self = this;

		//zoom control
		this._map.addControl( L.control.zoomBox( {
			modal: false,
			className: 'glyphicon glyphicon-zoom-in'
		} ) );
		this._map.addControl( new ScrollToTopButton() );

		//layers control
		var numberOfLayers = Object.keys( this._markerGroups ).length;
		if ( numberOfLayers > 1 ) {
			var control = this._getLayerControl( this._markerGroups ).addTo( this._map );

			// update layer control
			this._map.on( 'overlayadd overlayremove', function ( event ) {
				if ( event.layer !== self._markerGroups[ LAYER_DEFAULT_GROUP ] ) {
					return;
				}
				$.each( self._markerGroups, function( i, layer ) {
					if ( event.type === 'overlayadd' ) {
						self._map.addLayer( layer );
					} else {
						self._map.removeLayer( layer );
					}
				} );
				control._update();
			} );
		}
	};

	/**
	 * @private
	 */
	SELF.prototype._createMarkerZoomResize = function() {
		var self = this;

		if ( this._markerGroups[LAYER_DEFAULT_GROUP].getLayers().length > 1000 ) {
			return; // disable when to many markers (bad performance)
		}

		var resize = function() {
			self._markerGroups[LAYER_DEFAULT_GROUP].setStyle( {
				radius: self._getMarkerRadius()
			} );
		};

		this._map.on( 'zoomend', resize );
	};

	/**
	 * @private
	 */
	SELF.prototype._getMarkerRadius = function() {
		if ( !this._map ) {
			return 3;
		}

		var currentZoom = this._map.getZoom();
		return ( currentZoom * ( 1 / 2 ) );
	};

	/**
	 * @private
	 */
	SELF.prototype._getLayerControl = function() {
		var self = this,
			layerControls = {},
			control = '';

		$.each( this._markerGroups, function( name, markers ) {
			if ( name === LAYER_DEFAULT_GROUP ) {
				control = self._i18n( 'wdqs-result-map-layers-all', 'All layers' );
			} else {
				var color = self._getMarkerGroupColor( name );
				control = '<span style="color:' + color + '">&#x2b24;</span> ' + name;
			}

			layerControls[ control ] = markers;
		} );

		return L.control.layers( null, layerControls );
	};

	/**
	 * @private
	 */
	SELF.prototype._createMarkerGroups = function() {
		var self = this,
			markers = {};
		markers[ LAYER_DEFAULT_GROUP ] = [];

		this._iterateResult( function( field, key, row ) {
			if ( field && MAP_DATATYPES.indexOf( field.datatype ) !== -1 ) {
				var geoJson = self._extractGeoJson( field.value );
				if ( !geoJson ) {
					return;
				}

				var layer = self._getMarkerGroupsLayer( row );
				if ( !markers[ layer ] ) {
					markers[ layer ] = [];
				}
				var marker = L.geoJson( geoJson, {
					style: self._getMarkerStyle( layer ),
					pointToLayer: function( geoJsonPoint, latLon ) {
						return L.circleMarker( latLon, self._getMarkerStyle( layer ) );
					},
					onEachFeature: function( feature, layer ) {
						var popup = L.popup();
						layer.bindPopup( popup );
						layer.on( 'click', function() {
							var info = self._getItemDescription( row );
							popup.setContent( info[0] );
						} );
					}
				} );
				markers[ layer ].push( marker );
				markers[ LAYER_DEFAULT_GROUP ].push( marker );
			}
		} );

		if ( Object.keys( markers ).length === 0 ) {
			var marker = L.marker( [ 0, 0 ] ).bindPopup( 'Nothing found!' ).openPopup();
			return { null: L.featureGroup( [marker] ) };
		}

		$.each( markers, function( key ) {
			markers[ key ] = L.featureGroup( markers[ key ] );
		} );

		this._markerGroups = markers;
	};

	/**
	 * @private
	 */
	SELF.prototype._getMarkerGroupsLayer = function( row ) {
		var column = LAYER_COLUMNS.find( function( column ) {
			return row[column];
		} );

		return column ? row[column].value : LAYER_DEFAULT_GROUP;
	};

	/**
	 * @private
	 * @param {string} group
	 */
	SELF.prototype._getMarkerStyle = function( group ) {
		var color = '#e04545';

		if ( group !== LAYER_DEFAULT_GROUP ) {
			color = this._getMarkerGroupColor( group );
		}

		return {
			color: color,
			opacity: 0.8,
			fillColor: color,
			fillOpacity: 0.9,
			radius: this._getMarkerRadius()
		};
	};

	/**
	 * Split a geo:wktLiteral or compatible value
	 * into coordinate reference system URI
	 * and Simple Features Well Known Text (WKT) string,
	 * according to GeoSPARQL, Req 10.
	 *
	 * If the coordinate reference system is not specified,
	 * CRS84 is used as default value, according to GeoSPARQL, Req 11.
	 *
	 * @private
	 * @param {string} literal
	 * @return {?{ crs: string, wkt: string }}
	 */
	SELF.prototype._splitWktLiteral = function( literal ) {
		var match = literal.match( /(<([^>]*)> +)?(.*)/ ); // only U+0020 spaces as separator, not other whitespace, according to GeoSPARQL, Req 10

		if ( match ) {
			return { crs: match[2] || CRS84, wkt: match[3] };
		} else {
			return null;
		}
	};

	/**
	 * Extract a GeoJSON object from the given geo:wktLiteral.
	 *
	 * @private
	 * @param {string} literal
	 * @return {?Object} GeoJSON
	 */
	SELF.prototype._extractGeoJson = function( literal ) {
		var split = this._splitWktLiteral( literal );
		if ( !split ) {
			return null;
		}

		if ( EARTH_LONGLAT_SYSTEMS.indexOf( split.crs ) === -1 ) {
			return null;
		}

		return wellknown.parse( split.wkt );
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
	SELF.prototype._setTileLayer = function() {
		var layer = TILE_LAYER.osm;

		if ( window.location.host === 'query.wikidata.org' ||
				window.location.host === 'localhost' ||
				window.location.host.endsWith( '.wmflabs.org' ) ) {
			layer = TILE_LAYER.wikimedia;
		}

		L.tileLayer( layer.url, layer.options ).addTo( this._map );
	};

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
		if ( value && MAP_DATATYPES.indexOf( value.datatype ) !== -1 ) {
			var longLat = this._extractGeoJson( value.value );
			if ( longLat !== null ) {
				this._drawable = true;
				return false;
			}
		}
		return true;
	};

	return SELF;
}( jQuery, L, d3, _, wellknown, window ) );
