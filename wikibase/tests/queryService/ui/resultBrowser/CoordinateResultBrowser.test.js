( function( $, QUnit, sinon, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.ui.resultBrowser' );
	var crb = new wb.queryService.ui.resultBrowser.CoordinateResultBrowser();

	QUnit.test( '_splitWktLiteral internal helper function', function( assert ) {
		assert.expect( 2 );

		assert.deepEqual(
			crb._splitWktLiteral( '<http://www.wikidata.org/entity/Q2> Point(1 2)' ),
			{ crs: 'http://www.wikidata.org/entity/Q2', wkt: 'Point(1 2)' },
			'_splitWktLiteral should split crs and wkt correctly'
		);

		assert.deepEqual(
			crb._splitWktLiteral( 'Point(1 2)' ),
			{ crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84', wkt: 'Point(1 2)' },
			'_splitWktLiteral without explicit reference system should use standard default value'
		);
	} );

	QUnit.test( '_extractGeoJson internal helper function', function( assert ) {
		assert.expect( 4 );

		assert.deepEqual(
			crb._extractGeoJson( '<http://www.wikidata.org/entity/Q2> Point(1 2)' ),
			{ "type": "Point", "coordinates": [ 1, 2 ] },
			'_extractGeoJson should extract Wikidata terrestrial coordinate values'
		);

		assert.strictEqual(
			crb._extractGeoJson( '<http://www.wikidata.org/entity/Q405> Point(1 2)' ),
			null,
			'_extractGeoJson should not extract Wikidata lunar coordinate values'
		);

		assert.deepEqual(
			crb._extractGeoJson( 'Point(1 2)' ),
			{ "type": "Point", "coordinates": [ 1, 2 ] },
			'_extractGeoJson should extract coordinate values without explicit reference system'
		);

		assert.deepEqual(
			crb._extractGeoJson( 'Linestring(1 2,3 4)' ),
			{ "type": "LineString", "coordinates": [ [ 1, 2 ], [ 3, 4 ] ] },
			'_extractGeoJson should extract non-point literals'
		);
	} );

}( jQuery, QUnit, sinon, wikibase ) );
