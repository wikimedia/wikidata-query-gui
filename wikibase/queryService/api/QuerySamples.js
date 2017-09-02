var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.QuerySamples = ( function ( $ ) {
	'use strict';

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
	function SELF( language ) {
		this._language = language;
		this._apiServer = 'https://www.wikidata.org/';
		this._apiEndpoint = this._apiServer + 'api/rest_v1/page/html/';
		this._pageTitle = 'Wikidata:SPARQL_query_service/queries/examples';
		this._pageUrl = this._apiServer + 'wiki/' + this._pageTitle;
	}

	/**
	 * @type {string}
	 * @private
	 */
	SELF.prototype._language = null;

	/**
	 * @return {jQuery.Promise} Object taking list of example queries { title:, query: }
	 */
	SELF.prototype.getExamples = function () {
		var self = this;

		return $.ajax( {
			url: self._apiEndpoint + encodeURIComponent( self._pageTitle + '/' + self._language ) + '?redirect=false',
			dataType: 'html'
		} ).catch( function() {
			// retry without language
			return $.ajax( {
				url: self._apiEndpoint + encodeURIComponent( self._pageTitle ) + '?redirect=false',
				dataType: 'html'
			} );
		} ).then( function ( data ) {
			return self._parseHTML( data );
		} );
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
	 * @param {string} selector
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

	SELF.prototype._extractTagsFromSPARQL = function ( sparql ) {
		var tags = sparql.match( /\b[QP]\d+\b/g );

		if ( !tags ) {
			return [];
		}

		return tags;
	};

	SELF.prototype._parseHTML = function ( html ) {
		var div = document.createElement( 'div' ),
			self = this;
		div.innerHTML = html;
		// Find all SPARQL Templates
		var examples = $( div ).find( '[data-mw]' ).map( function() {
			var $this = $( this ),
				dataMW = $this.attr( 'data-mw' );
			if ( !dataMW ) {
				return;
			}

			var data = JSON.parse( dataMW ),
				templateHref,
				query;

			if ( data.parts && data.parts[0].template ) {
				templateHref = data.parts[0].template.target.href;
				if ( templateHref === './Template:SPARQL' || templateHref === './Template:SPARQL2' ) {
					// SPARQL/SPARQL2 template
					query = data.parts[0].template.params.query.wt;
				} else {
					return null;
				}
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

			return {
				title:    title,
				query:    query,
				href:     self._pageUrl + '#' + encodeURIComponent( title.replace( / /g, '_' ) ).replace( /%/g, '.' ),
				tags:     self._extractTagsFromSPARQL( query ),
				category: self._findPrevHeader( titleEl ).text().trim()
			};
		} ).get();
		// group by category
		return _.flatten( _.toArray( _.groupBy( examples, 'category' ) ) );
	};

	/**
	 * Set the language for the query samples.
	 *
	 * @param {string} language
	 */
	SELF.prototype.setLanguage = function( language ) {
		this._language = language;
	};

	/**
	 * Get the language for the query samples.
	 *
	 * @return {string} language
	 */
	SELF.prototype.getLanguage = function() {
		return this._language;
	};
	return SELF;

}( jQuery ) );
