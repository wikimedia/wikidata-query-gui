var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.editor = wikibase.queryService.ui.editor || {};
wikibase.queryService.ui.editor.hint = wikibase.queryService.ui.editor.hint || {};

( function( $, wb ) {
	'use strict';

	var MODULE = wb.queryService.ui.editor.hint;

	var SPARQL_KEYWORDS = [
	                       'SELECT',
	                       'OPTIONAL',
	                       'WHERE',
	                       'ORDER',
	                       'ORDER BY',
	                       'DISTINCT',
	                       'WHERE {\n\n}',
	                       'SERVICE',
	                       'SERVICE wikibase:label {\n bd:serviceParam wikibase:language "en" .\n}',
	                       'BASE', 'PREFIX', 'REDUCED', 'FROM', 'LIMIT', 'OFFSET', 'HAVING',
	                       'UNION' ];

	/**
	 * Code completion for Wikibase entities RDF prefixes in SPARQL
	 * completes SPARQL keywords and ?variables
	 *
	 * licence GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 */
	var SELF = MODULE.Sparql = function Sparql() {
	};

	/**
	 * Get list of hints
	 *
	 * @return {jQuery.promise} Returns the completion as promise ({list:[], from:, to:})
	 **/
	SELF.prototype.getHint = function( editorContent, lineContent, lineNum, cursorPos ) {
		var currentWord = this._getCurrentWord( lineContent, cursorPos ),
		hintList = [],
		deferred = new $.Deferred();

		if ( currentWord.word.indexOf( '?' ) === 0 ) {
			hintList = hintList.concat( this._getVariableHints(
					currentWord.word,
					this._getDefinedVariables( editorContent )
			) );
		}

		hintList = hintList.concat( this._getSPARQLHints( currentWord.word ) );

		if ( hintList.length > 0 ) {
			var hint = this._getHintCompletion( currentWord, hintList, lineNum );
			return deferred.resolve( hint ).promise();
		}

		return deferred.reject().promise();
	};

	SELF.prototype._getSPARQLHints = function( term ) {
		var list = [];

		$.each( SPARQL_KEYWORDS, function ( key, keyword ) {
			if ( keyword.toLowerCase().indexOf( term.toLowerCase() ) === 0 ) {
				list.push( keyword );
			}
		} );

		return list;
	};

	SELF.prototype._getDefinedVariables = function( text ) {
		var variables = [];

		$.each( text.split( ' ' ), function ( key, word ) {
			if ( word.match( /^\?\w+$/ ) ) {
				variables.push( word );
			}
		} );

		return $.unique( variables );
	};

	SELF.prototype._getVariableHints = function( term, variables ) {
		var list = [];

		if ( !term || term === '?' ) {
			return variables;
		}

		$.each( variables, function ( key, variable ) {
			if ( variable.toLowerCase().indexOf( term.toLowerCase() ) === 0 ) {
				list.push( variable );
			}
		} );

		return list;
	};

	SELF.prototype._getHintCompletion = function( currentWord, list, lineNumber ) {
		var completion = { list: [] };
		completion.from = {line: lineNumber, char: currentWord.start };
		completion.to = {line: lineNumber, char: currentWord.end};
		completion.list = list;

		return completion;
	};

	SELF.prototype._getCurrentWord = function( line, position ) {
		var words = line.split( ' ' ), matchedWord = '', scannedPostion = 0;

		$.each( words, function ( key, word ) {
			scannedPostion += word.length;

			if ( key > 0 ) { // add spaces to position
				scannedPostion++;
			}

			if ( scannedPostion >= position ) {
				matchedWord = word;
				return;
			}
		} );

		return {
			word: matchedWord,
			start: scannedPostion - matchedWord.length,
			end: scannedPostion
		};
	};


}( jQuery, wikibase ) );
