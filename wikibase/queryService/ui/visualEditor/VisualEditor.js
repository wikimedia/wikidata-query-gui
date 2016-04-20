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
	 */
	function SELF( api ) {
		this._api = api;

		if ( !this._api ) {
			this._api = new wikibase.queryService.api.Wikibase();
		}
	}

	/**
	 * @property {wikibase.queryService.api.Wikibase}
	 * @private
	 */
	SELF.prototype._api = null;

	/**
	 * @property {Function}
	 * @private
	 */
	SELF.prototype._changeListener = null;

	/**
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._query = null;

	/**
	 * @property {Array}
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

		var parser = new sparqljs.Parser( wikibase.queryService.RdfNamespaces.ALL_PREFIXES );
		this._query = parser.parse( query );
	};

	/**
	 * Get the SPARQL query string
	 *
	 * @return {string}
	 */
	SELF.prototype.getQuery = function() {
		try {
			var q = new sparqljs.Generator().stringify( this._query );
			q = this._queryComments.join( '\n' ) + '\n' + q;
			return q;
		} catch ( e ) {
			return null;
		}
	};

	/**
	 * Draw visual editor to given element
	 *
	 * @param {jQuery} $element
	 */
	SELF.prototype.draw = function( $element ) {
		this._extractTriples();
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
			return this._labels[ key ];
		}

		return $.i18n( I18N_PREFIX + key );
	};

	/**
	 * @private
	 */
	SELF.prototype._getHtml = function() {
		var self = this;
		var $html = $( '<div>' ), $find = $( '<div>' ).text( this._i18n( 'find' ) + ' ' ),
			$show = $( '<div>' ).text( this._i18n( 'show' ) + ' ' ), $spacer = $( '<div>' ).addClass( 'spacer' );

		$html.append( $find, $spacer, $show );

		$.each( this._triples, function( k, triple ) {
			if ( self._isNotRelevant( triple ) ) {
				return;
			}

			if ( self._isInShowSection( triple ) ) {
				if ( $show.children().length > 0 ) {
					$show.append( ', ' );
				}
				$show.append( self._getTripleHtml( triple ) );
				return;
			}
			if ( $find.children().length > 0 ) {
				if ( $find.children().length === 1 ) {
					$find.append( ' ' + self._i18n( 'with' ) + ' ' );
				} else {
					$find.append( ' ' + self._i18n( 'and' ) + ' ' );
				}
			}
			$find.append( self._getTripleHtml( triple ) );

		} );

		$find.prepend( '<span class="glyphicon glyphicon-search" aria-hidden="true"></span>', ' ' );
		$show
				.prepend( '<span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span>',
						' ' );

		if ( $find.children().length === 1 ) {
			$find.append( ' ' + this._i18n( 'anything' ) + ' ' );
		}
		if ( $show.children().length === 1 ) {
			$show.remove();
		}

		return $html;
	};

	/**
	 * @private
	 */
	SELF.prototype._isNotRelevant = function( triple ) {

		if ( FILTER_PREDICATES[triple.predicate] ) {
			return true;
		}

		if ( this._isSimpleMode && this._query.variables[0] !== '*' &&
				this._isInShowSection( triple ) && this._isVariableSelected( triple.object ) ) {
			return true;
		}

		return false;
	};

	/**
	 * @private
	 */
	SELF.prototype._isVariableSelected = function( variable ) {

		var isSelected = false;
		$.each( this._query.variables, function( k, v ) {

			if ( v.variable && v.variable === variable ) {
				isSelected = true;
				return false;
			}

			if ( v === variable ) {
				isSelected = true;
				return false;
			}

		} );

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
		$.each( this._triples,
				function( k, triple ) {
					// Must match ?value wdt:Pxx ?item
					if ( self._isVariable( triple.subject ) &&
							self._isVariable( triple.object ) === false ) {
						boundVariables[triple.subject] = true;
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
				$path.append( ' ' + this._i18n( 'or' ) + ' ' + this._i18n( 'subtype' ) + ' ' );
			}
			if ( path.pathType === '*' ) {
				$path.append( ' ' + this._i18n( 'any' ) + ' ' );
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

			self._valuleChanger( $link ).done( function( selectedId ) {
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
	SELF.prototype._extractTriples = function( object ) {
		if ( !object ) {
			object = this._query.where;
			this._triples = [];
		}

		var self = this;
		$.each( object, function( key, value ) {

			if ( value.triples && value.type && value.type === 'bgp' ) {

				$.each( value.triples, function( k, triple ) {
					self._triples.push( triple );
				} );
			}

			if ( value.type && value.type === 'service' ) {
				return;
			}

			if ( typeof value === 'object' ) {
				self._extractTriples( value );
			}
		} );

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

	/**
	 * @private
	 */
	SELF.prototype._valuleChanger = function( $element ) {
		var deferred = $.Deferred();

		// TODO Use only one instance and make that instance injectable
		var $selector = new wikibase.queryService.ui.visualEditor.SelectorBox( $element, this._api );

		$selector.setChangeListener( function( id ) {
			deferred.resolve( id );
		} );

		return deferred;
	};

	return SELF;
}( jQuery, wikibase ) );
