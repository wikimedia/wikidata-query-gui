var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.editor = wikibase.queryService.ui.editor || {};
wikibase.queryService.ui.editor.hint = wikibase.queryService.ui.editor.hint || {};

( function( $, wb ) {
	'use strict';

	var MODULE = wb.queryService.ui.editor.hint;

	var SPARQL_KEYWORDS = [];
	var SPARQL_PREDICATES = [];
	var SPARQL_CUSTOM_FUNCTIONS = [];

	// This regex matches all variables, including the ? at the start.
	var VARNAME = new RegExp( wikibase.queryService.VariableNames.VariablePattern, 'g' );

	// This regex is used to move back to the beginning of a word.
	// It matches all characters which are valid in a variable name
	// plus ?, #, and :, because those are also relevant for autocompletion.
	var WORD_BEGIN = new RegExp( '[' + wikibase.queryService.VariableNames.ValidCharacters + '?#:]' );

	// This regex is used to move forward to the end of a word.
	// It matches all characters which are valid in a variable name
	// plus : because that is also relevant for autocompletion.
	var WORD_END = new RegExp( '[' + wikibase.queryService.VariableNames.ValidCharacters + ':]' );

	/**
	 * Code completion for Wikibase entities RDF prefixes in SPARQL completes SPARQL keywords and ?variables
	 *
	 * @class wikibase.queryService.ui.editor.hint.Sparql licence GNU GPL v2+
	 *
	 * @author Jonas Kress
	 * @constructor
	 */
	var SELF = MODULE.Sparql = function Sparql() {
	};

	/**
	 * Get list of hints
	 *
	 * @return {jQuery.Promise} Returns the completion as promise ({list:[], from:, to:})
	 */
	SELF.prototype.getHint = function( editorContent, lineContent, lineNum, cursorPos ) {
		var currentWord = this._getCurrentWord( lineContent, cursorPos ),
			hintList = [],
			deferred = new $.Deferred();

		if ( currentWord.word.indexOf( '?' ) === 0 ) {
			hintList = hintList.concat( this._getVariableHints( currentWord.word, this
					._getDefinedVariables( editorContent ) ) );
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

		$.each( SPARQL_KEYWORDS, function( key, keyword ) {
			if ( keyword.toLowerCase().indexOf( term.toLowerCase() ) >= 0 ) {
				list.push( keyword );
			}
		} );

		$.each( SPARQL_PREDICATES, function( key, keyword ) {
			if ( keyword.toLowerCase().indexOf( term.toLowerCase() ) === 0 ) {
				list.push( keyword );
			}
		} );

		$.each( SPARQL_CUSTOM_FUNCTIONS, function( key, keyword ) {
			if ( keyword.toLowerCase().indexOf( term.toLowerCase() ) === 0 ) {
				list.push( keyword );
			}
		} );

		return list;
	};

	SELF.prototype._getDefinedVariables = function( text ) {
		var variables = {};

		$.each( text.match( VARNAME ), function( key, word ) {
			variables[ word ] = true;
		} );

		return Object.keys( variables );
	};

	SELF.prototype._getVariableHints = function( term, variables ) {
		var list = [];

		if ( !term || term === '?' ) {
			return variables;
		}

		$.each( variables, function( key, variable ) {
			if ( variable.toLowerCase().indexOf( term.toLowerCase() ) === 0 ) {
				list.push( variable );
			}
		} );

		return list;
	};

	SELF.prototype._getHintCompletion = function( currentWord, list, lineNumber ) {
		var completion = {
			list: []
		};
		completion.from = {
			line: lineNumber,
			char: currentWord.start
		};
		completion.to = {
			line: lineNumber,
			char: currentWord.end
		};
		completion.list = list;

		return completion;
	};

	SELF.prototype._getCurrentWord = function( line, position ) {
		var pos = position - 1;

		if ( pos < 0 ) {
			pos = 0;
		}

		while ( WORD_BEGIN.test( line.charAt( pos ) ) ) {
			pos--;
			if ( pos < 0 ) {
				break;
			}
		}
		var left = pos + 1;

		pos = position;
		while ( WORD_END.test( line.charAt( pos ) ) ) {
			pos++;
			if ( pos >= line.length ) {
				break;
			}
		}
		var right = pos;
		var word = line.substring( left, right );
		return {
			word: word,
			start: left,
			end: right
		};
	};

	SELF.prototype.setKeywords = function( keywords ) {
		SPARQL_KEYWORDS = keywords;
	};
	SELF.prototype.setPredicates = function( predicates ) {
		SPARQL_PREDICATES = predicates;
	};
	SELF.prototype.setCustomFunctions = function( customFunctions ) {
		SPARQL_CUSTOM_FUNCTIONS = customFunctions;
	};


}( jQuery, wikibase ) );
