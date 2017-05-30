var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.GraphResultBrowserNodeBrowser = ( function( $, vis, window, _ ) {
	'use strict';

	var SPARQL_PROPERTIES = 'SELECT ?p (SAMPLE(?pl) AS ?pl) (COUNT(?o) AS ?count ) (group_concat(?ol;separator=", ") AS ?ol)  WHERE {'
			+ '<{entityUri}> ?p ?o .'
			+ '   ?o <http://www.w3.org/2000/01/rdf-schema#label> ?ol .'
			+ '    FILTER ( LANG(?ol) = "[AUTO_LANGUAGE]" )'
			+ '    ?s <http://wikiba.se/ontology#directClaim> ?p .' + '    ?s rdfs:label ?pl .'
			+ '    FILTER ( LANG(?pl) = "[AUTO_LANGUAGE]" )' + '} group by ?p';

	var SPARQL_ENTITES = 'SELECT ?o ?ol WHERE {' + '<{entityUri}> <{propertyUri}> ?o .'
			+ '?o <http://www.w3.org/2000/01/rdf-schema#label> ?ol .'
			+ 'FILTER ( LANG(?ol) = "[AUTO_LANGUAGE]" )' + '} LIMIT 50';

	/**
	 * A browser for network nodes
	 *
	 * @constructor
	 * @param {DataSet} nodes
	 * @param {DataSet} edges
	 * @param {wikibase.queryService.api.Sparql} sparqlApi
	 */
	function SELF( nodes, edges, sparqlApi ) {
		this._nodes = nodes;
		this._edges = edges;

		this._sparql = sparqlApi;
	}

	/**
	 * @property {DataSet}
	 * @private
	 */
	SELF.prototype._nodes = null;

	/**
	 * @property {DataSet}
	 * @private
	 */
	SELF.prototype._nodes = null;

	/**
	 * @property {DataSet}
	 * @private
	 */
	SELF.prototype._sparql = null;

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._selectedNodeId = null;

	/**
	 * @property {object}
	 * @private
	 */
	SELF.prototype._temporaryNodes = {};

	/**
	 * @property {object}
	 * @private
	 */
	SELF.prototype._temporaryEdges = {};

	/**
	 * @private
	 */
	SELF.prototype._getEntites = function( entityUri, propertyUri ) {
		var self = this,
			deferred = $.Deferred();

		this._sparql.query(
				SPARQL_ENTITES.replace( '{entityUri}', entityUri ).replace( '{propertyUri}',
						propertyUri ) ).done( function() {
			var data = self._sparql.getResultRawData();
			var result = [];

			$.each( data.results.bindings, function( i, row ) {
				result.push( {
					id: row.o.value,
					label: row.ol.value
				} );
			} );

			deferred.resolve( result );
		} );

		return deferred;
	};

	/**
	 * @private
	 */
	SELF.prototype._getProperties = function( entityUri ) {
		var self = this,
			deferred = $.Deferred();

		this._sparql.query( SPARQL_PROPERTIES.replace( '{entityUri}', entityUri ) ).done(
				function() {
					var data = self._sparql.getResultRawData();
					var result = [];

					$.each( data.results.bindings, function( i, row ) {
						result.push( {
							id: row.p.value,
							label: row.pl.value,
							count: row.count.value,
							items: row.ol.value
						} );
					} );

					deferred.resolve( result );
				} );

		return deferred;
	};

	/**
	 * @private
	 */
	SELF.prototype._removeTemporaryNodes = function( entityUri ) {
		var self = this;

		$.each( this._temporaryNodes, function( i, n ) {
			self._nodes.remove( n.id );
		} );
		$.each( this._temporaryEdges, function( i, e ) {
			self._edges.remove( e.id );
		} );

		this._temporaryNodes = {};
		this._temporaryEdges = {};
	};

	/**
	 * @private
	 */
	SELF.prototype._expandPropertyNode = function( nodeId ) {
		var self = this,
			node = this._temporaryNodes[nodeId];

		this._getEntites( node.entityId, node.id ).done( function( entites ) {
			$.each( entites, function( i, e ) {
				if ( self._nodes.get( e.id ) === null ) {
					self._nodes.add( {
						id: e.id,
						label: e.label
					} );
				}
				self._edges.add( {
					dashes: true,
					from: node.entityId,
					to: e.id,
					label: node.propertyLabel,
					linkType: node.id
				} );
			} );
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._expandEntityNode = function( nodeId ) {
		var self = this;

		this._getProperties( nodeId ).done( function( properties ) {
			$.each( properties, function( i, p ) {
				// if already expanded skip
				if ( self._edges.get( {
					filter: function( e ) {
						return e.linkType === p.id && e.from === nodeId;
					}
				} ).length > 0 ) {
					return;
				}

				var node = {
					id: p.id,
					label: p.count === '1' ? p.items : p.count,
					title: p.items,
					entityId: nodeId,
					propertyLabel: p.label,
					color: '#abc9f2'
				};
				var edge = {
					id: p.id,
					dashes: true,
					label: p.label,
					from: nodeId,
					to: p.id
				};
				self._temporaryNodes[node.id] = node;
				self._nodes.add( node );

				self._temporaryEdges[edge.id] = edge;
				self._edges.add( edge );
			} );
		} );
	};

	/**
	 * Browse a node
	 *
	 * @param {string} nodeId
	 */
	SELF.prototype.browse = function( nodeId ) {
		if ( nodeId === null ) {
			this._removeTemporaryNodes();
			return;
		}

		if ( this._temporaryNodes[nodeId] ) {
			this._expandPropertyNode( nodeId );
			this._removeTemporaryNodes();
			return;
		}

		if ( this._selectedNodeId !== null && nodeId !== this._selectedNodeId ) {
			this._removeTemporaryNodes();
		}
		this._expandEntityNode( nodeId );
		this._selectedNodeId = nodeId;
	};

	return SELF;
}( jQuery, vis, window, _ ) );
