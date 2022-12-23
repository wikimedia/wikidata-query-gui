( function ( $, QUnit, sinon, wb ) {
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

	$.each( tests, function ( index, test ) {
		QUnit.test( test.name, function ( assert ) {
			var done = assert.async();

			function handleError( part ) {
				return function () {
					assert.ok( false, 'could not load ' + part );
					done();
				};
			}

			$.get(
				'queryService/api/code-examples/' + test.name + '/query.sparql',
				function ( query ) {
					new CodeSamples( test.endpoint, test.root, test.index )
						.getExamples( query )
						.then( function ( examples ) {
							var promises = [];
							$.each( examples, function ( lang, data ) {
								promises.push( $.get(
									'queryService/api/code-examples/' + test.name + '/' + lang + '.txt',
									function ( expected ) {
										assert.strictEqual( data.code, expected, lang );
									},
									'text'
								) );
							} );
							$.when.apply( $, promises )
								.then( done )
								.fail( handleError( 'expected code' ) );
						} ).fail( handleError( 'code samples' ) );
				},
				'text'
			).fail( handleError( 'query' ) );
		} );
	} );

}( jQuery, QUnit, sinon, wikibase ) );
