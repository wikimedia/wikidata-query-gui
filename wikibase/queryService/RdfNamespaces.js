var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.RdfNamespaces = {};

( function ( $, RdfNamespaces ) {
	'use strict';

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
		Other: {
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

	RdfNamespaces.ENTITY_TYPES = {
	};

	RdfNamespaces.ALL_PREFIXES = $.map( RdfNamespaces.NAMESPACE_SHORTCUTS, function ( n ) {
		return n;
	} ).reduce( function ( p, v, i ) {
		return $.extend( p, v );
	}, {} );

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