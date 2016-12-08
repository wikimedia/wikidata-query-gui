var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.visualEditor = wikibase.queryService.ui.visualEditor || {};

wikibase.queryService.ui.visualEditor.SelectorBox = ( function( $, wikibase ) {
	'use strict';

	var I18N_PREFIX = 'wdqs-ve-sb';

/*jshint multistr: true */
	var SPARQL_QUERY_SEARCH = {
			item: {
				suggest: null,
// Disable for now as requested by Smalyshev
//				suggest:// Find items that are most often used with a specifc property
//					'SELECT ?id ?label ?description WHERE {\
//							{\
//								SELECT ?id (COUNT(?id) AS ?count) WHERE { ?i <{PROPERTY_URI}> ?id. }\
//								GROUP BY ?id\
//							}\
//						?id rdfs:label ?label.\
//						?id schema:description ?description.\
//						FILTER((LANG(?label)) = "{LANGUAGE}")\
//						FILTER((LANG(?description)) = "{LANGUAGE}")\
//					}\
//					ORDER BY DESC(?count)\
//					LIMIT 20',
				search: null,
// Disable for now as requested by Smalyshev
//					'SELECT ?id ?label ?description WHERE {\
//						hint:Query hint:optimizer "None".\
//							{\
//								SELECT DISTINCT ?id WHERE { ?i <{PROPERTY_URI}> ?id. }\
//							}\
//						?id rdfs:label ?label.\
//						?id schema:description ?description.\
//						FILTER((LANG(?label)) = "{LANGUAGE}")\
//						FILTER((LANG(?description)) = "{LANGUAGE}")\
//						FILTER(STRSTARTS(LCASE(?label), LCASE("{TERM}")))\
//					}\
//					LIMIT 20',
//				LIMIT 20',
				instanceOf: null
// Disable for now as requested by Smalyshev
//				instanceOf:// Find items that are most often used with property 'instance of'
//					'SELECT ?id ?label ?description WHERE {\
//						{\
//							SELECT ?id (COUNT(?id) AS ?count) WHERE { ?i wdt:P31 ?id. }\
//							GROUP BY ?id\
//							ORDER BY DESC(?count)\
//							LIMIT 20\
//						}\
//						?id rdfs:label ?label.\
//						?id schema:description ?description.\
//						FILTER((LANG(?label)) = "en")\
//						FILTER((LANG(?description)) = "en")\
//					}\
//					ORDER BY DESC(?count)'
		},
		property: {
			suggest: null,
// Disable for now as requested by Smalyshev
//			suggest:// Find properties that are most often used with a specific item
//				'SELECT ?id ?label ?description WHERE {\
//					{\
//						SELECT ?id (COUNT(?id) AS ?count) WHERE {\
//						?i ?prop <{ITEM_URI}>.\
//						?id ?x ?prop.\
//						?id rdf:type wikibase:Property.\
//						}\
//						GROUP BY ?id\
//					}\
//				?id rdfs:label ?label.\
//				?id schema:description ?description.\
//				FILTER((LANG(?label)) = "{LANGUAGE}")\
//				FILTER((LANG(?description)) = "{LANGUAGE}")\
//				}\
//				ORDER BY DESC(?count)\
//				LIMIT 20',
			genericSuggest: null,
// Disable for now as requested by Smalyshev
//			genericSuggest:// Find properties that are most often used with all items
//				'SELECT ?id ?label ?description WITH {\
//					SELECT ?pred (COUNT(?value) AS ?count) WHERE\
//					{\
//					?subj ?pred ?value .\
//					} GROUP BY ?pred ORDER BY DESC(?count) LIMIT 1000\
//					} AS %inner\
//				WHERE {\
//					INCLUDE %inner\
//					?id wikibase:claim ?pred.\
//					?id rdfs:label ?label.\
//					?id schema:description ?description.\
//					FILTER((LANG(?label)) = "en")\
//					FILTER((LANG(?description)) = "en")\
//				} ORDER BY DESC(?count)\
//				LIMIT 20',
			search: null,
//			search:// Find properties that are most often used with a specific item and filter with term prefix
//				'SELECT ?id ?label ?description WHERE {\
//					{\
//					SELECT ?id (COUNT(?id) AS ?count) WHERE {\
//						?i ?prop <{ITEM_URI}>.\
//						?id ?x ?prop.\
//						?id rdf:type wikibase:Property.\
//						}\
//						GROUP BY ?id\
//					}\
//				?id rdfs:label ?label.\
//				?id schema:description ?description.\
//				FILTER((LANG(?label)) = "{LANGUAGE}")\
//				FILTER((LANG(?description)) = "{LANGUAGE}")\
//				FILTER(STRSTARTS(LCASE(?label), LCASE("{TERM}")))\
//				}\
//				ORDER BY DESC(?count)\
//				LIMIT 20',
			seeAlso:// Read see also property from a specific property
				'SELECT ?id ?label ?description WHERE {\
					BIND( <{PROPERTY_URI}> as ?prop).\
					?props ?x  ?prop.\
					?props rdf:type wikibase:Property.\
					?props wdt:P1659 ?id.\
					?id rdfs:label ?label.\
					?id schema:description ?description.\
					FILTER((LANG(?label)) = "en")\
					FILTER((LANG(?description)) = "{LANGUAGE}")\
				}'
		}
	};

	/**
	 * A selector box for selecting and changing properties and items
	 *
	 * @class wikibase.queryService.ui.visualEditor.SelectorBox
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 * @param {wikibase.queryService.api.Wikibase} [api]
	 */
	function SELF( api, sparqlApi ) {
		this._api = api || new wikibase.queryService.api.Wikibase();
		this._sparqlApi = sparqlApi || new wikibase.queryService.api.Sparql();
	}

	/**
	 * @property {wikibase.queryService.api.Wikibase}
	 * @private
	 */
	SELF.prototype._api = null;

	/**
	 * @property {wikibase.queryService.api.Sparql}
	 * @private
	 */
	SELF.prototype._sparqlApi = null;

	/**
	 * Add selector box to element
	 *
	 * @param {jQuery} $element
	 * @param {Object} triple
	 * @param {Function} listener a function called when value selected
	 * @param {Object} toolbar {icon:callback}
	 */
	SELF.prototype.add = function( $element, triple, listener, toolbar ) {
		switch ( $element.data( 'type' ).toLowerCase() ) {
		case 'number':
			this._createInput( $element, listener, toolbar );
			break;

		default:
			this._createSelect( $element, triple, listener, toolbar );
		}
	};

	/**
	 * @private
	 */
	SELF.prototype._createInput = function( $element, listener, toolbar ) {
		var $input = $( '<input>' ).attr( 'type', $element.data( 'type' ) ),
			$close = this._getCloseButton(),
			$toolbar = this._getToolbar( toolbar, $element ),
			$content = $( '<div>' ).append( $close, ' ', $input, ' ', $toolbar );

		$element.clickover( {
			placement: 'bottom',
			'global_close': false,
			'html': true,
			'content': function() {
				return $content;
			}
		} ).click( function( e ) {
			$input.val( $element.data( 'value' ) || '' );
		} );

		$input.on( 'keyup mouseup', function() {
			if ( listener ) {
				listener( $input.val() );
			}
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._createSelect = function( $element, triple, listener, toolbar ) {
		var self = this,
			$select = this._getSelectBox( $element ),
			$close = this._getCloseButton(),
			$toolbar = this._getToolbar( toolbar, $element ),
			$content = $( '<div>' ).append( $close, ' ', $select, ' ', $toolbar );

		$element.clickover( {
			placement: 'bottom',
			'global_close': false,
			'html': true,
			'content': function() {
				return $content;
			}
		} ).click( function( e ) {
			$select.toggleClass( 'open' );

			if ( !$select.data( 'select2' ) ) {
				$.proxy( self._renderSelect2( $select, $element, triple ), self );
			}

			if ( $select.hasClass( 'open' ) ) {
				if ( $element.data( 'auto_open' ) ) {
					$select.data( 'select2' ).open();
				}
			}
			return false;
		} );

		$select.change( function( e ) {
			if ( listener ) {
				listener( $select.val(), $select.find( 'option:selected' ).text() );
			}
			$element.click();// hide clickover
			$select.html( '' );
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._getSelectBox = function( $element ) {
		var id = $element.data( 'id' );
		var label = $element.text();

		var $select = $( '<select>' );
		if ( id ) {
			$select.append( $( '<option>' ).attr( 'value', id ).text( label ) );
		}

		return $select;
	};

	/**
	 * @private
	 */
	SELF.prototype._getCloseButton = function() {
		return $( '<a href="#" data-dismiss="clickover">' ).append(
				'<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' );
	};

	/**
	 * @private
	 */
	SELF.prototype._getToolbar = function( toolbar, $element ) {
		var $toolbar = $( '<span>' );

		$.each( toolbar, function( icon, callback ) {
			var $link = $( '<a>' ).attr( 'href', '#' );
			$link.prepend( '<span class="glyphicon glyphicon-' + icon +
					'" aria-hidden="true"></span>', ' ' );

			$link.click( function() {
				if ( callback() ) {
					$element.click();// close popover
				}

				return false;
			} );
			$toolbar.append( $link, ' ' );
		} );

		return $toolbar;
	};

	/**
	 * @private
	 */
	SELF.prototype._createLookupService = function( $element, triple ) {
		var self = this,
			type = $element.data( 'type' );

		return function( params, success, failure ) {
			$.when(
					self._searchEntitiesSparql( params.data.term, type, triple ),
					self._searchEntities( params.data.term, type )
					).done( function ( r1, r2 ) {

					if ( r1.length > 0 ) {
						r1 = [ {
								text: self._i18n( 'suggestions', 'Suggestions' ),
								children: r1
						} ];
					}

					if ( r2.length > 0 &&  r1.length > 0 ) {
						r2 = [ {
							text: self._i18n( 'other', 'Other' ),
							children: r2
						} ];
					}

					success( {
						results: r1.concat( r2 )
					} );
			} );
		};
	};

	/**
	 * @private
	 */
	SELF.prototype._getSparglTemplate = function( term, type, triple ) {
		var query = SPARQL_QUERY_SEARCH[ type ];

		if ( term && term.trim() !== '' ) {
			if ( !triple ) {
				return null;
			}

			return query.search;

		} else {
			if ( type === 'property' ) {
				if ( !triple  ) {
					return query.genericSuggest;
				}

				if ( triple.object. indexOf( '?' ) === 0  ) {
					return query.seeAlso;
				}
			} else {
				if ( !triple ) {
					return query.instanceOf;
				}
			}
			return query.suggest;
		}

	};

	/**
	 * @private
	 */
	SELF.prototype._searchEntitiesSparqlCreateQuery = function( term, type, triple ) {
		var query = this._getSparglTemplate( term, type, triple );

		function findFirstStringProperty( predicate ) {
			if ( typeof predicate === 'string' ) {
				return predicate;
			} else {
				return findFirstStringProperty( predicate.items[0] );
			}
		}

		if ( query && triple ) {
			query = query.replace( '{PROPERTY_URI}', findFirstStringProperty( triple.predicate ) )
			.replace( '{ITEM_URI}', triple.object )
			.replace( /\{LANGUAGE\}/g, $.i18n && $.i18n().locale || 'en' )
			.replace( '{TERM}', term );
		}

		return query;
	};

	/**
	 * @private
	 */
	SELF.prototype._searchEntitiesSparql = function( term, type, triple ) {
		var deferred = $.Deferred();

		var query = this._searchEntitiesSparqlCreateQuery( term, type, triple );
		if ( !query ) {
			return deferred.resolve( [] ).promise();
		}

		this._sparqlApi.query( query ).done( function( data ) {
			var r = data.results.bindings.map( function( d ) {
				var id = d.id.value.split( '/' ).pop();
				return {
					id: id,
					text: d.label.value,
					data: {
						id: id,
						description: d.description.value
					}
				};
			} );

			deferred.resolve( r );
		} ).fail( deferred.reject );

		return deferred.promise();
	};

	/**
	 * @private
	 */
	SELF.prototype._searchEntities = function( term, type ) {
		var deferred = $.Deferred();

		if ( !term || term.trim() === '' ) {
			return deferred.resolve( [] ).promise();
		}

		this._api.searchEntities( term, type ).done( function( data ) {
			var r = data.search.map( function( d ) {
				return {
					id: d.id,
					text: d.label,
					data: d
				};
			} );
			deferred.resolve( r );
		} );

		return deferred.promise();
	};

	/**
	 * @private
	 */
	SELF.prototype._renderSelect2 = function( $select, $element, triple ) {
		var formatter = function( item ) {
				if ( !item.data ) {
					return item.text;
				}
				return $( '<span><b>' + item.text + ' (' + item.data.id + ')' + '</b></span><br/><small>' +
						item.data.description + '</small>' );
			},
			transport = this._createLookupService( $element, triple );

		$select.select2( {
			width: 'auto',
			templateResult: formatter,
			ajax: {
				delay: 250,
				transport: transport
			},
			cache: true
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._i18n = function( key, defaultMessage ) {
		if ( !$.i18n ) {
			return defaultMessage;
		}

		return $.i18n( I18N_PREFIX + '-' + key );
	};

	return SELF;
}( jQuery, wikibase ) );
