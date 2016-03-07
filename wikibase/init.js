( function ( $, config ) {
	'use strict';

	$( document ).ready( function () {
		new wikibase.queryService.ui.App( $( '.wikibase-queryservice ' ), null,
				new wikibase.queryService.api.Sparql( config.api.sparql.uri )
		);
	} );

} )( jQuery, CONFIG );