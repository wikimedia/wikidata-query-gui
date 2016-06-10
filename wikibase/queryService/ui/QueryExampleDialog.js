var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};

wikibase.queryService.ui.QueryExampleDialog = ( function( $ ) {
	'use strict';

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
	 * Initialize private members and call delegate to specific init methods
	 *
	 * @private
	 */
	SELF.prototype._init = function() {
		if ( !this._querySamplesApi ) {
			this._querySamplesApi = new wikibase.queryService.api.QuerySamples();
		}

		this._initFilter();
		this._initExamples();
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
		var self = this;

		this._querySamplesApi.getExamples().done( function( examples ) {
			self._examples = examples;
			self._initTagCloud();

			$.each( examples, function( key, example ) {
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
		var self = this;

		var link = $( '<a title="Select this query" data-dismiss="modal">' ).text( title ).attr(
				'href', '#' ).click( function() {
			self._callback( query, title );
		} ), edit = $( '<a title="Edit this Query">' ).attr( 'href', href ).attr( 'target',
				'_blank' ).append(
				'<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>' ), preview = $(
				'<span class="glyphicon glyphicon-eye-open" aria-hidden="true"></span>' ).popover(
				{
					placement: 'bottom',
					trigger: 'hover',
					container: 'body',
					title: 'Preview',
					content: $( '<pre/>' ).text( query ),
					html: true
				} );

		tags = $( '<td/>' ).text( tags.join( '|' ) ).hide();
		var example = $( '<tr/>' );
		example.append( $( '<td/>' ).append( link ).append( ' ', edit ) );
		example.append( $( '<td/>' ).append( preview ) );
		example.append( tags );

		this._$element.find( '.searchable' ).append( example );
	};

	/**
	 * @private
	 */
	SELF.prototype._filterTable = function() {

		var filter = this._$element.find( '.tableFilter' ), filterRegex = new RegExp( filter.val(),
				'i' );

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
		this._$element.find( '.searchable tr' ).filter( function() {
			return filterRegex.test( $( this ).text() ) && tagFilter( $( this ).text() );
		} ).show();

	};

	return SELF;
}( jQuery ) );
