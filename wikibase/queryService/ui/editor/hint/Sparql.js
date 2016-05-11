var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.editor = wikibase.queryService.ui.editor || {};
wikibase.queryService.ui.editor.hint = wikibase.queryService.ui.editor.hint || {};

( function( $, wb ) {
	'use strict';

	var MODULE = wb.queryService.ui.editor.hint;

	var SPARQL_KEYWORDS = [
			'SELECT', 'SELECT * WHERE {\n\n}', 'OPTIONAL', 'OPTIONAL {\n\n}', 'WHERE',
			'WHERE {\n\n}', 'ORDER', 'ORDER BY', 'DISTINCT', 'SERVICE',
			'SERVICE wikibase:label {\n bd:serviceParam wikibase:language "en" .\n}', 'BASE',
			'PREFIX', 'REDUCED', 'FROM', 'LIMIT', 'OFFSET', 'HAVING', 'UNION', 'SAMPLE',
			'(SAMPLE() AS )', 'COUNT', '(COUNT() AS )', 'DESC', 'DESC()', 'ASC', 'ASC()',
			'FILTER ()', 'FILTER NOT EXISTS', 'FILTER NOT EXISTS {\n\n}', 'UNION', 'UNION {\n\n}',
			'BIND', 'BIND ()', 'GROUP_CONCAT', '(GROUP_CONCAT() as )', 'ORDER BY',
			'#defaultView:Map', '#defaultView:ImageGrid'
	];

	var SPARQL_PREDICATES = [
			'wikibase:rank', 'wikibase:badge', 'wikibase:propertyType', 'wikibase:directClaim',
			'wikibase:claim', 'wikibase:statementProperty', 'wikibase:statementValue',
			'wikibase:qualifier', 'wikibase:qualifierValue', 'wikibase:referenceValue',
			'wikibase:Reference', 'wikibase:TimeValue', 'wikibase:QuantityValue',
			'wikibase:GlobecoordinateValue', 'wikibase:Dump', 'wikibase:PreferredRank',
			'wikibase:NormalRank', 'wikibase:DeprecatedRank', 'wikibase:BestRank',
			'wikibase:WikibaseItem', 'wikibase:CommonsMedia', 'wikibase:Globecoordinate',
			'wikibase:Monolingualtext', 'wikibase:Quantity', 'wikibase:String', 'wikibase:Time',
			'wikibase:Url', 'rdfs:about', 'schema:name', 'schema:description', 'rdfs:label'
	];

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
	 **/
	SELF.prototype.getHint = function( editorContent, lineContent, lineNum, cursorPos ) {
		var currentWord = this._getCurrentWord( lineContent, cursorPos ), hintList = [], deferred = new $.Deferred();

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

		return list;
	};

	SELF.prototype._getDefinedVariables = function( text ) {
		var variables = {};

		$.each( text.split( /\s/ ), function( key, word ) {
			word = word.trim();
			if ( word.match( /^\?\w+$/ ) ) {
				variables[ word ] = true;
			}
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

		while ( line.charAt( pos ).match( /[\w?#]/ ) ) {
			pos--;
			if ( pos < 0 ) {
				break;
			}
		}
		var left = pos + 1;

		pos = position;
		while ( line.charAt( pos ).match( /[\w]/ ) ) {
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

}( jQuery, wikibase ) );
