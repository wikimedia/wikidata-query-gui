var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.visualEditor = wikibase.queryService.ui.visualEditor || {};

wikibase.queryService.ui.visualEditor.QueryTemplate = ( function( $, wikibase ) {
	'use strict';

	/**
	 * A template for a SPARQL query
	 *
	 * @class wikibase.queryService.ui.visualEditor.QueryTemplate
	 * @license GNU GPL v2+
	 *
	 * @author Lucas Werkmeister
	 * @constructor
	 */
	function SELF() {
	}

	/**
	 * Splits the template 'a ?b c ?d e' into
	 * [ 'a ', '?b', ' c ', '?d', ' e' ].
	 * Text and variable fragments always alternate,
	 * and the first and last fragment are always text fragments
	 * ('' if the template begins or ends in a variable).
	 *
	 * @param {{template: string, variables: string[]}} definition
	 * @return {string[]}
	 */
	SELF._getQueryTemplateFragments = function( definition ) {
		if ( definition.template.match( /\0/ ) ) {
			throw new Error( 'query template must not contain null bytes' );
		}
		var fragments = [ definition.template ],
			variable,
			newFragments;

		function splitFragment( fragment ) {
			var textFragments = fragment
				.replace( new RegExp( '\\' + variable, 'g' ), '\0' )
				.split( '\0' );
			newFragments.push( textFragments[0] );
			for ( var i = 1; i < textFragments.length; i++ ) {
				newFragments.push( variable );
				newFragments.push( textFragments[ i ] );
			}
		}

		for ( variable in definition.variables ) {
			if ( !variable.match( /\?[a-z][a-z0-9]*/i ) ) {
				// TODO this is more restrictive than SPARQL;
				// see https://www.w3.org/TR/sparql11-query/#rVARNAME
				throw new Error( 'invalid variable name in query template' );
			}
			newFragments = [];
			fragments.forEach( splitFragment );
			fragments = newFragments;
		}

		return fragments;
	};

	return SELF;
}( jQuery, wikibase ) );
