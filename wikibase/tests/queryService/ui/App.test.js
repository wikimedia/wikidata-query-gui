( function( $, QUnit, sinon, download, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.ui.App' );

	QUnit.test( 'DownloadJS works with utf-8 ', function( assert ) {

		var stub = sinon.stub( window.document.body, 'appendChild' ),
			data = '{ "foo": "testöäüРоссийская中华人民共和国😀🤩𝄞😈" }',
			filename = 'file.json',
			mimetype =  'application/json;charset=utf-8',
			done = assert.async();

		stub.callsFake( function ( a ) {
			var url = $( a ).attr( 'href' ),
				xhr = new XMLHttpRequest();

		    xhr.open( 'GET', url, false );
		    xhr.send();
		    URL.revokeObjectURL( url );

			assert.strictEqual( data, xhr.responseText, 'original data and blob data should be the same' );
			stub.restore();
			window.document.body.appendChild( a );
			done();
		} );

		download( data, filename, mimetype );
	} );

	QUnit.test( '_updateTitle', function( assert ) {
		var originalTitle = document.title;
		try {
			document.title = '_updateTitle test';
			var app = Object.create( wb.queryService.ui.App.prototype );
			var query = '';
			app._editor = {
				getValue: function() {
					return query;
				},
			};
			app._originalDocumentTitle = document.title;

			query = '#title:custom title\nASK{}';
			app._updateTitle();
			assert.strictEqual( document.title, 'custom title - _updateTitle test' );

			query = '#defaultView:Map\n#title:other title\nASK{}';
			app._updateTitle();
			assert.strictEqual( document.title, 'other title - _updateTitle test' );

			query = 'ASK{}';
			app._updateTitle();
			assert.strictEqual( document.title, '_updateTitle test' );
		} finally {
			document.title = originalTitle;
		}
	} );

}( jQuery, QUnit, sinon, download, wikibase ) );
