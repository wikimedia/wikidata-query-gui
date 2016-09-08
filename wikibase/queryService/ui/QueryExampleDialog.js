var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};

wikibase.queryService.ui.QueryExampleDialog = ( function( $ ) {
	'use strict';

	var TRACKING_NAMESPACE = 'wikibase.queryService.ui.examples.';

	/**
	 * A ui dialog for selecting a query example
	 *
	 * @class wikibase.queryService.ui.App
	 * @license GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 *
	 * @param {jQuery} $element
	 * @param {wikibase.queryService.api.QuerySamples} querySamplesApi
	 * @param {Function} callback that is called when selecting an example
	 */
	function SELF( $element, querySamplesApi, callback ) {

		this._$element = $element;
		this._querySamplesApi = querySamplesApi;
		this._callback = callback;

		this._init();
	}

	/**
	 * @property {wikibase.queryService.api.QuerySamples}
	 * @private
	 */
	SELF.prototype._querySamplesApi = null;

	/**
	 * @property {Function}
	 * @private
	 */
	SELF.prototype._callback = null;

	/**
	 * @property {Function}
	 * @private
	 */
	SELF.prototype._examples = null;

	/**
	 * @property {wikibase.queryService.api.Tracking}
	 * @private
	 */
	SELF.prototype._trackingApi = null;

	/**
	 * Initialize private members and call delegate to specific init methods
	 *
	 * @private
	 */
	SELF.prototype._init = function() {
		if ( !this._querySamplesApi ) {
			this._querySamplesApi = new wikibase.queryService.api.QuerySamples();
		}

		if ( !this._trackingApi ) {
			this._trackingApi = new wikibase.queryService.api.Tracking();
		}

		this._initFilter();
		this._initExamples();

		var self = this;
		this._$element.focus( function() {
			self._$element.find( '.tableFilter' ).focus();
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._initFilter = function() {
		var self = this;

		this._$element.find( '.tableFilter' ).keyup( $.proxy( this._filterTable, this ) );

		// tags
		this._$element.find( '.tagFilter' ).tags( {
			afterAddingTag: $.proxy( this._filterTable, this ),
			afterDeletingTag: function() {
				self._filterTable();
				self._drawTagCloud( true );
			}
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._initExamples = function() {
		var self = this,
			category = null;

		this._querySamplesApi.getExamples().done( function( examples ) {
			self._examples = examples;
			self._initTagCloud();

			$.each( examples, function( key, example ) {
				if ( example.category !==  category ) {
					category = example.category;
					self._$element.find( '.searchable' ).append( $( '<tr>' ).addClass( 'active' )
							.append( $( '<td colspan="3">' ).text( category ) ) );
				}
				self._addExample( example.title, example.query, example.href, example.tags );
			} );
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._initTagCloud = function() {
		var self = this;

		var interval = window.setInterval( function() {
			if ( self._$element.is( ':visible' ) ) {
				self._drawTagCloud();
				clearInterval( interval );
			}
		}, 300 );
	};

	/**
	 * @private
	 */
	SELF.prototype._drawTagCloud = function( redraw ) {
		var self = this;

		var jQCloudTags = [];
		$.each( this._getCloudTags(), function( tag, weight ) {
			jQCloudTags.push( {
				text: tag,
				weight: weight,
				link: '#',
				html: {
					title: weight + ' match(es)'
				},
				handlers: {
					click: function( e ) {
						self._$element.find( '.tagFilter' ).tags().addTag( $( this ).text() );
						self._drawTagCloud( true );
						return false;
					}
				}
			} );
		} );

		if ( redraw ) {
			$( '.tagCloud' ).jQCloud( 'update', jQCloudTags );
			return;
		}

		$( '.tagCloud' ).jQCloud( jQCloudTags, {
			delayedMode: true,
			autoResize: true
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._getCloudTags = function() {
		var self = this;

		// filter tags that don't effect the filter for examples
		var tagsFilter = function( tags ) {
			var selectedTags = self._$element.find( '.tagFilter' ).tags().getTags(), matches = true;
			if ( selectedTags.length === 0 ) {
				return true;
			}

			$.each( selectedTags, function( key, selectedTag ) {
				if ( tags.indexOf( selectedTag ) === -1 ) {
					matches = false;
				}
			} );

			return matches;
		};

		// filter selected tags from tag cloud
		var tagFilter = function( tag ) {
			var selectedTags = self._$element.find( '.tagFilter' ).tags().getTags();
			if ( selectedTags.indexOf( tag ) === -1 ) {
				return false;
			}

			return true;
		};

		var tagCloud = {};
		$.each( self._examples, function( key, example ) {

			if ( !tagsFilter( example.tags ) ) {
				return;
			}

			$.each( example.tags, function( key, tag ) {

				if ( tagFilter( tag ) ) {
					return;
				}

				if ( !tagCloud[tag] ) {
					tagCloud[tag] = 1;
				} else {
					tagCloud[tag]++;
				}
			} );
		} );

		return tagCloud;
	};

	/**
	 * @private
	 */
	SELF.prototype._addExample = function( title, query, href, tags ) {
		var self = this,
			link = $( '<a title="Select" data-dismiss="modal">' ).text( title ).attr( 'href', '#' )
					.click( function() {
						self._callback( query, title );
						self._track( 'select' );
					} ),
			edit = $( '<a title="Edit">' ).attr( 'href', href ).attr( 'target', '_blank' )
					.append( '<span>' ).addClass( 'glyphicon glyphicon-pencil' )
					.click( function() {
						self._track( 'edit' );
					} ),

			source = $( '<span>' ).addClass( 'glyphicon glyphicon-eye-open' ).popover(
				{
					placement: 'bottom',
					trigger: 'hover',
					container: 'body',
					title: $.i18n( 'wdqs-dialog-examples-preview-query' ),
					content: $( '<pre style="white-space:pre-line; word-break:break-word;"/>' ).text( query ),
					html: true
				} ),
			preview = $( '<a href="#">' ).addClass( 'glyphicon glyphicon-camera' ).clickover(
				{
					placement: 'left',
					'global_close': true,
					trigger: 'click',
					container: 'body',
					title: $.i18n( 'wdqs-dialog-examples-preview-result' ),
					content: $( '<iframe width="400" height="350" frameBorder="0" src="embed.html#'
							+ encodeURIComponent( query ) + '">' ),
					html: true
				} )
				.click( function() {
					self._track( 'preview' );
				} );
			$( '.exampleTable' ).scroll( function() {
			if ( preview.clickover ) {
				preview.clickover( 'hide' ).removeAttr( 'data-clickover-open' );
			}
		} );

		tags = $( '<td>' ).text( tags.join( '|' ) ).hide();

		var example = $( '<tr>' );
		example.append( $( '<td>' ).append( link ).append( ' ', edit ) );
		example.append( $( '<td>' ).append( preview ) );
		example.append( $( '<td>' ).append( source ) );
		example.append( tags );

		this._$element.find( '.searchable' ).append( example );
	};

	/**
	 * @private
	 */
	SELF.prototype._filterTable = function() {
		var filter = this._$element.find( '.tableFilter' ),
			filterRegex = new RegExp( filter.val(), 'i' );

		var tags = this._$element.find( '.tagFilter' ).tags().getTags();

		var tagFilter = function( text ) {
			var matches = true;
			text = text.toLowerCase();

			$.each( tags, function( key, tag ) {
				if ( text.indexOf( tag.toLowerCase() ) === -1 ) {
					matches = false;
				}
			} );

			return matches;
		};

		this._$element.find( '.searchable tr' ).hide();
		var $matchingElements = this._$element.find( '.searchable tr' ).filter( function() {
			return filterRegex.test( $( this ).text() ) && tagFilter( $( this ).text() );
		} );

		$matchingElements.show();
		$matchingElements.each( function( i, el ) {
			$( el ).prevAll( 'tr.active' ).first().show();
		} );
	};

	/**
	 * @private
	 */
	SELF.prototype._track = function( metricName, value, valueType ) {
		this._trackingApi.track( TRACKING_NAMESPACE + metricName, value, valueType );
	};

	return SELF;
}( jQuery ) );
