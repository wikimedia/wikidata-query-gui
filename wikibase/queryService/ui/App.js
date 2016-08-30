var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.App = ( function( $, mw, download, EXPLORER, window, _, Cookies, moment ) {
	'use strict';

	var SHORTURL_API = '//tinyurl.com/api-create.php?url=';

	var QUERY_ERROR_MAP = {
			'Query deadline is expired.': 'wdqs-action-timeout'
	};

	/**
	 * A ui application for the Wikibase query service
	 *
	 * @class wikibase.queryService.ui.App
	 * @license GNU GPL v2+
	 *
	 * @author Stanislav Malyshev
	 * @author Jonas Kress
	 * @constructor
	 *
	 * @param {jQuery} $element
	 * @param {wikibase.queryService.ui.editor.Editor} editor
	 * @param {wikibase.queryService.api.Sparql} visualEditor
	 */
	function SELF( $element, editor, visualEditor, sparqlApi, querySamplesApi ) {
		this._$element = $element;
		this._editor = editor;
		this._visualEditor = visualEditor;
		this._sparqlApi = sparqlApi;
		this._querySamplesApi = querySamplesApi;

		this._init();
	}

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._$element = null;

	/**
	 * @property {wikibase.queryService.api.Sparql}
	 * @private
	 */
	SELF.prototype._sparqlApi = null;

	/**
	 * @property {wikibase.queryService.api.QuerySamples}
	 * @private
	 */
	SELF.prototype._querySamplesApi = null;

	/**
	 * @property {wikibase.queryService.ui.editor.Editor}
	 * @private
	 */
	SELF.prototype._editor = null;

	/**
	 * @property {wikibase.queryService.ui.visualEditor.VisualEditor}
	 * @private
	 */
	SELF.prototype._visualEditor = null;

	/**
	 * @property {boolean}
	 * @private
	 */
	SELF.prototype._isHistoryDisabled = false;

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
	 * @property {Object}
	 * @private
	 */
	SELF.prototype._resultBrowsers = {
		Table: {
			icon: 'th-list',
			label: 'Table',
			class: 'TableResultBrowser',
			object: null,
			$element: null
		},
		ImageGrid: {
			icon: 'picture',
			label: 'Image Grid',
			class: 'ImageResultBrowser',
			object: null,
			$element: null
		},
		Map: {
			icon: 'map-marker',
			label: 'Map',
			class: 'CoordinateResultBrowser',
			object: null,
			$element: null
		},
		BubbleChart: {
			icon: 'tint',
			label: 'Bubble Chart',
			class: 'BubbleChartResultBrowser',
			object: null,
			$element: null
		},
		TreeMap: {
			icon: 'th',
			label: 'Tree Map',
			class: 'TreeMapResultBrowser',
			object: null,
			$element: null
		},
		Timeline: {
			icon: 'calendar',
			label: 'Timeline',
			class: 'TimelineResultBrowser',
			object: null,
			$element: null
		},
		Dimensions: {
			icon: 'random',
			label: 'Dimensions',
			class: 'MultiDimensionResultBrowser',
			object: null,
			$element: null
		},
		Graph: {
			icon: 'retweet',
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

		if ( !this._querySamplesApi ) {
			this._querySamplesApi = new wikibase.queryService.api.QuerySamples();
		}

		if ( !this._editor ) {
			this._editor = new wikibase.queryService.ui.editor.Editor();
		}

		this._initApp();
		this._initEditor();
		this._initVisualEditor();
		this._initExamples();
		this._initDataUpdated();
		this._initQuery();
		this._initRdfNamespaces();
		this._initHandlers();
		this._initResultBrowserMenu();
	};

	/**
	 * @private
	 */
	SELF.prototype._initApp = function() {
		// ctr + enter executes query
		$( window ).keydown( function( e ) {
			if ( e.ctrlKey && e.keyCode === 13 ) {
				$( '#execute-button' ).click();
			}
		} );

		this._actionBar = new wikibase.queryService.ui.toolbar.Actionbar( $( '.action-bar' ) );
	};

	/**
	 * @private
	 */
	SELF.prototype._initEditor = function() {
		this._editor.fromTextArea( this._$element.find( '.queryEditor' )[0] );

		// if(window.history.pushState) {//this works only in modern browser
		// this._editor.registerCallback( 'change', $.proxy( this._updateQueryUrl, this) );
		// }
	};

	/**
	 * @private
	 */
	SELF.prototype._initVisualEditor = function() {
		var self = this,
			cookieHide = 'visual-editor-hide';

		if ( !this._visualEditor ) {
			this._visualEditor = new wikibase.queryService.ui.visualEditor.VisualEditor();
		}
		this._visualEditor.setChangeListener( function( ve ) {
			self._editor.setValue( ve.getQuery() );
		} );

		if ( Cookies.get( cookieHide ) === 'true' ) {
			$( '.visual-editor-trigger' ).show();
		}

		if ( this._editor ) {
			this._editor.registerCallback( 'change', _.debounce( function() {
				if ( $( '.visual-editor-trigger' ).is( ':visible' ) ||
						self._editor.getValue() === self._visualEditor.getQuery() ) {
					return;
				}

				$( '.visual-editor' ).hide();
				self._drawVisualEditor();
			}, 1500 ) );
		}

		$( '.visual-editor .panel-heading .close' ).click( function() {
			Cookies.set( cookieHide, true );
			$( '.visual-editor' ).hide();
			$( '.visual-editor-trigger' ).show();
			return false;
		} );

		$( '.visual-editor-trigger' ).click( function() {
			$( '.visual-editor-trigger' ).hide();
			Cookies.set( cookieHide, false );
			self._drawVisualEditor();
			return false;
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._drawVisualEditor = function() {
		try {
			this._visualEditor.setQuery( this._editor.getValue() );
			this._visualEditor.draw( $( '.visual-editor .panel-body' ) );

			$( '.visual-editor' ).delay( 500 ).fadeIn();
		} catch ( e ) {
			if ( e.stack ) {
				window.console.log( e.stack );
			}
		}
	};

	/**
	 * @private
	 */
	SELF.prototype._initExamples = function() {
		var self = this;
		new wikibase.queryService.ui.QueryExampleDialog( $( '#QueryExamples' ),
				this._querySamplesApi, function( query, title ) {
					if ( !query || !query.trim() ) {
						return;
					}

					self._editor.setValue( '#' + title + '\n' + query );
				} );
	};

	/**
	 * @private
	 */
	SELF.prototype._initRdfNamespaces = function() {
		var category,
			select,
			ns,
			container = $( '.namespace-shortcuts' ),
			namespaces = wikibase.queryService.RdfNamespaces.NAMESPACE_SHORTCUTS;

		container.click( function( e ) {
			e.stopPropagation();
		} );

		// add namespaces to dropdowns
		for ( category in namespaces ) {
			select = $( '<select>' ).attr( 'class', 'form-control' ).append(
					$( '<option>' ).text( category ) ).appendTo( container );
			for ( ns in namespaces[category] ) {
				select.append( $( '<option>' ).text( ns ).attr( {
					value: namespaces[category][ns]
				} ) );
			}
		}
	};

	/**
	 * @private
	 */
	SELF.prototype._initQuery = function() {
		if ( window.location.hash !== '' ) {
			if ( location.hash.indexOf( '#result#' ) === 0 ) {
				location.hash = location.hash.replace( '#result#', '#' );
			}

			this._isHistoryDisabled = true;
			this._editor.setValue( decodeURIComponent( window.location.hash.substr( 1 ) ) );
			this._editor.refresh();
			this._isHistoryDisabled = false;
		}
	};

	/**
	 * @private
	 */
	SELF.prototype._initDataUpdated = function() {
		var self = this;
		var $label = $( '.dataUpdated' );

		var updateDataStatus = function() {
			self._sparqlApi.queryDataUpdatedTime().done( function( time, difference ) {

				var updatestatustext = moment.duration( difference, 'seconds' ).humanize(),
					labelClass,
					badge;

				if ( difference <= 60 * 2 ) {
					labelClass = 'list-group-item-success';
				} else if ( difference <= 60 * 15 ) {
					labelClass =  'list-group-item-warning';
				} else {
					labelClass = 'list-group-item-danger';
				}
				badge = '<span class="badge ' + labelClass + '">' + updatestatustext + '</span>';
				$label.html( $.i18n( 'wdqs-app-footer-updated', badge ) );
			} );
		};

		updateDataStatus();

		window.setInterval( updateDataStatus, 10 * 60 * 1000 );

		$label.hover( function() {
			updateDataStatus();

			var e = $( this );
			self._sparqlApi.queryDataUpdatedTime().done( function( time, difference ) {
				e.popover( {
					html: true,
					placement: 'bottom',
					content: $.i18n( 'wdqs-app-footer-updated-seconds', difference ) + '.</br>' + time
				} ).popover( 'show' );
			} ).fail( function() {
				e.popover( {
					content: '[unable to connect]'
				} ).popover( 'show' );
			} );
		}, function() {
			var e = $( this );
			e.popover( 'destroy' );
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._initHandlers = function() {
		var self = this;

		$( '#query-form' ).submit( $.proxy( this._handleQuerySubmit, this ) );
		$( '.namespace-shortcuts' ).on( 'change', 'select',
				$.proxy( this._handleNamespaceSelected, this ) );

		$( '.addPrefixes' ).click( function() {
			var standardPrefixes = wikibase.queryService.RdfNamespaces.STANDARD_PREFIXES;
			var prefixes = Object.keys( standardPrefixes ).map( function( x ) {
				return standardPrefixes[x];
			} ).join( '\n' );
			self._editor.prepandValue( prefixes + '\n\n' );
		} );

		$( '#clear-button' ).click( function() {
			self._editor.setValue( '' );
		} );

		$( '.explorer-close' ).click( function( e ) {
			e.preventDefault();
			$( '.explorer-panel' ).hide();
		} );

		$( window ).on( 'popstate', $.proxy( this._initQuery, this ) );

		this._initPopovers();
		this._initHandlersDownloads();
	};

	/**
	 * @private
	 */
	SELF.prototype._initPopovers = function() {
		var self = this;

		$( '.visual-editor .help' )
				.clickover(
						{
							placement: 'bottom',
							'global_close': true,
							'html': true,
							'content': function() {
								return $( '<div>' )
										.append(
												$( '<span>' )
														.html(
																'This is a basic textual representation of the SPARQL query.<br/>If your query doesn\'t work well, please give ' ),
												$( '<a>' )
														.text( 'feedback here!' )
														.attr( 'href',
																'https://www.mediawiki.org/w/index.php?title=Talk:Wikidata_query_service&action=edit&section=new' )
														.attr( 'target', '_B' ) );
							}
						} );

		$( '.shortUrlTrigger.query' ).clickover(
				{
					placement: 'left',
					'global_close': true,
					'html': true,
					'content': function() {
						self._updateQueryUrl();
						return '<iframe class="shortUrl" src="' + SHORTURL_API +
								encodeURIComponent( window.location ) + '">';
					}
				} );

		$( '.shortUrlTrigger.result' ).clickover(
				{
					placement: 'left',
					'global_close': true,
					'html': true,
					'content': function() {
						self._updateQueryUrl();
						var $link = $( '<a>' ).attr( 'href', 'embed.html' + window.location.hash );
						return '<iframe class="shortUrl" src="' + SHORTURL_API +
								encodeURIComponent( $link[0].href ) + '">';
					}
				} );

		$( '.embed.result' ).clickover(
				{
					placement: 'left',
					'global_close': true,
					'html': true,
					'content': function() {
						self._updateQueryUrl();

						var b = '';
						if ( self._selectedResultBrowser ) {
							b = '#defaultView:' + self._selectedResultBrowser + '\n';
							b = encodeURIComponent( b );
						}
						var $link = $( '<a>' ).attr( 'href',
								'embed.html#' + b + window.location.hash.substring( 1 ) );
						var $html = $( '<textarea>' ).text(
								'<iframe style="width:80vw; height:50vh;" scrolling="yes" frameborder="0" src="' +
										$link[0].href + '">' ).click( function() {
							$html.select();
						} );

						return $html;
					}
				} );
	};

	/**
	 * @private
	 */
	SELF.prototype._initHandlersDownloads = function() {

		var api = this._sparqlApi;
		var DOWNLOAD_FORMATS = {
			'CSV': {
				handler: $.proxy( api.getResultAsCsv, api ),
				mimetype: 'text/csv;charset=utf-8'
			},
			'JSON': {
				handler: $.proxy( api.getResultAsJson, api ),
				mimetype: 'application/json;charset=utf-8'
			},
			'TSV': {
				handler: $.proxy( api.getSparqlTsv, api ),
				mimetype: 'text/tab-separated-values;charset=utf-8'
			},
			'Simple TSV': {
				handler: $.proxy( api.getSimpleTsv, api ),
				mimetype: 'text/tab-separated-values;charset=utf-8',
				ext: 'tsv'
			},
			'Full JSON': {
				handler: $.proxy( api.getResultAsAllJson, api ),
				mimetype: 'application/json;charset=utf-8',
				ext: 'json'
			}
		};

		var downloadHandler = function( filename, handler, mimetype ) {
			return function( e ) {
				e.preventDefault();

				if ( api.getResultLength() === null ) {
					return '';
				}

				// see: http://danml.com/download.html
				download( handler(), filename, mimetype );
			};
		};

		for ( var format in DOWNLOAD_FORMATS ) {
			var extension = DOWNLOAD_FORMATS[format].ext || format.toLowerCase();
			var formatName = format.replace( /\s/g, '-' );
			$( '#download' + formatName ).click(
					downloadHandler( 'query.' + extension, DOWNLOAD_FORMATS[format].handler,
							DOWNLOAD_FORMATS[format].mimetype ) );
		}
	};

	/**
	 * @private
	 */
	SELF.prototype._initResultBrowserMenu = function() {
		$.each( this._resultBrowsers, function( key, b ) {
			var $element = $( '<li><a class="result-browser" href="#">' +
					'<span class="glyphicon glyphicon-' + b.icon + '"></span>' + b.label +
					'</a></li>' );
			$element.appendTo( $( '#result-browser-menu' ) );
			b.$element = $element;
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._handleQuerySubmit = function( e ) {
		var self = this;

		e.preventDefault();
		this._editor.save();
		this._updateQueryUrl();
		this._actionBar.show( 'wdqs-action-query', 'info', 100 );

		$( '#query-result' ).empty().hide();
		$( '.query-total' ).hide();
		$( '#execute-button' ).prop( 'disabled', true );
		$( '#query-error' ).hide();

		this._sparqlApi.query( this._editor.getValue() ).done(
				$.proxy( this._handleQueryResult, this ) ).fail( function() {
			self._handleQueryError( self._sparqlApi.getErrorMessage() );
		} );

		$( '.queryUri' ).attr( 'href', self._sparqlApi.getQueryUri() );
	};

	/**
	 * @private
	 */
	SELF.prototype._handleQueryError = function( error ) {
		$( '#query-error' ).html( $( '<pre>' ).text( error ) ).show();

		try {
			var shortError = error.match(
					/(java\.util\.concurrent\.ExecutionException\:)+(.*)(Exception\:)+(.*)/ ).pop().trim();
			shortError = QUERY_ERROR_MAP[ shortError ] || shortError;

			this._actionBar.show( shortError, 'danger' );
		} catch ( e ) {
		}

		$( '#execute-button' ).prop( 'disabled', false );

		this._editor.highlightError( error );
	};

	/**
	 * @private
	 */
	SELF.prototype._handleQueryResult = function() {
		var api = this._sparqlApi;

		$( '#total-results' ).text( api.getResultLength() );
		$( '#query-time' ).text( api.getExecutionTime() );
		$( '.query-total' ).show();
		$( '#execute-button' ).prop( 'disabled', false );

		var defaultBrowser = this._createResultBrowsers( api.getResultRawData() );
		this._drawResult( defaultBrowser );
		this._selectedResultBrowser = null;

		return false;
	};

	/**
	 * @private
	 * @return {Object} default result browser
	 */
	SELF.prototype._createResultBrowsers = function( resultData ) {

		var defaultBrowser = this._getDefaultResultBrowser();

		// instantiate
		$.each( this._resultBrowsers, function( key, b ) {
			var instance = new wikibase.queryService.ui.resultBrowser[b.class]();
			if ( defaultBrowser === null || defaultBrowser === key ) {
				defaultBrowser = instance;
			}
			b.object = instance;
		} );

		// wire up
		$.each( this._resultBrowsers, function( key, b ) {
			defaultBrowser.addVisitor( b.object );
			b.object.setResult( resultData );
		} );

		return defaultBrowser;
	};

	/**
	 * @private
	 */
	SELF.prototype._getDefaultResultBrowser = function() {
		var match = this._editor.getValue().match( /#defaultView:(\w+)/ );

		if ( match && this._resultBrowsers[match[1]] ) {
			return match[1];
		}

		return null;
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

					$( '#query-result' ).html( '' );
					self._drawResult( b.object );
					self._selectedResultBrowser = key;
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

		this._actionBar.show( 'wdqs-action-render', 'success', 100 );
		window.setTimeout( function() {
			try {
				$( '#query-result' ).show();
				resultBrowser.draw( $( '#query-result' ) );
				self._actionBar.hide();
			} catch ( e ) {
				self._actionBar.show( 'wdqs-action-error-display', 'warning' );
				window.console.log( e.stack );
			}

			self._handleQueryResultBrowsers();
		}, 20 );
	};
	/**
	 * @private
	 */
	SELF.prototype._handleNamespaceSelected = function( e ) {
		var ns,
			uri = e.target.value,
			current = this._editor.getValue();

		if ( current.indexOf( '<' + uri + '>' ) === -1 ) {
			ns = $( e.target ).find( ':selected' ).text();
			this._editor.setValue( 'PREFIX ' + ns + ': <' + uri + '>\n' + current );
		}

		// reselect group label
		e.target.selectedIndex = 0;
	};

	/**
	 * @private
	 */
	SELF.prototype._updateQueryUrl = function() {
		if ( this._isHistoryDisabled ) {
			return;
		}

		var hash = encodeURIComponent( this._editor.getValue() );
		hash = hash.replace( /[!'()*]/g, function( c ) {
			return '%' + c.charCodeAt( 0 ).toString( 16 );
		} );

		if ( window.location.hash !== hash ) {
			if ( window.history.pushState ) {
				window.history.pushState( null, null, '#' + hash );
			} else {
				window.location.hash = hash;
			}
		}
	};

	return SELF;

}( jQuery, mediaWiki, download, EXPLORER, window, _, Cookies, moment ) );
