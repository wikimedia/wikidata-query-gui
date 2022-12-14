var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.Wikibase = ( function( $ ) {
	'use strict';

	var QUERY_SAMPLES_TAGS_LABELS_JSON = 'europeana/query-samples-tags-labels.json';
	var TOOLTIPS_EDM_JSON = 'europeana/tooltips-edm.json';
	var QUERY_LANGUGES = {
		action: 'query',
		meta: 'siteinfo',
		format: 'json',
		siprop: 'languages'
	},
	QUERY_DATATYPE = {
		action: 'wbgetentities',
		props: 'datatype',
		format: 'json'
	};


	/**
	 * API for the Wikibase Europeana API
	 *
	 * @class wikibase.queryService.api.Wikibase
	 * @license GNU GPL v2+
	 *
	 * @author Srdjan Stevanetic
	 * @constructor
	 * @param {string} endpoint default: ''
	 */
	function SELF( endpoint, defaultLanguage ) {
		if ( defaultLanguage ) {
			this._language = defaultLanguage;
		}
	}

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._language = null;

	/**
	 * Search an entity
	 *
	 * @param {string} term search string
	 * @param {string} type entity type to search for
	 * @param {string} language of search string default:en
	 *
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.searchEntities = function( term, type, language ) {
		var deferred = $.Deferred();

		$.getJSON( TOOLTIPS_EDM_JSON )
			.fail( function( jqXHR, textStatus, errorThrown ) {
				console.error( 'Failed loading the tooltipc edm json: ' + textStatus + ", " + errorThrown );
				deferred.reject();
			} ).then(function( allTooltips ) {
				var tooltip=[];
				$.each(allTooltips , function(index, item) { 
					if(item.id.localeCompare(term)==0) {
						tooltip.push(item);
						return false;	
					}
				});		
				
				return deferred.resolve({"search":tooltip});			
		});
		
		return deferred.promise();
			
	};

	/**
	 * List of supported languages
	 *
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.getLanguages = function() {
		return this._query( QUERY_LANGUGES );
	};

	/**
	 * Get labels for given entities
	 *
	 * @param {string|string[]} ids entity IDs
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.getLabels = function( ids ) {
		return $.getJSON( QUERY_SAMPLES_TAGS_LABELS_JSON )
			.fail( function( jqXHR, textStatus, errorThrown ) {
				console.error( 'Failed loading the query samples tags labels json: ' + textStatus + ", " + errorThrown );
				throw errorThrown;
			} );
	};

	/**
	 * Get datatype of property
	 *
	 * @param {string} id property ID
	 * @return {jQuery.Promise}
	 */
	SELF.prototype.getDataType = function( id ) {
		var query = QUERY_DATATYPE,
			deferred = $.Deferred();

		query.ids = id;

		this._query( query ).done( function( data ) {
			if ( data.entities && data.entities[id] && data.entities[id].datatype ) {
				deferred.resolve( data.entities[id].datatype );
			}
			deferred.reject();

		} ).fail( deferred.reject );

		return deferred.promise();
	};

	/**
	 * @private
	 */
	SELF.prototype._query = function( query ) {
		return $.ajax( {
			url: this._endpoint + '?origin=*&' + jQuery.param( query )
		} );
	};

	/**
	 * Set the default language
	 *
	 * @param {string} language of search string default:en
	 */
	SELF.prototype.setLanguage = function( language ) {
		this._language = language;
	};

	return SELF;

}( jQuery ) );
