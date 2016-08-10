var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.QuerySamples = ( function ( $ ) {
	'use strict';

	var API_ENDPOINT = 'https://www.mediawiki.org/w/api.php';
	var PAGE_URL = 'https://www.mediawiki.org/wiki/Wikibase/Indexing/SPARQL_Query_Examples';
	var PAGE_TITLE = 'Wikibase/Indexing/SPARQL_Query_Examples';

	/**
	 * QuerySamples API for the Wikibase query service
	 *
	 * @class wikibase.queryService.api.QuerySamples
	 * @license GNU GPL v2+
	 *
	 * @author Stanislav Malyshev
	 * @author Jonas Kress
	 * @constructor
	 */
	function SELF() {
	}

	/**
	 * @return {jQuery.Promise} Object taking list of example queries { title:, query: }
	 */
	SELF.prototype.getExamples = function () {

		var deferred = $.Deferred(),
			self = this;

		$.ajax(
				{
					url: API_ENDPOINT + '?action=query&prop=revisions&titles=' + encodeURIComponent( PAGE_TITLE ) + '&rvprop=content',
					data: {
						format: 'json'
					},
					dataType: 'jsonp'
				} )
		.done(
				function ( data ) {
					var wikitext = data.query.pages[Object.keys( data.query.pages )].revisions[0]['*'];
					wikitext = wikitext.replace( /\{\{!\}\}/g, '|' );

					deferred.resolve( self._extract( wikitext ) );
				} );

		return deferred;
	};

	/**
	 * @private
	 */
	SELF.prototype._extract = function ( wikitext ) {
		var self = this,
			examples = [],
			regexSection = /^==([^=]+)==$/gm,
			section = '',
			sectionHeader = null;

		wikitext.split( '\n' ).forEach( function( line ) {
			if ( line.match( regexSection ) ) {
				examples = $.merge( examples, self._extractExamples( section, sectionHeader ) );
				sectionHeader = line.replace( /=/g, '' ).trim();
				section = '';
			} else {
				section += line + '\n';
			}
		} );
		examples = $.merge( examples, self._extractExamples( section, sectionHeader ) );

		return examples;
	};

	/**
	 * @private
	 */
	SELF.prototype._extractExamples = function ( section, sectionHeader ) {
		var regexParagraph = /(?:[\=]+)([^\=]*)(?:[\=]+)\n(?:[]*?)(?:[^=]*?)({{SPARQL\s*\|[\s\S]*?}}\n){1}/g,
			regexQuery = /query\s*\=([^]+)(?:}}|\|)/,
			regexExtraPrefix = /extraprefix\s*\=([^]+?)(?:\||}})+/,
			regexTags = /{{Q\|([^]+?)\|([^]+?)}}+/g,
			m,
			examples = [];

		while ( ( m = regexParagraph.exec( section ) ) !== null ) {
			var paragraph = m[0], title = m[1].trim(), tags = [], tag,
				href = PAGE_URL + '#' +	encodeURIComponent( title.replace( / /g, '_' ) ).replace( /%/g, '.' ),
				sparqlTemplate = m[2],
				query = sparqlTemplate.match( regexQuery )[1].trim();

			if ( sparqlTemplate.match( regexExtraPrefix ) ) {
				query = sparqlTemplate.match( regexExtraPrefix )[1] + '\n\n' + query;
			}
			if ( paragraph.match( regexTags ) ) {
				while ( ( tag = regexTags.exec( paragraph ) ) !== null ) {
					tags.push( tag[2].trim() + ' (' + tag[1].trim() + ')' );
				}
			}

			examples.push( {
				title: title,
				query: query,
				href: href,
				tags: tags,
				category: sectionHeader
			} );
		}

		return examples;
	};

	return SELF;

}( jQuery ) );
