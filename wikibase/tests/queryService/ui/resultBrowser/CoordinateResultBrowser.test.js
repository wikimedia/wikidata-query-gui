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

	QUnit.test( '_extractLongLat internal helper function', function( assert ) {
		assert.expect( 3 );

		assert.deepEqual(
			crb._extractLongLat( '<http://www.wikidata.org/entity/Q2> Point(1 2)' ),
			[ "1", "2" ],
			'_extractLongLat should extract Wikidata terrestrial coordinate values'
		);

		assert.strictEqual(
			crb._extractLongLat( '<http://www.wikidata.org/entity/Q405> Point(1 2)' ),
			null,
			'_extractLongLat should not extract Wikidata lunar coordinate values'
		);

		assert.deepEqual(
			crb._extractLongLat( 'Point(1 2)' ),
			[ "1", "2" ],
			'_extractLongLat should extract coordinate values without explicit reference system'
		);
	} );

}( jQuery, QUnit, sinon, wikibase ) );
