( function( $, QUnit, sinon, download, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.ui.App' );

	QUnit.test( 'DownloadJS works with utf-8 ', function( assert ) {

		var stubAppendChild = sinon.stub( window.document.body, 'appendChild' ),
			stubSetTimeout = sinon.stub( window, 'setTimeout' ),
			data = '{ "foo": "testöäüРоссийская中华人民共和国😀🤩𝄞😈" }',
			filename = 'file.json',
			mimetype =  'application/json;charset=utf-8',
			done = assert.async();

		// download.js uses body.appendChild(), so stub that for our test
		stubAppendChild.callsFake( function ( a ) {
			var url = $( a ).attr( 'href' );

			$.ajax( { url: url, dataType: 'text' } ).then( function ( response ) {
				assert.strictEqual( data, response, 'original data and blob data should be the same' );

				URL.revokeObjectURL( url );
				stubAppendChild.restore();
				window.document.body.appendChild( a );
				done();
			} );
		} );

		// download.js also calls setTimeout(), with a delay that is sometimes too short
		// (before our $.ajax() is complete); just increase the delay a bit
		stubSetTimeout.callsFake( function ( callback, delay ) {
			stubSetTimeout.restore();
			setTimeout( callback, delay + 1000 );
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
