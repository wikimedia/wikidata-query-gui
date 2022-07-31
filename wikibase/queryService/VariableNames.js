var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.VariableNames = {};

( function ( $, VariableNames ) {
	'use strict';

	// This follows the SPARQL 1.1 spec [1] minus \u10000-\uEFFFF
	// because Blazegraph currently doesn’t support astral planes.
	// BASE_LETTERS = PN_CHARS_BASE
	// FIRST_LETTER = PN_CHARS_BASE | '_' | [0-9]
	// NEXT_LETTERS = PN_CHARS_BASE | '_' | [0-9] | #x00B7 | [#x0300-#x036F] | #x203F | #x2040
	// where:
	// PN_CHARS_BASE = [A-Z] | [a-z] | [#x00C0-#x00D6] | [#x00D8-#x00F6] | [#x00F8-#x02FF] | [#x0370-#x037D] |
	//				 [#x037F-#x1FFF] | #x200C | #x200D | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] |
	//				 [#xF900-#xFDCF] | [#xFDF0-#xFFFD] (officially also [#x10000-#xEFFFF] but removed here)
	// In NEXT_LETTERS, the ranges [#x00F8-#x02FF], [#x0300-#x036F]
	// and [#x0370-#x037D] are simplified as [#x00F8-#x037D].
	//
	// VariablePattern matches a variable as defined by VARNAME.
	// PrefixPattern matches a prefix as defined by PN_PREFIX.
	// [1] https://www.w3.org/TR/sparql11-query/

	var BASE_LETTERS = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD';
	var FIRST_LETTER = BASE_LETTERS + '0-9_';
	var NEXT_LETTERS = FIRST_LETTER + '\u00B7\u0300-\u036F\u203F\u2040';

	// Regex pattern for matching a variable
	VariableNames.VariablePattern = '\\?' + '[' + FIRST_LETTER + '][' + NEXT_LETTERS + ']*';

	// Regex pattern for matching a prefix
	VariableNames.PrefixPattern = '[' + BASE_LETTERS + '](?:[' + NEXT_LETTERS + '.-]*[' + NEXT_LETTERS + '-])?';

	// Regex to match invalid characters
	var InvalidCharactersRegex = new RegExp( '[^' + NEXT_LETTERS + ']', 'g' );

	// Create a valid variable name from the input by replacing
	// invalid characters and adding a "?" to the beginning.
	VariableNames.makeVariableName = function ( name ) {
		return '?' + name.replace( InvalidCharactersRegex, '_' );
	};

	// Export this variable for use in Sparql.js
	VariableNames.ValidCharacters = NEXT_LETTERS;

} )( jQuery, wikibase.queryService.VariableNames );
