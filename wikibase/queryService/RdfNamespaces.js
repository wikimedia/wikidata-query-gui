var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.RdfNamespaces = {};

( function ( $, RdfNamespaces ) {
	'use strict';

	// RdfNamespaces.NAMESPACE_SHORTCUTS = {
	// 	Wikidata: {
	// 		wikibase: 'http://wikiba.se/ontology#',
	// 		wd: 'http://www.wikidata.org/entity/',
	// 		wdt: 'http://www.wikidata.org/prop/direct/',
	// 		wdtn: 'http://www.wikidata.org/prop/direct-normalized/',
	// 		wds: 'http://www.wikidata.org/entity/statement/',
	// 		p: 'http://www.wikidata.org/prop/',
	// 		wdref: 'http://www.wikidata.org/reference/',
	// 		wdv: 'http://www.wikidata.org/value/',
	// 		ps: 'http://www.wikidata.org/prop/statement/',
	// 		psv: 'http://www.wikidata.org/prop/statement/value/',
	// 		psn: 'http://www.wikidata.org/prop/statement/value-normalized/',
	// 		pq: 'http://www.wikidata.org/prop/qualifier/',
	// 		pqv: 'http://www.wikidata.org/prop/qualifier/value/',
	// 		pqn: 'http://www.wikidata.org/prop/qualifier/value-normalized/',
	// 		pr: 'http://www.wikidata.org/prop/reference/',
	// 		prv: 'http://www.wikidata.org/prop/reference/value/',
	// 		prn: 'http://www.wikidata.org/prop/reference/value-normalized/',
	// 		wdno: 'http://www.wikidata.org/prop/novalue/',
	// 		wdata: 'http://www.wikidata.org/wiki/Special:EntityData/'
	// 	},
	// 	W3C: {
	// 		rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
	// 		rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
	// 		owl: 'http://www.w3.org/2002/07/owl#',
	// 		skos: 'http://www.w3.org/2004/02/skos/core#',
	// 		xsd: 'http://www.w3.org/2001/XMLSchema#',
	// 		prov: 'http://www.w3.org/ns/prov#',
	// 		ontolex: 'http://www.w3.org/ns/lemon/ontolex#'
	// 	},
	// 	'Social/Other': {
	// 		schema: 'http://schema.org/',
	// 		geo: 'http://www.opengis.net/ont/geosparql#',
	// 		geof: 'http://www.opengis.net/def/geosparql/function/',
	// 		dct: 'http://purl.org/dc/terms/'
	// 	},
	// 	Blazegraph: {
	// 		bd: 'http://www.bigdata.com/rdf#',
	// 		bds: 'http://www.bigdata.com/rdf/search#',
	// 		gas: 'http://www.bigdata.com/rdf/gas#',
	// 		hint: 'http://www.bigdata.com/queryHints#'
	// 	}
	// };
	RdfNamespaces.NAMESPACE_SHORTCUTS = {
		Europeana: {
			edm: 'http://www.europeana.eu/schemas/edm/'
		},
		W3C: {
			dqv: 'http://www.w3.org/ns/dqv#',
			odrl: 'http://www.w3.org/ns/odrl/2/',
			owl: 'http://www.w3.org/2002/07/owl#',
			rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
			rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
			skos: 'http://www.w3.org/2004/02/skos/core#',
			wgs84pos: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
			xsd: 'http://www.w3.org/2001/XMLSchema#'
		},
		'Other': {
			cc: 'http://creativecommons.org/ns#',
			dc: 'http://purl.org/dc/elements/1.1/',
			dcterms: 'http://purl.org/dc/terms/',
			ebucore: 'http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#',
			foaf: 'http://xmlns.com/foaf/0.1/',
			ore: 'http://www.openarchives.org/ore/terms/',
			rdaGr2: 'http://rdvocab.info/ElementsGr2/',
			scvs: 'http://rdfs.org/sioc/services#'
		}
	};

	// RdfNamespaces.ENTITY_TYPES = {
	// 	'http://www.wikidata.org/prop/direct/': 'property',
	// 	'http://www.wikidata.org/prop/direct-normalized/': 'property',
	// 	'http://www.wikidata.org/prop/': 'property',
	// 	'http://www.wikidata.org/prop/novalue/': 'property',
	// 	'http://www.wikidata.org/prop/statement/': 'property',
	// 	'http://www.wikidata.org/prop/statement/value/': 'property',
	// 	'http://www.wikidata.org/prop/statement/value-normalized/': 'property',
	// 	'http://www.wikidata.org/prop/qualifier/': 'property',
	// 	'http://www.wikidata.org/prop/qualifier/value/': 'property',
	// 	'http://www.wikidata.org/prop/qualifier/value-normalized/': 'property',
	// 	'http://www.wikidata.org/prop/reference/': 'property',
	// 	'http://www.wikidata.org/prop/reference/value/': 'property',
	// 	'http://www.wikidata.org/prop/reference/value-normalized/': 'property',
	// 	'http://www.wikidata.org/wiki/Special:EntityData/': 'item',
	// 	'http://www.wikidata.org/entity/': 'item'
	// };
	RdfNamespaces.ENTITY_TYPES = {
	};


	RdfNamespaces.ALL_PREFIXES = $.map( RdfNamespaces.NAMESPACE_SHORTCUTS, function ( n ) {
		return n;
	} ).reduce( function ( p, v, i ) {
		return $.extend( p, v );
	}, {} );

	// RdfNamespaces.STANDARD_PREFIXES = {
	// 	wd: 'PREFIX wd: <http://www.wikidata.org/entity/>',
	// 	wdt: 'PREFIX wdt: <http://www.wikidata.org/prop/direct/>',
	// 	wikibase: 'PREFIX wikibase: <http://wikiba.se/ontology#>',
	// 	p: 'PREFIX p: <http://www.wikidata.org/prop/>',
	// 	ps: 'PREFIX ps: <http://www.wikidata.org/prop/statement/>',
	// 	pq: 'PREFIX pq: <http://www.wikidata.org/prop/qualifier/>',
	// 	rdfs: 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>',
	// 	bd: 'PREFIX bd: <http://www.bigdata.com/rdf#>'
	// };
	RdfNamespaces.STANDARD_PREFIXES = {
		cc: 'PREFIX cc: <http://creativecommons.org/ns#>',
		ds: 'PREFIX dc: <http://purl.org/dc/elements/1.1/>',
		dcterms: 'PREFIX dcterms: <http://purl.org/dc/terms/>',
		dqv: 'PREFIX dqv: <http://www.w3.org/ns/dqv#>',
		ebucore: 'PREFIX ebucore: <http://www.ebu.ch/metadata/ontologies/ebucore/ebucore#>',
		edm: 'PREFIX edm: <http://www.europeana.eu/schemas/edm/>',
		foaf: 'PREFIX foaf: <http://xmlns.com/foaf/0.1/>',
		odrl: 'PREFIX odrl: <http://www.w3.org/ns/odrl/2/>',
		ore: 'PREFIX ore: <http://www.openarchives.org/ore/terms/>',
		owl: 'PREFIX owl: <http://www.w3.org/2002/07/owl#>',
		rdaGr2: 'PREFIX rdaGr2: <http://rdvocab.info/ElementsGr2/>',
		rdf: 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>',
		rdfs: 'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>',
		scvs: 'PREFIX scvs: <http://rdfs.org/sioc/services#>',
		skos: 'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>',
		wgs84pos: 'PREFIX wgs84_pos: <http://www.w3.org/2003/01/geo/wgs84_pos#>',
		xsd: 'PREFIX xsd: <http://www.w3.org/2001'
	};

	RdfNamespaces.addPrefixes = function( prefixes ) {
		$.extend( RdfNamespaces.ALL_PREFIXES, prefixes );
	};

	RdfNamespaces.getPrefixMap = function ( entityTypes ) {
		var prefixes = {};
		$.each( RdfNamespaces.ALL_PREFIXES, function ( prefix, url ) {
			if ( entityTypes[url] ) {
				prefixes[prefix] = entityTypes[url];
			}
		} );
		return prefixes;
	};

} )( jQuery, wikibase.queryService.RdfNamespaces );
