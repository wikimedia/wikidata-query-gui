( function( $, config ) {
	'use strict';

	var wb = wikibase.queryService;

	$( document ).ready(
		function() {
			var lang = Cookies.get( 'lang' ) ? Cookies.get( 'lang' ) : config.language;

			var api = new wb.api.Wikibase( config.api.wikibase.uri );
			api.setLanguage( lang );
			var languageSelector = new wb.ui.i18n.LanguageSelector( $( '.uls-trigger' ), api, lang );
			languageSelector.setChangeListener( function( lang ) {
				Cookies.set( 'lang', lang );
				api.setLanguage( lang );
			} );

			var rdfHint = new wb.ui.editor.hint.Rdf( api );
			var rdfTooltip = new wb.ui.editor.tooltip.Rdf( api );

			new wb.ui.App( $( '.wikibase-queryservice ' ), new wb.ui.editor.Editor( rdfHint,
					null, rdfTooltip ), new wb.ui.visualEditor.VisualEditor( api ),
					new wb.api.Sparql( config.api.sparql.uri ) );
		} );

} )( jQuery, CONFIG );
