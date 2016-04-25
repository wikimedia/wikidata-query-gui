( function ( $, QUnit, sinon, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.ui.visualEditor' );

	var PREFIXES = '\nPREFIX wikibase: <http://wikiba.se/ontology#>\nPREFIX wd: <http://www.wikidata.org/entity/>\nPREFIX wdt: <http://www.wikidata.org/prop/direct/>\nPREFIX wds: <http://www.wikidata.org/entity/statement/>\nPREFIX p: <http://www.wikidata.org/prop/>\nPREFIX wdref: <http://www.wikidata.org/reference/>\nPREFIX wdv: <http://www.wikidata.org/value/>\nPREFIX ps: <http://www.wikidata.org/prop/statement/>\nPREFIX psv: <http://www.wikidata.org/prop/statement/value/>\nPREFIX pq: <http://www.wikidata.org/prop/qualifier/>\nPREFIX pqv: <http://www.wikidata.org/prop/qualifier/value/>\nPREFIX pr: <http://www.wikidata.org/prop/reference/>\nPREFIX prv: <http://www.wikidata.org/prop/reference/value/>\nPREFIX wdno: <http://www.wikidata.org/prop/novalue/>\nPREFIX wdata: <http://www.wikidata.org/wiki/Special:EntityData/>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nPREFIX owl: <http://www.w3.org/2002/07/owl#>\nPREFIX skos: <http://www.w3.org/2004/02/skos/core#>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\nPREFIX prov: <http://www.w3.org/ns/prov#>\nPREFIX schema: <http://schema.org/>\nPREFIX bd: <http://www.bigdata.com/rdf#>\nPREFIX bds: <http://www.bigdata.com/rdf/search#>\nPREFIX gas: <http://www.bigdata.com/rdf/gas#>\nPREFIX hint: <http://www.bigdata.com/queryHints#>\n';
	var TEST_CASES = [
			{
				name: 'Cat query',
				sparqlIn: 'SELECT ?item ?itemLabel WHERE { ?item wdt:P31 wd:Q146 . SERVICE wikibase:label { bd:serviceParam wikibase:language "en" } }',
				sparqlOut: PREFIXES
						+ 'SELECT ?item ?itemLabel WHERE {\n  ?item <http://www.wikidata.org/prop/direct/P31> <http://www.wikidata.org/entity/Q146>.\n  SERVICE <http://wikiba.se/ontology#label> { <http://www.bigdata.com/rdf#serviceParam> <http://wikiba.se/ontology#language> "en". }\n}',
				text: 'Find instance of cat'
			},
			{
				name: 'Any cat query',
				sparqlIn: 'SELECT ?item ?itemLabel WHERE { ?item wdt:P31* wd:Q146 . SERVICE wikibase:label { bd:serviceParam wikibase:language "en" } }',
				sparqlOut: PREFIXES
						+ 'SELECT ?item ?itemLabel WHERE {\n  ?item <http://www.wikidata.org/prop/direct/P31>* <http://www.wikidata.org/entity/Q146>.\n  SERVICE <http://wikiba.se/ontology#label> { <http://www.bigdata.com/rdf#serviceParam> <http://wikiba.se/ontology#language> "en". }\n}',
				text: 'Find  any instance of cat'
			},
			{
				name: 'Subtype cat query',
				sparqlIn: 'SELECT * WHERE {?c  p:P31/ps:P31 wd:Q146 .}',
				sparqlOut: PREFIXES
						+ 'SELECT * WHERE { ?c (<http://www.wikidata.org/prop/P31>/<http://www.wikidata.org/prop/statement/P31>) <http://www.wikidata.org/entity/Q146>. }',
				text: 'Find instance of or subtype instance of cat'
			},
			{
				name: 'List of presidents with causes of death',
				sparqlIn: 'SELECT ?h ?cause ?hl ?causel WHERE { ?h wdt:P39 wd:Q11696 . ?h wdt:P509 ?cause . OPTIONAL {    ?h rdfs:label ?hl filter (lang(?hl) = "en") . } OPTIONAL {   ?cause rdfs:label ?causel filter (lang(?causel) = "en").  }}',
				sparqlOut: PREFIXES
						+ 'SELECT ?h ?cause ?hl ?causel WHERE {\n  ?h <http://www.wikidata.org/prop/direct/P39> <http://www.wikidata.org/entity/Q11696>.\n  ?h <http://www.wikidata.org/prop/direct/P509> ?cause.\n  OPTIONAL {\n    ?h <http://www.w3.org/2000/01/rdf-schema#label> ?hl.\n    FILTER((LANG(?hl)) = \"en\")\n  }\n  OPTIONAL {\n    ?cause <http://www.w3.org/2000/01/rdf-schema#label> ?causel.\n    FILTER((LANG(?causel)) = "en")\n  }\n}',
				text: 'Find position held President of the United States of America  Show cause of death'
			},
			{
				name: 'List of actors with pictures with year of birth and/or death',
				sparqlIn: 'SELECT ?human ?humanLabel ?yob ?yod ?picture WHERE{ ?human wdt:P31 wd:Q5 ; wdt:P106 wd:Q33999 . ?human wdt:P18 ?picture . OPTIONAL { ?human wdt:P569 ?dob . ?human wdt:P570 ?dod }. BIND(YEAR(?dob) as ?yob) . BIND(YEAR(?dod) as ?yod) . SERVICE wikibase:label {  bd:serviceParam wikibase:language "en" . }}LIMIT 88',
				sparqlOut: PREFIXES
						+ 'SELECT ?human ?humanLabel ?yob ?yod ?picture WHERE {\n  ?human <http://www.wikidata.org/prop/direct/P31> <http://www.wikidata.org/entity/Q5>.\n  ?human <http://www.wikidata.org/prop/direct/P106> <http://www.wikidata.org/entity/Q33999>.\n  ?human <http://www.wikidata.org/prop/direct/P18> ?picture.\n  OPTIONAL {\n    ?human <http://www.wikidata.org/prop/direct/P569> ?dob.\n    ?human <http://www.wikidata.org/prop/direct/P570> ?dod.\n  }\n  BIND(YEAR(?dob) AS ?yob)\n  BIND(YEAR(?dod) AS ?yod)\n  SERVICE <http://wikiba.se/ontology#label> { <http://www.bigdata.com/rdf#serviceParam> <http://wikiba.se/ontology#language> "en". }\n}\nLIMIT 88',
				text: 'Find instance of cat  with occupation actor  Show image , date of birth , date of birth'
			}
	];

	var LABELS = {
		P18: 'image',
		P569: 'date of birth',
		P570: 'date of birth',
		P31: 'instance of',
		P39: 'position held',
		P509: 'cause of death',
		P106: 'occupation',
		Q146: 'cat',
		Q5: 'cat',
		Q11696: 'President of the United States of America',
		Q33999: 'actor'
	};

	QUnit.test( 'When instantiating VisualEditor there should be no error ', function ( assert ) {
		assert.expect( 2 );
		var ve = new wb.queryService.ui.visualEditor.VisualEditor();

		assert.ok( true, 'Instantiating must not throw an error' );
		assert.ok( ( ve instanceof wb.queryService.ui.visualEditor.VisualEditor ),
				'Instantiating must not throw an error' );
	} );

	$.each( TEST_CASES, function ( index, testCase ) {
		QUnit.test( 'When setting SPARQL  \'' + testCase.name
				+ '\' query to VisualEditor then there should be the expected outcome', function (
				assert ) {
			assert.expect( 2 );

			var api = new wb.queryService.api.Wikibase();
			sinon.stub( api, 'searchEntities', function ( id ) {
				var label = id;
				if ( LABELS[id] ) {
					label = LABELS[id];
				}
				return $.Deferred().resolve( {
					search: [ {
						label: label,
						id: id,
						description: 'DESCRIPTION'
					} ]
				} ).promise();
			} );

			var ve = new wb.queryService.ui.visualEditor.VisualEditor( api );
			ve.setQuery( testCase.sparqlIn );

			var $html = $( '<div>' );
			ve.draw( $html );

			assert.equal( testCase.sparqlOut, ve.getQuery() );
			assert.equal( $html.text().trim(), testCase.text );
		} );

	} );

}( jQuery, QUnit, sinon, wikibase ) );
