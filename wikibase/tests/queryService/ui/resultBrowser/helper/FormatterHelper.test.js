( function( QUnit, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.ui.resultBrowser.helper' );

	var helper = new wb.queryService.ui.resultBrowser.helper.FormatterHelper();

	QUnit.test( 'Setup', function( assert ) {
		assert.expect( 1 );

		assert.ok( helper instanceof wb.queryService.ui.resultBrowser.helper.FormatterHelper );
	} );

	QUnit.test( 'parseDate', function( assert ) {
		var testCases = [
			[ '-1000000-12-31T00:00:00Z', 'Invalid date' ],
			[ '-271821-01-01T00:00:00Z', 'Invalid date' ],
			[ '-271820-01-01T00:00:00Z', '-271820-01-01' ],
			[ '-2016-12-31T00:00:00Z', '-2016-12-31' ],
			[ '-1-12-31T00:00:00Z', '-0001-12-31' ],
			[ '+0-00-00T00:00:00Z', 'Invalid date' ],
			[ '+1-12-31T00:00:00Z', '0001-12-31' ],
			[ '+2016-12-31T00:00:00Z', '2016-12-31' ],
			[ '+275760-01-01T00:00:00Z', '275760-01-01' ],
			[ '+275761-01-01T00:00:00Z', 'Invalid date' ],
			[ '+1000000-12-31T00:00:00Z', 'Invalid date' ]
		];

		assert.expect( testCases.length );

		testCases.forEach( function( testCase ) {
			var result = helper.parseDate( testCase[0] );
			assert.strictEqual( result.format( 'YYYY-MM-DD' ), testCase[1] );
		} );
	} );

}( QUnit, wikibase ) );
