var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.visualEditor = wikibase.queryService.ui.visualEditor || {};

wikibase.queryService.ui.visualEditor.SparqlQuery = ( function( $, wikibase, sparqljs ) {
	'use strict';

	/**
	 * A SPARQL query representation
	 *
	 * @class wikibase.queryService.ui.visualEditor.SparqlQuery
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 * @param {Object} query
	 */
	function SELF( query ) {
		this._query = query;
	}

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
	 * Set the SPARQL query string
	 *
	 * @param {String} query SPARQL query string
	 */
	SELF.prototype.parse = function( query, prefixes ) {

		var parser = new sparqljs.Parser( prefixes );
		this._query = parser.parse( query );
	};

	/**
	 * Get the SPARQL query string
	 *
	 * @return {String|null}
	 */
	SELF.prototype.getQueryString = function() {
		try {
			var q = new sparqljs.Generator().stringify( this._query );
			return q;
		} catch ( e ) {
			return null;
		}
	};

	/**
	 * Get LIMIT
	 *
	 * @return {Number|null}
	 */
	SELF.prototype.getLimit = function() {
		if ( !this._query.limit ) {
			return null;
		}

		return this._query.limit;
	};

	/**
	 * Set LIMIT
	 *
	 * @param {string} limit
	 */
	SELF.prototype.setLimit = function( limit ) {
		if ( !limit ) {
			delete this._query.limit;
		}

		this._query.limit = limit;
	};

	/**
	 * Check whether a variable is used in the SELECT clause of query
	 *
	 * @param {string} name of variable e.g. ?foo
	 */
	SELF.prototype.hasVariable = function( name ) {

		if ( this._query.variables.length === 0 ) {
			return false;
		}

		if ( this._query.variables[0] === '*' && name.startsWith( '?' ) ) {
			return true;
		}

		if ( this._query.variables.indexOf( name ) >= 0 ) {
			return true;
		}

		return false;
	};

	/**
	 * Add a variable to the query SELECT
	 *
	 * @param {string} name
	 */
	SELF.prototype.addVariable = function( name ) {

		if ( !name.startsWith( '?' ) ) {
			return;
		}

		if ( this._query.variables.length === 1 && this._query.variables[0] === '*' ) {
			return;
		}

		this._query.variables.push( name );
	};

	/**
	 * Remove a variable from the query SELECT
	 *
	 * @param {string} name
	 */
	SELF.prototype.removeVariable = function( name ) {

		if ( !name.startsWith( '?' ) ) {
			return;
		}

		if ( this._query.variables.length === 1 && this._query.variables[0] === '*' ) {
			return;
		}

		var index = this._query.variables.indexOf( name );
		if ( index >= 0 ) {
			this._query.variables.splice( index, 1 );
		}
	};

	/**
	 * Get triples defined in this query
	 *
	 * @return {Object}
	 */
	SELF.prototype.getTriples = function( node, isOptional ) {
		var triples = [];
		if ( !node ) {
			node = this._query.where;
		}
		if ( !isOptional ) {
			isOptional = false;
		}

		var self = this;
		$.each( node, function( k, v ) {
			if ( v.type && v.type === 'bgp' ) {
				triples = triples.concat( self._createTriples( v.triples, isOptional ) );
			}
			if ( v.type && v.type === 'optional' ) {
				triples = triples.concat( self.getTriples( v.patterns, true ) );
			}
			if ( v.type && v.type === 'union' ) {
				triples = triples.concat( self.getTriples( v.patterns, false ) );
			}
		} );

		return triples;
	};

	/**
	 * @private
	 */
	SELF.prototype._createTriples = function( triplesData, isOptional ) {
		var triples = [];

		var self = this;
		$.each( triplesData, function( i, triple ) {
			triples.push( {
				optional: isOptional,
				query: self,
				triple: triple,
				remove: function() {
					triplesData.splice( i, 1 );
				}
			} );
		} );

		return triples;
	};

	/**
	 * Get triples defined in this query
	 *
	 * @return {wikibase.queryService.ui.visualEditor.SparqlQuery[]}
	 */
	SELF.prototype.getSubQueries = function() {
		var queries = [];

		$.each( this._query.where, function( k, v ) {
			if ( v.queryType ) {
				queries.push( new SELF( v ) );
			}
		} );

		return queries;
	};

	/**
	 * Add a triple to the query
	 *
	 * @param {String} subject
	 * @param {String} predicate
	 * @param {String} object
	 * @param {Boolean} isOptional
	 */
	SELF.prototype.addTriple = function( subject, predicate, object, isOptional ) {
		var triple = {
			type: 'bgp',
			triples: [
				{
					subject: subject,
					predicate: predicate,
					object: object
				}
			]
		};
		if ( isOptional ) {
			var optionalTriple = {
				type: 'optional',
				patterns: [
					triple
				]

			};
			this._query.where.push( optionalTriple );
		} else {
			this._query.where.push( triple );
		}

		return this._createTriples( triple.triples, isOptional )[0];
	};

	/**
	 * Get variables that are bound to a certain value
	 *
	 * @return {String[]}
	 */
	SELF.prototype.getBoundVariables = function() {
		var variables = {};

		$.each( this.getTriples(), function( i, t ) {
			if ( t.triple.subject.startsWith( '?' ) && !t.triple.object.startsWith( '?' ) ) {
				variables[t.triple.subject] = true;
			}

			if ( !t.triple.subject.startsWith( '?' ) && t.triple.object.startsWith( '?' ) ) {
				variables[t.triple.object] = true;
			}
		} );

		return Object.keys( variables );
	};

	return SELF;
}( jQuery, wikibase, sparqljs ) );
