var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.QuerySamples = ( function ( $ ) {
	'use strict';

	var API_SERVER = 'https://www.wikidata.org/';
	var API_ENDPOINT = API_SERVER + 'api/rest_v1/page/html/';
	var PAGE_TITLE = 'Wikidata:SPARQL query service/queries/examples';
	var PAGE_URL = API_SERVER + 'wiki/' + PAGE_TITLE;

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
				url: API_ENDPOINT + encodeURIComponent( PAGE_TITLE ) + '?redirect=false',
				dataType: 'html'
			}
		).done(
			function ( data ) {
				deferred.resolve( self._parseHTML( data ) );
			}
		);

		return deferred;
	};

	/**
	 * Find closest header element one higher than this one
	 *
	 * @param {Element} element Header element
	 * @return {null|Element} Header element
     * @private
     */
	SELF.prototype._findPrevHeader = function ( element ) {
		var tag = element.prop( 'tagName' );
		if ( tag[0] !== 'H' && tag[0] !== 'h' ) {
			return null;
		}
		return this._findPrev( element, 'h' + ( tag.substr( 1 ) - 1 ) );
	};

	/**
	 * Find previous element matching the selector
	 *
	 * @param {Element} element
	 * @param {String} selector
	 * @return {Element}
     * @private
     */
	SELF.prototype._findPrev = function ( element, selector ) {
		var prev = element.prev().filter( selector );
		if ( prev.length > 0 ) {
			return prev;
		}
		prev = element.prevUntil( selector ).last().prev();
		if ( prev.length > 0 ) {
			return prev;
		}
		prev = element.parent().prev().filter( selector );
		return prev;
	};

	/**
	 * Get list of tags from UL list
	 *
	 * @param {Element} tagUL
	 * @return {String[]}
     * @private
     */
	SELF.prototype._extractTagsFromUL = function( tagUL ) {
		return tagUL.find( 'a[rel="mw:WikiLink"]' ).map( function() { return $( this ).text().trim(); } ).get();
	};

	SELF.prototype._parseHTML = function ( html ) {
		var div = document.createElement( 'div' ),
			self = this;
		div.innerHTML = html;
		// Find all SPARQL Templates
		var examples = $( div ).find( 'div.mw-highlight' ).map( function() {
			var $this = $( this ),
				dataMW = $this.attr( 'data-mw' );
			if ( !dataMW ) {
				return;
			}

			var data = JSON.parse( dataMW );
			var query;

			if ( data.parts && data.parts[0].template.target.href === './Template:SPARQL' ) {
				// SPARQL template
				query = data.parts[0].template.params.query.wt;
			} else if ( data.body ) {
				// SPARQL2 template
				query = data.body.extsrc;
			} else {
				return null;
			}
			// Fix {{!}} hack
			query = query.replace( /\{\{!}}/g, '|' );

			// Find preceding title element
			var titleEl = self._findPrev( $this, 'h2,h3,h4,h5,h6,h7' );
			if ( !titleEl || !titleEl.length ) {
				return null;
			}
			var title = titleEl.text().trim();
			// Get UL elements between header and query text
			var tagUL = $this.prevUntil( titleEl ).filter( 'ul' );

			return {
				title:    title,
				query:    query,
				href:     PAGE_URL + '#' + encodeURIComponent( title.replace( / /g, '_' ) ).replace( /%/g, '.' ),
				tags:     self._extractTagsFromUL( tagUL ),
				category: self._findPrevHeader( titleEl ).text().trim()
			};

		} ).get();
		// group by category
		return _.flatten( _.toArray( _.groupBy( examples, 'category' ) ) );
	};

	return SELF;

}( jQuery ) );
