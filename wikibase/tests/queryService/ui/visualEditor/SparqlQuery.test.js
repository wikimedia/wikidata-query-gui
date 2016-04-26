( function( $, QUnit, sinon, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.ui.visualEditor' );


	var PACKAGE = wb.queryService.ui.visualEditor;
	var QUERY = [
		'SELECT * WHERE {}',
		'SELECT * WHERE {} LIMIT 10',
		'SELECT ?x1 ?x2 ?x3 WHERE {} LIMIT 10',
		'SELECT ?x1 ?x2 ?x3 WHERE { <S> <P> <O>.  OPTIONAL{ <S1> <P1> <O1> }  <S2> <P2> <O2>.}',
		'SELECT * WHERE {  {SELECT * WHERE { {SELECT * WHERE {}} }} }'
	];

	QUnit.test( 'When instantiating new SparqlQuery then', function( assert ) {
		assert.expect( 2 );
		var q = new PACKAGE.SparqlQuery();

		assert.ok( true, 'must not throw an error' );
		assert.ok( ( q instanceof PACKAGE.SparqlQuery ), 'object must be type of SparqlQuery' );
	} );

	QUnit.test( 'When parsing query is \'' + QUERY[0] + '\' then', function( assert ) {
		assert.expect( 1 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY[0] );
		q.getQueryString();

		assert.ok( true, 'parsing must not throw an error' );
	} );

	QUnit.test( 'When parsing query '+ QUERY[1], function( assert ) {
		assert.expect( 1 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY[1] );
		var limit = q.getLimit();

		assert.equal( 10, limit, 'then LIMIT must be 10' );
	} );

	QUnit.test( 'When query is \'' + QUERY[1] + '\' and I change LIMIT to LIMIT * 2 then', function( assert ) {
		assert.expect( 1 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY[1] );
		var limit = q.getLimit();
		q.setLimit( ( limit * 2 ) );

		assert.equal( 20, q.getLimit(), 'LIMIT must be 20' );
	} );

	QUnit.test( 'When query is \'' + QUERY[1] + '\' and I set LIMIT to NULL then', function( assert ) {
		assert.expect( 2 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY[1] );
		q.setLimit( null );

		assert.equal( null, q.getLimit(), 'LIMIT should be NULL' );
		assert.equal( 'SELECT * WHERE {  }', q.getQueryString(), 'query string should not contain LIMIT ' );
	} );

	QUnit.test( 'When query is \'' + QUERY[2] + '\' then',
		function( assert ) {
			assert.expect( 5 );

			var q = new PACKAGE.SparqlQuery();
			q.parse( QUERY[2] );

			assert.ok( q.hasVariable( '?x1' ), '?x1 must be a variable' );
			assert.ok( q.hasVariable( '?x2' ), '?x1 must be a variable' );
			assert.ok( q.hasVariable( '?x3' ), '?x1 must be a variable' );

			assert.notOk( q.hasVariable( 'x4' ), 'x1 must not be a variable' );
			assert.notOk( q.hasVariable( '?x4' ), '?x1 must npt be a variable' );
		} );

	QUnit.test( 'When query is \'' + QUERY[0] + '\' THEN',
		function( assert ) {
			assert.expect( 6 );

			var q = new PACKAGE.SparqlQuery();
			q.parse( QUERY[0] );

			assert.ok( q.hasVariable( '?XX' ), '?XX must be a variable' );
			assert.ok( q.hasVariable( '?YYY' ), '?YYY must be a variable' );
			assert.ok( q.hasVariable( '?ZZLABEL' ), '?ZZLABEL must be a variable' );
			assert.notOk( q.hasVariable( 'XX' ), 'XX must not be a variable' );
			assert.notOk( q.hasVariable( 'YY' ), 'XX must not be a variable' );
			assert.notOk( q.hasVariable( 'ZZ' ), 'XX must not be a variable' );
		} );

	QUnit.test( 'When query is \'' + QUERY[3] + '\' then',
		function( assert ) {
			assert.expect( 10 );

			var q = new PACKAGE.SparqlQuery();
			q.parse( QUERY[3] );
			var triples = q.getTriples();

			assert.equal( triples.length, 3 , 'there should be 3 triples');

			assert.equal( triples[0].optional, false, 'triple1 must not be optional' );
			assert.deepEqual( triples[0].query, q, 'query of triple1 must be query' );
			assert.deepEqual( triples[0].triple, {
				"subject": "S",
				"predicate": "P",
				"object": "O"
			}, 'tripl1 must be S, P, O'  );

			assert.equal( triples[1].optional, true, 'triple1 must be optional' );
			assert.deepEqual( triples[1].query, q, 'query of triple1 must be query' );
			assert.deepEqual( triples[1].triple, {
				"object": "O1",
				"predicate": "P1",
				"subject": "S1"
			}, 'tripl1 must be S1, P1, O1'  );

			assert.equal( triples[2].optional, false, 'triple1 must not be optional' );
			assert.deepEqual( triples[2].query, q, 'query of triple1 must be query' );
			assert.deepEqual( triples[2].triple, {
				"object": "O2",
				"predicate": "P2",
				"subject": "S2"
			}, 'tripl2 must be S2, P2, O2'  );
	} );


	QUnit.test( 'When query is \'' + QUERY[3] + '\' and I delete 2 triples then',
			function( assert ) {
				assert.expect( 2 );

				var q = new PACKAGE.SparqlQuery();
				q.parse( QUERY[3] );
				var triples = q.getTriples();

				triples[0].remove();
				triples[2].remove();

				triples = q.getTriples();

				assert.equal( triples.length, 1, 'there should be 1 triple left' );
				assert.deepEqual( triples[0].triple, {
					"object": "O1",
					"predicate": "P1",
					"subject": "S1"
				}, 'tripl left must be S1, P1, O1'  );
	} );

	QUnit.test( 'When query is \'' + QUERY[4] + '\' then',
		function( assert ) {
			assert.expect( 4 );

			var q = new PACKAGE.SparqlQuery();
			q.parse( QUERY[4] );
			var queries = q.getSubQueries();

			assert.equal( queries.length, 1, 'expecting one subquery' );
			assert.ok( ( queries[0] instanceof PACKAGE.SparqlQuery ), 'that must be instance of SparqlQuery' );


			queries = queries[0].getSubQueries();
			assert.equal( queries.length, 1, 'expecting one sub query of sub query' );
			assert.ok( ( queries[0] instanceof PACKAGE.SparqlQuery ), 'that must be instance of SparqlQuery' );

	} );

}( jQuery, QUnit, sinon, wikibase ) );
