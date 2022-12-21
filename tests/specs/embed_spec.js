/* jshint strict: false */
// eslint-disable-next-line no-redeclare -- jshint needs to be told about require and browser
/* globals require, describe, it, browser, $ */
var assert = require( 'assert' );

describe( 'embed.html', function () {
	it( 'loads results for query', function () {
		var query =
			'SELECT ?item ?itemLabel ?other WHERE { '
			+ ' VALUES (?item ?itemLabel ?other) { '
			+ '     (wd:Q42 "Douglas Adams"@en "1952-03-11T00:00:00Z"^^xsd:dateTime) '
			+ '     (wd:Q80 "Tim Berners-Lee"@de <http://commons.wikimedia.org/wiki/Special:FilePath/Sir%20Tim%20Berners-Lee%20%28cropped%29.jpg>)'
			+ ' } }';

		var url = browser.options.baseUrl + '/embed.html#' + encodeURI( query );
		browser.url( url );

		return $( '#query-result' ).then( function ( element ) {
			element.waitForDisplayed();

			return $( '#query-result tr' );
		} ).then( function ( resultRows ) {
			resultRows.waitForDisplayed();

			return resultRows.getText();
		} ).then( function ( resultHeaders ) {
			assert( resultHeaders.includes( 'item' ) );
			assert( resultHeaders.includes( 'other' ) );
			assert( resultHeaders.includes( 'itemLabel' ) );
		} );
	} );
} );
