( function ( $, config ) {
	'use strict';

	$( document ).ready( function () {
		var wikibaseApi = new wikibase.queryService.api.Wikibase( config.api.wikibase.uri );
		var rdfHint = new wikibase.queryService.ui.editor.hint.Rdf( wikibaseApi );
		var rdfTooltip = new wikibase.queryService.ui.editor.tooltip.Rdf( wikibaseApi );

		new wikibase.queryService.ui.App(
				$( '.wikibase-queryservice ' ),
				new wikibase.queryService.ui.editor.Editor( rdfHint, null, rdfTooltip ),
				new wikibase.queryService.ui.visualEditor.VisualEditor( wikibaseApi ),
				new wikibase.queryService.api.Sparql( config.api.sparql.uri )
		);
	} );

} )( jQuery, CONFIG );