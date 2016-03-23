var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.resultBrowser = wikibase.queryService.ui.resultBrowser || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.resultBrowser.TreeMapResultBrowser = ( function ( $, d3, window ) {
	"use strict";

	/**
	 * A treemap result browser
	 *
	 * @class wikibase.queryService.ui.resultBrowser.TreeResultBrowser
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 *
	 * @constructor
	 */
	function SELF() {
	}

	SELF.prototype = new wikibase.queryService.ui.resultBrowser.AbstractChartResultBrowser();

	/**
	 * @property {boolean}
	 * @private
	 **/
	SELF.prototype._hasLabel = false;


	/**
	 * Draw browser to the given element
	 * @param {jQuery} $element to draw at
	 **/
	SELF.prototype.draw = function ( $element ) {
		var self = this;

		var data = {};

		$.each( this._getRows(), function( index, row ){
			var layer = data;
			$.each( self._getColumns(), function ( key, col ) {
				col = row[col];
				if( self._isLabel( col ) ){
					if( !layer[ col.value ] ){
						layer[ col.value ] = {};
					}
					layer = layer[ col.value ];
				}
				self.processVisitors( col );
			} );
		} );

		var children = this._createTreeData( data );
		var treeData = { name: 'treeMap', children:children };

		this._draw( $element, treeData );
	};

	SELF.prototype._createTreeData = function ( data ) {
		var self = this,
			nodes = [],
			node;

		$.each( data, function( key, value ){

			var children = self._createTreeData( value );

			if( children.length !== 0 ){
				node = {name: key, children: children};
			} else {
				node = {name: key, size:1 };
			}

			nodes.push( node );
		} );

		return nodes;
	};

	SELF.prototype._draw = function ( $element, data ) {
		var w = $(window).width(), h = $(window).height(), x = d3.scale
				.linear().range([ 0, w ]), y = d3.scale.linear()
				.range([ 0, h ]), color = d3.scale.category20c(), root, node;

		var treemap = d3.layout.treemap().round(false).size([ w, h ]).sticky(
				true).value(function(d) {
			return d.size;
		});

		var svg = d3.select($element[0]).append("div").attr("class", "chart")
				.style("width", w + "px").style("height", h + "px").append(
						"svg:svg").attr("width", w).attr("height", h).append(
						"svg:g").attr("transform", "translate(.5,.5)");

		function zoom(d) {
			var kx = w / d.dx, ky = h / d.dy;
			x.domain([ d.x, d.x + d.dx ]);
			y.domain([ d.y, d.y + d.dy ]);

			var t = svg.selectAll("g.cell").transition().duration(
					d3.event.altKey ? 7500 : 750).attr("transform",
					function(d) {
						return "translate(" + x(d.x) + "," + y(d.y) + ")";
					});

			t.select("rect").attr("width", function(d) {
				return kx * d.dx - 1;
			}).attr("height", function(d) {
				return ky * d.dy - 1;
			});

			t.select("text").attr("x", function(d) {
				return kx * d.dx / 2;
			}).attr("y", function(d) {
				return ky * d.dy / 2;
			}).style("opacity", function(d) {
				return kx * d.dx > d.w ? 1 : 0;
			});

			node = d;
			d3.event.stopPropagation();
		}

		node = root = data;

		var nodes = treemap.nodes(root).filter(function(d) {
			return !d.children;
		});

		var cell = svg.selectAll("g").data(nodes).enter().append("svg:g")
			.attr("class", "cell").attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")";
		}).on("click", function(d) {
			return zoom(node === d.parent ? root : d.parent);
		});

		cell.append("svg:rect").attr("width", function(d) {
			return d.dx - 1;
		}).attr("height", function(d) {
			return d.dy - 1;
		}).style("fill", function(d) {
			return color(d.parent.name);
		});

		cell.append("svg:text").attr("x", function(d) {
			return d.dx / 2;
		}).attr("y", function(d) {
			return d.dy / 2;
		}).attr("dy", ".35em").attr("text-anchor", "middle").text(function(d) {
			return d.name;
		}).style("opacity", function(d) {
			d.w = this.getComputedTextLength();
			return d.dx > d.w ? 1 : 0;
		});

		d3.select(window).on("click", function() {
			zoom(root);
		});
	};

	/**
	 * Checks whether the browser can draw the given result
	 *
	 * @return {boolean}
	 */
	SELF.prototype.isDrawable = function () {

		if( this._hasLabel ){
			return true;
		}

		return false;
	};

	/**
	 * Receiving data from the a visit
	 * @param data
	 * @return {boolean} false if there is no revisit needed
	 */
	SELF.prototype.visit = function( data ) {
		return this._checkColumn( data );
	};

	/**
	 * Check if this value contains an coordinate value.
	 */
	SELF.prototype._checkColumn = function ( value ) {

		if( this._isLabel( value ) ){
			this._hasLabel = true;
			return false;
		}

		return true;
	};

	return SELF;
}( jQuery, d3,  window ) );
