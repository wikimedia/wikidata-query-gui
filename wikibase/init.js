( function ( $ ) {
	'use strict';

	$( document ).ready( function () {
		new wikibase.queryService.ui.App( $( '.wikibase-queryservice ' ) );
	} );

} )( jQuery );
