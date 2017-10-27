( function( $, QUnit, sinon, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.api.CodeSamples' );

	var CodeSamples = wb.queryService.api.CodeSamples;

	var tests = [
		{
			name: 'simple',
			endpoint: 'http://sparql.example/endpoint',
			root: 'http://sparql.example/',
			index: 'http://sparql.example/index.html'
		},
		{
			name: 'empty',
			endpoint: '',
			root: '/',
			index: '/'
		}
	];

	$.each( tests, function( index, test ) {
		QUnit.test( test.name, function( assert ) {
			if ( navigator.userAgent.indexOf( 'PhantomJS' ) === -1 ) {
				// cannot load code examples in browser
				assert.expect( 0 );
				return;
			}
			var done = assert.async();
			$.get(
				'queryService/api/code-examples/' + test.name + '/query.sparql',
				function( query ) {
					new CodeSamples( test.endpoint, test.root, test.index )
						.getExamples( query )
						.then( function( examples ) {
							var promises = [];
							$.each( examples, function( lang, data ) {
								promises.push( $.get(
									'queryService/api/code-examples/' + test.name + '/' + lang + '.txt',
									function( expected ) {
										assert.strictEqual( data.code, expected );
									},
									'text'
								) );
							} );
							$.when.apply( $, promises ).then(
								done,
								function( e ) {
									assert.ok( false, 'could not load expected code' );
									done();
								}
							);
						} ).fail( function() {
							assert.ok( false, 'could not load code samples' );
							done();
						} );
				},
				'text'
			).fail( function() {
				assert.ok( false, 'could not load query' );
				done();
			} );
		} );
	} );

}( jQuery, QUnit, sinon, wikibase ) );
