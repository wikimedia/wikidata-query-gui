var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.CodeSamples = ( function ( $ ) {
	'use strict';

	/**
	 * CodeSamples API for the Wikibase query service
	 *
	 * @class wikibase.queryService.api.CodeSamples
	 * @license GNU GPL v2+
	 *
	 * @author Lucas Werkmeister
	 * @author Jonas Kress
	 * @constructor
	 */
	function SELF( endpoint, root ) {
		this._endpoint = endpoint;
		this._languages = {
			URL: {
				code: function( query ) {
					return endpoint + '?query=' + encodeURIComponent( query );
				}
			},
			HTML: {
				code: function( query ) {
					return '<iframe style="width: 80vw; height: 50vh; border: none;" ' +
						'src="' + root + '/embed.html#' +
						encodeURIComponent( query ) + '" ' +
						'referrerpolicy="origin" ' +
						'sandbox="allow-scripts allow-same-origin allow-popups"></iframe>';
				},
				mimetype: 'text/html'
			},
			PHP: {
				escape: function( query ) {
					var escapedQuery = query
						.replace( /\\/g, '\\\\' )
						.replace( /"/g, '\\"' )
						.replace( /\$/g, '\\$' )
						.replace( /\n/g, '\\n' );
					return '"' + escapedQuery + '"';
				}
			},
			JavaScript: {
				escape: function( query ) {
					var escapedQuery = query
						.replace( /\\/g, '\\\\' )
						.replace( /"/g, '\\"' )
						.replace( /\n/g, '\\n' );
					return '"' + escapedQuery + '"';
				},
				mimetype: 'application/javascript'
			},
			Java: {
				escape: function( query ) {
					var escapedQuery = query
						.replace( /\\/g, '\\\\' )
						.replace( /"/g, '\\"' )
						.replace( /\n/g, '\\n' );
					return '"' + escapedQuery + '"';
				}
			},
			Python: {
				escape: function( query ) {
					var escapedQuery = query
						.replace( /\\/g, '\\\\' )
						.replace( /"/g, '\\"' )
						.replace( /\n/g, '\\n' );
					return '"' + escapedQuery + '"';
				}
			},
			Ruby: {
				escape: function( query ) {
					var escapedQuery = query
						.replace( /\\/g, '\\\\' )
						.replace( /"/g, '\\"' )
						.replace( /#/g, '\\#' )
						.replace( /\n/g, '\\n' );
					return '"' + escapedQuery + '"';
				}
			},
			R: {
				escape: function( query ) {
					var escapedQuery = query
						.replace( /\\/g, '\\\\' )
						.replace( /'/g, '\\\'' )
						.replace( /\n/g, '\\n' );
					return '\'' + escapedQuery + '\'';
				},
				mimetype: 'text/x-rsrc'
			},
			Matlab: {
				escape: function( query ) {
					var escapedQuery = query
						.replace( /\\/g, '\\\\' )
						.replace( /'/g, '\'\'' )
						.replace( /\n/g, '\\n' );
					return '\'' + escapedQuery + '\'';
				},
				mimetype: 'text/x-octave'
			},
			listeria: {
				escape: function( query ) {
					var escapedQuery = query
						.replace( /\|/g, '{{!}}' )
						.replace( /}}/g, '} }' ); // TODO try to exactly preserve query
					return escapedQuery;
				}
			}
		};
	}

	/**
	 * @property {string}
	 * @private
	 */
	SELF.prototype._endpoint = null;

	/**
	 * @return {jQuery.Promise} Object taking list of example queries { title:, query: }
	 */
	SELF.prototype.getExamples = function ( currentQuery ) {
		var self = this,
			deferred = new $.Deferred(),
			data = {},
			loadFiles = [];

		$.each( this._languages, function ( name, language ) {
			data[name] = {
				mimetype: 'mimetype' in language ?
					language.mimetype :
					'text/x-' + name.toLowerCase()
			};
			var query = currentQuery;
			if ( 'escape' in language ) {
				query = language.escape( query );
			}
			if ( 'code' in language ) {
				data[name].code = language.code( query );
			} else {
				loadFiles.push(
					$.get(
						'examples/code/' + name + '.txt',
						function ( code ) {
							data[name].code = code
								.replace( '{ENDPOINT_URL}', self._endpoint )
								.replace( '{SPARQL_QUERY}', query );
						},
						'text'
					)
				);
			}
		} );

		$.when.apply( $, loadFiles ).then( function () {
			deferred.resolve( data );
		} );

		return deferred.promise();
	};

	return SELF;

}( jQuery ) );
