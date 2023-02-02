var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.RdfNamespaces = {};

( function ( $, RdfNamespaces ) {
	'use strict';

	var RDF_NAMESPACES_JSON = 'europeana/rdf-namespace-shortcuts.json';
	var RDF_STANDARD_PREFIXES = 'europeana/rdf-standard-prefixes.json';
	
	//a synchronous read from a json file (replaced the previous constant definition).
	$.ajax({
	  url: RDF_STANDARD_PREFIXES,
	  async: false,
	  dataType: 'json',
	  success: function (response) {
		RdfNamespaces.STANDARD_PREFIXES = response;
	  }
	});
		
	$.ajax({
	  url: RDF_NAMESPACES_JSON,
	  async: false,
	  dataType: 'json',
	  success: function (response) {
		RdfNamespaces.NAMESPACE_SHORTCUTS = response;
		RdfNamespaces.ALL_PREFIXES = $.map( RdfNamespaces.NAMESPACE_SHORTCUTS, function ( n ) {
				return n;
			} ).reduce( function ( p, v, i ) {
				return $.extend( p, v );
			}, {} );
	  }
	});	

	RdfNamespaces.ENTITY_TYPES = {
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