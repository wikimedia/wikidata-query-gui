var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};

wikibase.queryService.ui.ResultView = ( function( $, window ) {
	'use strict';

	var TRACKING_NAMESPACE = 'wikibase.queryService.ui.app.';

	var PREVIEW_TIMEOUT = 1000,
		PREVIEW_LIMIT = 20;

	/**
	 * A result view for sparql queries
	 *
	 * @class wikibase.queryService.ui.ResultView
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 *
	 * @param {wikibase.queryService.api.Sparql} sparqlApi
	 */
	function SELF( sparqlApi ) {
		this._sparqlApi = sparqlApi;

		this._init();
	}

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._query = null;

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._sparqlQuery = null;

	/**
	 * @property {wikibase.queryService.api.Sparql}
	 * @private
	 */
	SELF.prototype._sparqlApi = null;

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._selectedResultBrowser = null;

	/**
	 * @property {wikibase.queryService.ui.toolbar.Actionbar}
	 * @private
	 */
	SELF.prototype._actionBar = null;

	/**
	 * @property {wikibase.queryService.api.Tracking}
	 * @private
	 */
	SELF.prototype._trackingApi = null;

	/**
	 * @property {boolean}
	 * @private
	 */
	SELF.prototype._hasRunFirstQuery = false;

	/**
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._resultBrowsers = {
		Table: {
			icon: 'glyphicon-th-list',
			label: 'Table',
			class: 'TableResultBrowser',
			object: null,
			$element: null
		},
		ImageGrid: {
			icon: 'glyphicon-picture',
			label: 'Image Grid',
			class: 'ImageResultBrowser',
			object: null,
			$element: null
		},
		Polestar: {
			icon: 'fa-certificate',
			label: 'Graph builder',
			class: 'PolestarResultBrowser',
			object: null,
			$element: null
		},
		Map: {
			icon: 'glyphicon-map-marker',
			label: 'Map',
			class: 'CoordinateResultBrowser',
			object: null,
			$element: null
		},
		LineChart: {
			icon: 'fa-line-chart',
			label: 'Line Chart',
			class: 'LineChartResultBrowser',
			object: null,
			$element: null
		},
		BarChart: {
			icon: 'fa-bar-chart',
			label: 'Bar Chart',
			class: 'BarChartResultBrowser',
			object: null,
			$element: null
		},
		ScatterChart: {
			icon: 'fa-braille',
			label: 'Scatter Chart',
			class: 'ScatterChartResultBrowser',
			object: null,
			$element: null
		},
		AreaChart: {
			icon: 'fa-area-chart',
			label: 'Area Chart',
			class: 'AreaChartResultBrowser',
			object: null,
			$element: null
		},
		BubbleChart: {
			icon: 'glyphicon-tint',
			label: 'Bubble Chart',
			class: 'BubbleChartResultBrowser',
			object: null,
			$element: null
		},
		TreeMap: {
			icon: 'glyphicon-th',
			label: 'Tree Map',
			class: 'TreeMapResultBrowser',
			object: null,
			$element: null
		},
		Tree: {
			icon: 'fa-tree',
			label: 'Tree',
			class: 'TreeResultBrowser',
			object: null,
			$element: null
		},
		Timeline: {
			icon: 'glyphicon-calendar',
			label: 'Timeline',
			class: 'TimelineResultBrowser',
			object: null,
			$element: null
		},
		Dimensions: {
			icon: 'glyphicon-random',
			label: 'Dimensions',
			class: 'MultiDimensionResultBrowser',
			object: null,
			$element: null
		},
		Graph: {
			icon: 'glyphicon-retweet',
			label: 'Graph',
			class: 'GraphResultBrowser',
			object: null,
			$element: null
		}
	};

	/**
	 * Initialize private members and call delegate to specific init methods
	 *
	 * @private
	 */
	SELF.prototype._init = function() {
		if ( !this._sparqlApi ) {
			this._sparqlApi = new wikibase.queryService.api.Sparql();
		}

		if ( !this._trackingApi ) {
			this._trackingApi = new wikibase.queryService.api.Tracking();
		}

		this._actionBar = new wikibase.queryService.ui.toolbar.Actionbar( $( '.action-bar' ) );

		this._sparqlQuery = this._query = new wikibase.queryService.ui.queryHelper.SparqlQuery();

		this._initResultBrowserMenu();
	};

	/**
	 * @private
	 */
	SELF.prototype._initResultBrowserMenu = function() {
		$.each( this._resultBrowsers, function( key, b ) {
			var $element = $( '<li><a class="result-browser" href="#">' +
					'<span class="' + b.icon.split( '-', 1 )[0] + ' ' + b.icon + '"></span>' + b.label +
					'</a></li>' );
			$element.appendTo( $( '#result-browser-menu' ) );
			b.$element = $element;
		} );
	};

	/**
	 * Render a given SPARQL query
	 *
	 * @param {String} query
	 * @return {JQuery.Promise}
	 */
	SELF.prototype.draw = function( query ) {
		var self = this,
			deferred = $.Deferred();

		this._query = query;

		this._actionBar.show( 'wdqs-action-query', '', 'info', 100 );

		$( '#query-result' ).empty().hide();
		$( '.result' ).hide();
		$( '#query-error' ).hide();

		this._sparqlApi.query( query )
			.done( function () {
				self._handleQueryResult();
				deferred.resolve();
			} )
			.fail( function() {
				var error = self._handleQueryError();
				deferred.reject( error );
			} );

		return deferred.promise();
	};

	/**
	 * Render a preview of the given SPARQL query
	 *
	 * @param {String} query
	 * @return {JQuery.Promise}
	 */
	SELF.prototype.drawPreview = function( query ) {
		var self = this,
			deferred = $.Deferred(),
			prefixes = wikibase.queryService.RdfNamespaces.ALL_PREFIXES,
			previousQueryString = this._sparqlQuery.getQueryString();

		this._query = query;
		this._sparqlQuery.parse( query, prefixes );
		this._sparqlQuery.setLimit( PREVIEW_LIMIT );

		if ( previousQueryString === this._sparqlQuery.getQueryString() ) {
			return deferred.reject().promise();
		}

		$( '#query-result' ).empty().hide();
		$( '.result' ).hide();
		$( '#query-error' ).hide();
		this._actionBar.hide();

		this._sparqlApi.query( this._sparqlQuery.getQueryString(), PREVIEW_TIMEOUT )
			.done( function () {
				self._handleQueryResult();
				deferred.resolve();
				window.setTimeout( function() {
					self._actionBar.show( 'wdqs-action-preview', '', 'default' );
				}, 200 );
			} )
			.fail( function() {
				deferred.reject();
			} );

		return deferred.promise();
	};

	/**
	 * @private
	 */
	SELF.prototype._handleQueryError = function() {
		$( '#execute-button' ).prop( 'disabled', false );

		var error = this._sparqlApi.getError(),
			errorMessageKey = null,
			codes = this._sparqlApi.ERROR_CODES;

		switch ( error.code ) {
		case codes.TIMEOUT:
			errorMessageKey = 'wdqs-action-timeout';
			break;
		case codes.MALFORMED:
			errorMessageKey = 'wdqs-action-malformed-query';
			break;
		case codes.SERVER:
			errorMessageKey = 'wdqs-action-server-error';
			break;
		default:
			errorMessageKey = 'wdqs-action-unknow-error';
			break;
		}

		if ( error.debug ) {
			$( '#query-error' ).html( $( '<pre>' ).text( error.debug ) ).show();
		}

		this._actionBar.show( errorMessageKey || '', error.message || '', 'danger' );
		this._track( 'result.error.' + ( errorMessageKey || 'unknown' ) );

		return error.debug === undefined ? '' : error.debug;
	};

	/**
	 * @private
	 */
	SELF.prototype._handleQueryResult = function() {
		var api = this._sparqlApi;

		$( '#total-results' ).text( api.getResultLength() );
		$( '#query-time' ).text( api.getExecutionTime() );
		$( '.result' ).show();

		$( '#execute-button' ).prop( 'disabled', false );

		var defaultBrowser = this._createResultBrowsers( api.getResultRawData() );
		this._drawResult( defaultBrowser );
		this._selectedResultBrowser = null;

		this._track( 'result.resultLength', api.getResultLength() );
		this._track( 'result.executionTime', api.getExecutionTime(), 'ms' );
		this._track( 'result.received.success' );

		return false;
	};

	/**
	 * @private
	 * @return {Object} default result browser
	 */
	SELF.prototype._createResultBrowsers = function( resultData ) {
		var self = this;

		var defaultBrowserOptions = this._getDefaultBrowserOptions();
		var defaultBrowser = null;

		if ( defaultBrowserOptions !== null ) {
			this._track( 'result.browser.' + defaultBrowserOptions.name );
		} else {
			this._track( 'result.browser.default' );
		}

		// instantiate
		$.each( this._resultBrowsers, function( key, b ) {
			var instance = new wikibase.queryService.ui.resultBrowser[b.class]();
			instance.setSparqlApi( self._sparqlApi );

			if ( defaultBrowserOptions !== null && defaultBrowserOptions.name === key ) {
				self._setSelectedDisplayType( b );
				defaultBrowser = instance;
				if ( 'options' in defaultBrowserOptions ) {
					var options = new wikibase.queryService.ui.resultBrowser.helper.Options(
						defaultBrowserOptions.options
					);
					instance.setOptions( options );
				}
			}
			b.object = instance;
		} );
		if ( defaultBrowser === null ) {
			defaultBrowser = this._resultBrowsers.Table.object;
		}

		defaultBrowser.resetVisitors();

		// wire up
		$.each( this._resultBrowsers, function( key, b ) {
			defaultBrowser.addVisitor( b.object );
			b.object.setResult( resultData );
		} );

		return defaultBrowser;
	};

	/**
	 * @private
	 * @return {?{name: string, options: ?Object}}
	 */
	SELF.prototype._getDefaultBrowserOptions = function() {
		var match = this._query.match( /#defaultView:(\w+)(\{.*\})?/ );

		if ( match && this._resultBrowsers.hasOwnProperty( match[1] ) ) {
			var result = { name: match[1] };
			if ( match[2] ) {
				try {
					result.options = JSON.parse( match[2] );
				} catch ( e ) {
					window.console.error( e );
				}
			}
			return result;
		} else {
			return null;
		}
	};

	/**
	 * @private
	 */
	SELF.prototype._handleQueryResultBrowsers = function() {
		var self = this;

		$.each( this._resultBrowsers, function( key, b ) {
			b.$element.off( 'click' );

			if ( b.object.isDrawable() ) {
				b.$element.css( 'opacity', 1 ).attr( 'href', '#' );
				b.$element.click( function() {
					$( this ).closest( '.open' ).removeClass( 'open' );

					self._setSelectedDisplayType( b );

					$( '#query-result' ).html( '' );
					self._drawResult( b.object );
					self._selectedResultBrowser = key;
					self._track( 'buttonClick.display.' + key );
					return false;
				} );
			} else {
				b.$element.css( 'opacity', 0.5 ).removeAttr( 'href' );
			}
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._drawResult = function( resultBrowser ) {
		var self = this;

		this._actionBar.show( 'wdqs-action-render', '',  'success', 100 );
		window.setTimeout( function() {
			try {
				$( '#query-result' ).show();
				resultBrowser.draw( $( '#query-result' ) );
				self._actionBar.hide();
			} catch ( e ) {
				self._actionBar.show( 'wdqs-action-error-display', '', 'warning' );
				window.console.error( e );
			}

			self._handleQueryResultBrowsers();
		}, 20 );
	};

	/**
	 * @private
	 */
	SELF.prototype._setSelectedDisplayType = function ( browser ) {
		$( '#display-button-icon' ).attr( 'class', browser.icon.split( '-', 1 )[0] + ' ' + browser.icon );
		$( '#display-button-label' ).text( browser.label );
	};

	/**
	 * @private
	 */
	SELF.prototype._track = function( metricName, value, valueType ) {
		this._trackingApi.track( TRACKING_NAMESPACE + metricName, value, valueType );
	};

	return SELF;

}( jQuery, window ) );
