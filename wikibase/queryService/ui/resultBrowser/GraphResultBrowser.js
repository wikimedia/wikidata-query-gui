var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};

wikibase.queryService.ui.resultBrowser.GraphResultBrowser = ( function( $, vis, window, _ ) {
	'use strict';

	var GRAPH_OPTIONS = {
		autoResize: true,
		physics: {
			stabilization: {
				enabled: true,
				iterations: 10,
				fit: true
			},
			barnesHut: {
				springLength: 150,
				centralGravity: 0.5,
				damping: 0.2,
				avoidOverlap: 0.1
			}
		},
		nodes: {
			shadow: true,
			color: '#fff'
		},
		edges: {
			arrows: {
				to: true
			}
		}
	};

	/**
	 * A graph result browser
	 *
	 * @class wikibase.queryService.ui.resultBrowser.GraphResultBrowser
	 * @licence GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 *
	 */
	function SELF() {
	}

	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractResultBrowser();

	/**
	 * Draw to the given element
	 *
	 * @param {jQuery} $element target element
	 */
	SELF.prototype.draw = function( $element ) {
		var $container = $( '<div>' ).height( '100vh' );

		var data = this._getData();
		var network = new vis.Network( $container[0], data, GRAPH_OPTIONS );

		network.on( 'doubleClick', function( properties ) {
			if ( properties.nodes.length === 1 ) {
				window.open( properties.nodes[0], '_blank' );
			}
		} );

		var nodeBrowser = new wikibase.queryService.ui.resultBrowser.GraphResultBrowserNodeBrowser( data.nodes, data.edges, this.getSparqlApi() );
		network.on( 'click', function( properties ) {
			var nodeId = properties.nodes[0] || null;
			nodeBrowser.browse( nodeId );
		} );

		$container.prepend( this._createToolbar( network ) );
		$element.append( $container );
	};

	/**
	 * @private
	 */
	SELF.prototype._createToolbar = function( network ) {
		var $toolbar = $( '<div style="margin-top: -35px; text-align: center;">' );

		function setLayout( type ) {
			network.setOptions( {
				layout: {
					hierarchical: {
						direction: type,
						sortMethod: 'directed'
					}
				}
			} );
		}

		$( '<a class="btn btn-default">' ).click( function() {
			network.stabilize( 100 );
		} ).append(
			'<span class="glyphicon glyphicon-fullscreen" aria-hidden="true" title="' +
			this._i18n( 'wdqs-app-resultbrowser-stabilize' ) +
			'"></span>'
		).appendTo( $toolbar );

		$( '<a class="btn btn-default">' ).click( function() {
			setLayout( 'LR' );
		} ).append( '<span class="glyphicon glyphicon-indent-left" aria-hidden="true" title="' +
			this._i18n( 'wdqs-app-resultbrowser-hierarchical-lr' ) +
			'"></span>'
		).appendTo( $toolbar );

		$( '<a class="btn btn-default">' ).click( function() {
			setLayout( 'UD' );
		} ).append( '<span class="glyphicon glyphicon-align-center" aria-hidden="true" title="' +
			this._i18n( 'wdqs-app-resultbrowser-hierarchical-ud' ) +
			'"></span>'
		).appendTo( $toolbar );

		$( '<a class="btn btn-default">' ).click( function() {
			setLayout( 'RL' );
		} ).append( '<span class="glyphicon glyphicon-indent-right" aria-hidden="true" title="' +
			this._i18n( 'wdqs-app-resultbrowser-hierarchical-rl' ) +
			'"></span>'
		).appendTo( $toolbar );

		return $toolbar;
	};

	/**
	 * @private
	 */
	SELF.prototype._getData = function() {
		var nodes = {},
			edges = {},
			rows = [],
			format = this._getFormatter(),
			node = {},
			edge = {};

		this._iterateResult( function( field, key, row, rowIndex ) {
			if ( !field || !field.value ) {
				return;
			}
			if ( format.isEntity( field ) ) {
				// create node
				var label = row[key + 'Label'] && row[key + 'Label'].value || field.value,
					nodeId = field.value;
				node = {
					id: nodeId,
					label: label,
					title: label
				};
				if ( rows[rowIndex] ) {// create new edge
					edge = {
							from: rows[rowIndex],
							to: nodeId
						};
					edges[ edge.from + edge.to ] = edge;
					if ( !nodes[nodeId] ) {// create new node if not exist
						nodes[nodeId] = node;
					}
				} else {
					nodes[nodeId] = node;
					rows[rowIndex] = node.id;
				}
			}
			if ( format.isCommonsResource( field.value ) ) {
				node.image = format.getCommonsResourceFileNameThumbnail( field.value, 150 );
				node.shape = 'image';
				node.font = { color: 'black' };
			}

			if ( format.isNumber( field ) ) {
				node.value = field.value;
				node.title += ' value:' + field.value;
				node.shape = 'dot';
				node.font = { color: 'black' };
			}

			if ( key === 'rgb' && format.isColor( field ) ) {
				node.color = format.getColorForHtml( field );
				if ( node.shape !== 'dot' && node.shape !== 'image' ) {
					var foreground = format.calculateLuminance( field.value ) <= 0.5 ? '#FFF' : '#000';
					node.font = { color: foreground };
				}
			}

			if ( key === 'edgeLabel' ) {
				edge.label = field.value;
			}
		} );

		return {
			nodes: new vis.DataSet( _.compact( nodes ) ),
			edges: new vis.DataSet( _.compact( edges ) )
		};
	};

	/**
	 * Receiving data from the visit
	 *
	 * @param {Object} data
	 * @return {boolean} false if there is no revisit needed
	 */
	SELF.prototype.visit = function( data ) {
		if ( this._getFormatter().isEntity( data ) ) {
			this._drawable = true;
			return false;
		}
		return true;
	};

	return SELF;
}( jQuery, vis, window, _ ) );
