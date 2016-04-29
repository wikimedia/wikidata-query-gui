var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.visualEditor = wikibase.queryService.ui.visualEditor || {};

wikibase.queryService.ui.visualEditor.VisualEditor = ( function( $, wikibase ) {
	'use strict';

	var FILTER_PREDICATES = {
		'http://www.w3.org/2000/01/rdf-schema#label': true,
		'http://schema.org/description': true,
		'http://www.bigdata.com/queryHints#optimizer': true,
		'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': true
	};

	var I18N_PREFIX = 'wdqs-ve-';

	/**
	 * A visual SPARQL editor for the Wikibase query service
	 *
	 * @class wikibase.queryService.ui.visualEditor.VisualEditor
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 * @param {wikibase.queryService.api.Wikibase} api
	 * @param {wikibase.queryService.ui.visualEditor.SelectorBox} selectorBox
	 */
	function SELF( api, selectorBox ) {
		this._api = api;

		if ( !this._api ) {
			this._api = new wikibase.queryService.api.Wikibase();
		}

		this._selectorBox = selectorBox;
		if ( !this._selectorBox ) {
			this._selectorBox = new wikibase.queryService.ui.visualEditor.SelectorBox( this._api );
		}

		this._query = new wikibase.queryService.ui.visualEditor.SparqlQuery();
	}

	/**
	 * @property {wikibase.queryService.api.Wikibase}
	 * @private
	 */
	SELF.prototype._api = null;

	/**
	 * @property {wikibase.queryService.ui.visualEditor.SelectorBox}
	 * @private
	 */
	SELF.prototype._selectorBox = null;

	/**
	 * @property {Function}
	 * @private
	 */
	SELF.prototype._changeListener = null;

	/**
	 * @property {wikibase.queryService.ui.visualEditor.SparqlQuery}
	 * @private
	 */
	SELF.prototype._query = null;

	/**
	 * @property {string[]}
	 * @private
	 */
	SELF.prototype._queryComments = null;

	/**
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._triples = [];

	/**
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._isSimpleMode = false;

	/**
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._labels = {
		find: 'Find',
		show: 'Show',
		anything: 'anything',
		'with': 'with',
		and: 'and',
		any: 'any',
		or: 'or',
		subtype: 'subtype'
	};

	/**
	 * Set the SPARQL query string
	 *
	 * @param {string} query SPARQL query string
	 */
	SELF.prototype.setQuery = function( query ) {
		var self = this;
		this._queryComments = [];
		$.each( query.split( '\n' ), function( k, v ) {
			if ( v.indexOf( '#' ) === 0 ) {
				self._queryComments.push( v );
			}
		} );

		var prefixes = wikibase.queryService.RdfNamespaces.ALL_PREFIXES;
		this._query.parse( query, prefixes );
	};

	/**
	 * Get the SPARQL query string
	 *
	 * @return {string|null}
	 */
	SELF.prototype.getQuery = function() {
		try {
			var q = this._query.getQueryString();
			q = this._cleanQueryPrefixes( q ).trim();
			q = this._queryComments.join( '\n' ) + '\n' + q;
			return q.trim();
		} catch ( e ) {
			return null;
		}
	};

	/**
	 * Workaround for https://phabricator.wikimedia.org/T133316
	 *
	 * @private
	 */
	SELF.prototype._cleanQueryPrefixes = function( query ) {
		var prefixRegex = /PREFIX ([a-z]+): <(.*)>/gi, m;
		var prefixes = {}, cleanQuery = query.replace( prefixRegex, '' ).trim();

		while ( ( m = prefixRegex.exec( query ) ) ) {
			var prefix = m[1];
			var uri = m[2].replace( /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&' );

			var newQuery = cleanQuery.replace( new RegExp( '<' + uri + '([^/>#]+?)>', 'gi' ), prefix +
					':$1' );

			if ( cleanQuery !== newQuery ) {
				cleanQuery = newQuery;
				if ( !wikibase.queryService.RdfNamespaces.STANDARD_PREFIXES[prefix] ) {
					prefixes[m[0]] = true;
				}
			}
		}

		cleanQuery = Object.keys( prefixes ).join( '\n' ) + '\n\n' + cleanQuery.trim();
		return cleanQuery;
	};
	/**
	 * Draw visual editor to given element
	 *
	 * @param {jQuery} $element
	 */
	SELF.prototype.draw = function( $element ) {

		this._triples = this._query.getTriples();
		var subqueries = this._query.getSubQueries();
		while ( subqueries.length > 0 ) {
			var q = subqueries.pop();
			this._triples = this._triples.concat( q.getTriples() );
			subqueries.concat( q.getSubQueries() );
		}

		this._isSimpleMode = this._isSimpleQuery();
		$element.html( this._getHtml() );
	};

	/**
	 * Set the change listener
	 *
	 * @param {Function} listener a function called when query changed
	 */
	SELF.prototype.setChangeListener = function( listener ) {
		this._changeListener = listener;
	};

	/**
	 * @private
	 */
	SELF.prototype._i18n = function( key ) {

		if ( !$.i18n ) {
			return this._labels[key];
		}

		return $.i18n( I18N_PREFIX + key );
	};

	/**
	 * @private
	 */
	SELF.prototype._getHtml = function() {
		var self = this;
		var $html = $( '<div>' ), $find = this._getFindSection(), $show = this._getShowSection(), $spacer = $(
				'<div>' ).addClass( 'spacer' );

		$html.append( $find, $spacer, $show );

		$.each( this._triples, function( k, triple ) {
			if ( self._isNotRelevant( triple.triple ) ) {
				return;
			}

			if ( self._isInShowSection( triple.triple ) ) {
				if ( $show.children().length > 1 ) {
					$show.append( ', ' );
				}
				$show.append( self._getTripleHtml( triple.triple ) );
				return;
			}
			if ( $find.children().length > 1 ) {
				if ( $find.children().length === 2 ) {
					$find.append( ' ' + self._i18n( 'with' ) + ' ' );
				} else {
					$find.append( ' ' + self._i18n( 'and' ) + ' ' );
				}
			}
			$find.append( self._getTripleHtml( triple.triple ) );

		} );

		if ( $find.children().length === 1 ) {
			$find.append( ' ' + this._i18n( 'anything' ) + ' ' );
		}

		return $html;
	};

	/**
	 * @private
	 */
	SELF.prototype._getFindSection = function() {
		var $findSection = $( '<div>' );
		// Show link
		var $link = $( '<a class="btn btn-default">' ).text( this._i18n( 'find' ) );
		$link.attr( 'href', '#' ).prepend(
				'<span class="glyphicon glyphicon-search" aria-hidden="true"></span>', ' ' )
				.tooltip( {
					title: 'Click to add new item'
				} ).attr( 'data-type', 'item' ).attr( 'data-auto_open', true );

		// SelectorBox
		var self = this;
		this._selectorBox.add( $link, function( id, name ) {
			var entity = 'http://www.wikidata.org/entity/' + id;// FIXME technical debt

			var variable = self._query.getBoundVariables().shift();
			if ( !variable ) {
				variable = '?' + '_' + Math.floor( Math.random() * 9999 );
			}

			var prop = 'http://www.wikidata.org/prop/direct/P31';// FIXME technical debt
			var triple = self._query.addTriple( variable, prop, entity, false );

			if ( $findSection.children().length === 2 ) {
				$findSection.append( ' ' + self._i18n( 'with' ) + ' ' );
			} else {
				$findSection.append( ' ' + self._i18n( 'and' ) + ' ' );
			}
			$findSection.append( self._getTripleHtml( triple ) );

			if ( self._changeListener ) {
				self._changeListener( self );
			}
		} );

		return $findSection.append( $link, ' ' );
	};

	/**
	 * @private
	 */
	SELF.prototype._getShowSection = function() {
		var $showSection = $( '<div>' );
		// Show link
		var $link = $( '<a class="btn btn-default">' ).text( this._i18n( 'show' ) );
		$link.attr( 'href', '#' ).prepend(
				'<span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span>', ' ' )
				.tooltip( {
					title: 'Click to add new property'
				} ).attr( 'data-type', 'property' ).attr( 'data-auto_open', true );

		// SelectorBox
		var self = this;
		this._selectorBox.add( $link, function( id, name ) {
			var prop = 'http://www.wikidata.org/prop/direct/' + id;// FIXME technical debt

			var subject = self._query.getBoundVariables().shift();
			if ( !subject ) {
				return;
			}
			var variable2 = '?_' + name.replace( / /gi, '_' );// FIXME generate nice variable that does collide with
																// existing
			var triple = self._query.addTriple( subject, prop, variable2, true );
			self._query.addVariable( variable2 );

			if ( $showSection.children().length > 2 ) {
				$showSection.append( ', ' );
			}
			$showSection.append( self._getTripleHtml( triple ) );

			if ( self._changeListener ) {
				self._changeListener( self );
			}
		} );

		return $showSection.append( $link, ' ' );
	};

	/**
	 * @private
	 */
	SELF.prototype._isNotRelevant = function( triple ) {

		if ( FILTER_PREDICATES[triple.predicate] ) {
			return true;
		}

		if ( this._isSimpleMode && this._isInShowSection( triple ) &&
				this._query.hasVariable( triple.object ) === false ) {
			return true;
		}

		return false;
	};

	/**
	 * @private
	 */
	SELF.prototype._isInShowSection = function( triple ) {

		// Must match ?value wdt:Pxx ?item
		if ( this._isVariable( triple.subject ) && this._isVariable( triple.object ) ) {
			return true;
		}

		return false;
	};

	/**
	 * @private
	 */
	SELF.prototype._getTripleHtml = function( triple ) {
		var self = this;

		var $triple = $( '<span>' );
		$.each( triple, function( k, entity ) {

			if ( self._isSimpleMode && self._isVariable( entity ) ) {
				return;
			}

			if ( entity.type && entity.type === 'path' ) {
				$triple.append( self._getTripleEntityPathHtml( entity ), ' ' );
			} else {
				$triple.append( self._getTripleEntityHtml( entity, triple, k ), ' ' );
			}
		} );

		return $triple;
	};

	/**
	 * @private
	 */
	SELF.prototype._isVariable = function( entity ) {
		if ( typeof entity === 'string' && entity.startsWith( '?' ) ) {
			return true;
		}
		return false;
	};

	/**
	 * @private
	 */
	SELF.prototype._isSimpleQuery = function() {
		var boundVariables = {};

		var self = this;
		$.each( this._triples, function( k, t ) {
			// Must match ?value wdt:Pxx ?item
			if ( self._isVariable( t.triple.subject ) &&
					self._isVariable( t.triple.object ) === false ) {
				boundVariables[t.triple.subject] = true;
			}

		} );

		if ( Object.keys( boundVariables ).length > 1 ) {
			return false;
		}

		return true;
	};

	/**
	 * @private
	 */
	SELF.prototype._getTripleEntityPathHtml = function( path ) {
		var self = this, $path = $( '<span>' );
		$.each( path.items, function( k, v ) {
			if ( v.type && v.type === 'path' ) {
				$path.append( self._getTripleEntityPathHtml( v ) );
				return;
			}

			if ( k > 0 && path.pathType === '/' ) {
				$path.append( ' ' + self._i18n( 'or' ) + ' ' + self._i18n( 'subtype' ) + ' ' );
			}
			if ( path.pathType === '*' ) {
				$path.append( ' ' + self._i18n( 'any' ) + ' ' );
			}

			$path.append( self._getTripleEntityHtml( v, path.items, k ) );

		} );

		return $path;
	};

	/**
	 * @private
	 */
	SELF.prototype._getTripleEntityHtml = function( entity, triple, key ) {
		var $label = $( '<span>' );

		var self = this;
		this._getLabel( entity ).done( function( label, id, description, type ) {
			var $link = $( '<a>' ).attr( 'href', '#' );
			$link.text( label );
			$link.attr( 'data-type', type );
			$link.attr( 'data-id', id );
			$link.appendTo( $label );

			$label.tooltip( {
				'title': '(' + id + ') ' + description
			} );
			$( $label ).on( 'show.bs.tooltip', function() {
				if ( $( '.tooltip' ).is( ':visible' ) ) {
					$( '.tooltip' ).not( this ).hide();
				}
			} );

			self._selectorBox.add( $link, function( selectedId ) {
				var newEntity = entity.replace( new RegExp( id + '$' ), '' ) + selectedId;// TODO: technical debt

				$label.replaceWith( self._getTripleEntityHtml( newEntity, triple, key ) );
				triple[key] = newEntity;

				if ( self._changeListener ) {
					self._changeListener( self );
				}
			} );

		} ).fail( function() {
			$label.text( entity );
		} );

		return $label;
	};

	/**
	 * @private
	 */
	SELF.prototype._getLabel = function( url ) {
		var deferred = $.Deferred();

		var entity = url.match( /(Q|P)([0-9]+)/ );// TODO: make use of Rdf namespaces
		if ( !entity ) {
			return deferred.reject().promise();
		}

		var type = {
			P: 'property',
			Q: 'item'
		};
		type = type[entity[1]];
		var term = entity[0];

		this._api.searchEntities( term, type ).done( function( data ) {
			$.each( data.search, function( key, value ) {
				deferred.resolve( value.label, value.id, value.description, type );
				return false;
			} );
		} );

		return deferred.promise();
	};

	return SELF;
}( jQuery, wikibase ) );
