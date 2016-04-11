( function ( $, config ) {
	'use strict';

	$( document ).ready( function () {
		new wikibase.queryService.ui.App(
				$( '.wikibase-queryservice ' ),
				null,
				new wikibase.queryService.ui.visualEditor.VisualEditor( config.visualEditor.entitySearchEndpointPath ),
				new wikibase.queryService.api.Sparql( config.api.sparql.uri )
		);
	} );

} )( jQuery, CONFIG );