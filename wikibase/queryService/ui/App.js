var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
window.mediaWiki = window.mediaWiki || {};

wikibase.queryService.ui.App = ( function( $, mw ) {
	"use strict";

	var SHORTURL = '//tinyurl.com/create.php?url=';
	var SHORTURL_API = '//tinyurl.com/api-create.php?url=';

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
	 * @param {wikibase.queryService.ui.editor.Editor}
	 * @param {wikibase.queryService.api.Sparql}
	 */
	function SELF( $element, editor, sparqlApi, querySamplesApi ) {

		this._$element = $element;
		this._editor = editor;
		this._sparqlApi = sparqlApi;
		this._querySamplesApi = querySamplesApi;

		this._init();
	}

	/**
	 * @property {string}
	 * @private
	 **/
	SELF.prototype._$element = null;

	/**
	 * @property {wikibase.queryService.api.Sparql}
	 * @private
	 **/
	SELF.prototype._sparqlApi = null;

	/**
	 * @property {wikibase.queryService.api.QuerySamplesApi}
	 * @private
	 **/
	SELF.prototype._querySamplesApi = null;

	/**
	 * @property {wikibase.queryService.ui.editor.Editor}
	 * @private
	 **/
	SELF.prototype._editor = null;

	/**
	 * @property {boolean}
	 * @private
	 **/
	SELF.prototype._autoExecuteQuery = false;

	/**
	 * @property {Object}
	 * @private
	 **/
	SELF.prototype._resultBrowsers = {
			TableResultBrowser: {icon: 'th', label: 'Table', object: null, $element: null },
			ImageResultBrowser: {icon: 'picture', label: 'Image Grid', object: null, $element: null },
			CoordinateResultBrowser: {icon: 'map-marker', label: 'Map', object: null, $element: null }
	};

	/**
	 * Initialize private members and call delegate to specific init methods
	 * @private
	 **/
	SELF.prototype._init = function() {

		if( !this._sparqlApi ){
			this._sparqlApi = new wikibase.queryService.api.Sparql();
		}

		if( !this._querySamplesApi ){
			this._querySamplesApi = new wikibase.queryService.api.QuerySamples();
		}

		if( !this._editor ){
			this._editor = new wikibase.queryService.ui.editor.Editor();
		}

		this._initApp();
		this._initEditor();
		this._initExamples();
		this._initDataUpdated();
		this._initQuery();
		this._initRdfNamespaces();
		this._initHandlers();
		this._initResultBrowserMenu();

		if( this._autoExecuteQuery ){
			$( '#execute-button' ).click();
		}
	};

	/**
	 * @private
	 **/
	SELF.prototype._initApp = function() {

/* SM: disabled direct results for now
		if( location.hash.indexOf( '#result#' ) === 0 ){
			this._toggleCollapse( true );
			this._autoExecuteQuery = true;
		}
*/
	};

	/**
	 * @private
	 **/
	SELF.prototype._initEditor = function() {

		this._editor.fromTextArea( this._$element.find( '.queryEditor' )[0] );
		this._editor.addKeyMap( 'Ctrl-Enter',  $.proxy( this._handleQuerySubmit, this ) );
	};

	/**
	 * @private
	 **/
	SELF.prototype._initExamples = function() {
		var self = this;
		new wikibase.queryService.ui.QueryExampleDialog( $( '#QueryExamples' ), this._querySamplesApi, function( query, title ){
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
		var category, select, ns, container = $( '.namespace-shortcuts' ),
			namespaces = wikibase.queryService.RdfNamespaces.NAMESPACE_SHORTCUTS;

		container.click( function( e ) {
			e.stopPropagation();
		} );

		// add namespaces to dropdowns
		for ( category in namespaces ) {
			select = $( '<select>' )
				.attr( 'class', 'form-control' )
				.append( $( '<option>' ).text( category ) )
				.appendTo( container );
			for ( ns in namespaces[category] ) {
				select.append( $( '<option>' ).text( ns ).attr( {
					value: namespaces[category][ns]
				} ) );
			}
		}
	};

	/**
	 * @private
	 **/
	SELF.prototype._initQuery = function() {
		if ( window.location.hash !== '' ) {
			if( location.hash.indexOf( '#result#' ) === 0 ){
				location.hash = location.hash.replace( '#result#', '#' );
			}

			this._editor.setValue( decodeURIComponent( window.location.hash.substr( 1 ) ) );
			this._editor.refresh();
		}else{

			if( location.search === ( '?new' )){
				return;
			}
			this._editor.restoreValue();
		}
	};



	/**
	 * @private
	 **/
	SELF.prototype._initDataUpdated = function() {
		this._sparqlApi.queryDataUpdatedTime().done( function( time ){
			$( '#dbUpdated' ).text( time );
		} ).fail(function(){
			$( '#dbUpdated' ).text( '[unable to connect]' );
		});
	};


	/**
	 * @private
	 **/
	SELF.prototype._initHandlers = function() {
		var self = this;

		$( '#query-form' ).submit(  $.proxy( this._handleQuerySubmit, this ) );
		$( '.namespace-shortcuts' ).on( 'change', 'select', $.proxy( this._handleNamespaceSelected, this ) );

		$( '.addPrefixes' ).click( function() {
			var prefixes = wikibase.queryService.RdfNamespaces.STANDARD_PREFIXES.join( '\n' );
			self._editor.prepandValue( prefixes + '\n\n' );
		} );

		$( '#clear-button' ).click( function () {
			self._editor.setValue( '' );
		} );

		$( '.explorer-close' ).click( function( e ){
			e.preventDefault();
			$( '.explorer-panel' ).hide();
		} );

		$( window ).on( 'popstate', $.proxy( this._initQuery, this ) );

		this._initPopovers();
		this._initHandlersDownloads();
	};

	/**
	 * @private
	 **/
	SELF.prototype._initPopovers= function() {
		var self = this;

		//Closes popover when clicked somewhere else
		$('body').on('click', function (e) {
		    if ($(e.target).data('toggle') !== 'popover'
		        && $(e.target).parents('.popover.in').length === 0) {
		        //$('[data-toggle="popover"]').popover('hide');
		        $('.popover').remove();
		    }
		});


		$( '.shortUrlTrigger' ).click( function( e ){
			var $target = $( e.target );
			self._updateQueryUrl();
			$target.attr( 'href', SHORTURL + encodeURIComponent( window.location ) );

			var sharedLocation = new URL( window.location );
/*
SM: disabled direct results for now
		if( $target.hasClass( 'result' ) ){
				sharedLocation.hash =  '#result' + sharedLocation.hash;
			}
*/
			$target.popover({
	    		placement : 'left',
	    		'html':true,
	    		'content':function(){
	    			return '<iframe class="shortUrl" src="' + SHORTURL_API + encodeURIComponent( sharedLocation.toString() ) +   '">';
	    		}
	    	});
			$target.popover('show');

			return false;
		} );
	};

	/**
	 * @private
	 **/
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

			return function ( e ) {
				e.preventDefault();

				if ( api.getResultLength() === null ) {
					return '';
				}

				// see: http://danml.com/download.html
				download(handler(), filename, mimetype);
			};
		};

		for ( var format in DOWNLOAD_FORMATS ) {
			var extension = DOWNLOAD_FORMATS[format].ext || format.toLowerCase();
			var formatName = format.replace( /\s/g, '-' );
			$( '#download' + formatName ).click(
					downloadHandler( 'query.' + extension,	DOWNLOAD_FORMATS[format].handler,
							DOWNLOAD_FORMATS[format].mimetype )
			 );
		}
	};


	/**
	 * @private
	 **/
	SELF.prototype._initResultBrowserMenu = function() {

		$.each( this._resultBrowsers, function( key, b ){
			var $element = $( '<li><a class="result-browser" href="#">' +
				'<span class="glyphicon glyphicon-'+ b.icon +'"></span>' + b.label + '</a></li>' );
			$element.appendTo( $( '#result-browser-menu' ) );
			b.$element = $element;
		} );

	};

	/**
	 * @private
	 **/
	SELF.prototype._handleQuerySubmit = function( e ) {
		var self = this;

		e.preventDefault();
		this._editor.save();
		this._updateQueryUrl();

		$( '#query-result' ).empty( '' );
		$( '#query-result' ).hide();
		$( '.query-total' ).hide();
		$( '.actionMessage' ).show();
		$( '.actionMessage' ).text( 'Running query...' );
		$( '#execute-button' ).prop('disabled', true);
		$( '#query-error' ).hide();
		$( '#query-error-short' ).hide();


		this._sparqlApi.query( this._editor.getValue() )
		.done( $.proxy( this._handleQueryResult, this ) )
		.fail(function(){
			self._handleQueryError( self._sparqlApi.getErrorMessage() );
		} );

		$( '.queryUri' ).attr( 'href',self._sparqlApi.getQueryUri() );
	};


	/**
	 * @private
	 **/
	SELF.prototype._handleQueryError = function( error ) {
		$( '.actionMessage' ).hide();
		$( '#query-error' ).html( $( '<pre>' ).text( error ) ).show();

		try {
			var shortError = error.match( /(java\.util\.concurrent\.ExecutionException\:)+(.*)(Exception\:)+(.*)/ ).pop();
			$( '#query-error-short' ).show().text( shortError.trim() );
		} catch (e) {}

		$( '#execute-button' ).prop('disabled', false);

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
		$( '.actionMessage' ).hide();
		$( '#execute-button' ).prop('disabled', false);

		var $queryResult = $( '#query-result' ),
			result = api.getResultRawData();

		if ( typeof  result.boolean === 'boolean' ){
			$queryResult.text( result.boolean );
			$queryResult.show();
			return false;
		}

		var defaultBrowser = null;
		$.each( this._resultBrowsers, function( className, b ){
			var instance = new wikibase.queryService.ui.resultBrowser[ className ]();
			instance.setResult ( api.getResultRawData() );

			if( !defaultBrowser ){
				defaultBrowser = instance;
			} else {
				defaultBrowser.addVisitor( instance );
			}

			b.object = instance;
		} );

		defaultBrowser.draw( $queryResult );
		$queryResult.show();

		this._handleQueryResultBrowsers();
		return false;
	};

	/**
	 * @private
	 */
	SELF.prototype._handleQueryResultBrowsers = function() {
		$.each( this._resultBrowsers, function( key, b ){
			if( b.object.isDrawable() ){
				b.$element.css( 'opacity', 1 ).attr( 'href', '#' );
				b.$element.click( function(){
					$(this).closest( '.open' ).removeClass( 'open' );

					$( '#query-result' ).html( 'Loading...' );
					window.setTimeout( function() {
						b.object.draw( $( '#query-result' ) );
					}, 20 );
					return false;
				} );
			} else {
				b.$element.off( 'click' );
				b.$element.css( 'opacity', 0.5 ).removeAttr( 'href' );
			}
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._handleNamespaceSelected = function( e ) {
		var ns, uri = e.target.value, current = this._editor.getValue();

		if ( current.indexOf( '<' + uri + '>' ) === -1 ) {
			ns = $( e.target ).find(':selected').text();
			this._editor.setValue('PREFIX ' + ns + ': <' + uri + '>\n' + current);
		}

		// reselect group label
		e.target.selectedIndex = 0;
	};

	/**
	 * @private
	 */
	SELF.prototype._updateQueryUrl = function() {
		var hash = encodeURIComponent( this._editor.getValue() );
		if ( window.location.hash !== hash ) {
			window.location.hash = hash;
		}
	};

	/**
	 * @private
	 */
	SELF.prototype._toggleCollapse = function( collapse ) {
		if( collapse === true ){
			$( '#query-box' ).hide();
			$( '#header-navbar-collapse' ).css('visibility', 'hidden');
			$( '.navbar-toggle' ).show();

			$( '.navbar-toggle' ).click( $.proxy(this._toggleCollapse, this) );
		}else{
			$( '#query-box' ).show();
			this._editor.refresh();
			$( '#header-navbar-collapse' ).css('visibility', 'visible');
			if ( $( '#header-navbar-collapse' ).is(':visible') ) {
				$( '.navbar-toggle.collapsed ' ).hide();
			}
		}
	};

	return SELF;
}( jQuery, mediaWiki, download, EXPLORER ) );
