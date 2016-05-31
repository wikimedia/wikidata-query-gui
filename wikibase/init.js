( function( $, config, moment ) {
	'use strict';

	var wb = wikibase.queryService;

	function setLanguage( lang ) {
		Cookies.set( 'lang', lang );

		$.i18n.debug = true;
		$.i18n().locale = lang;
		moment.locale( lang );

		$.when(
			$.i18n().load( 'i18n/' + lang + '.json', lang ),
			$.i18n().load( 'vendor/jquery.uls/i18n/' + lang + '.json', lang )
		).done( function() {
			$( '.wikibase-queryservice' ).i18n();
			$( 'html' ).attr( 'lang', lang );
			$( 'html' ).attr( 'dir', $.uls.data.getDir( lang ) );
		} );
	}

	$( document ).ready(
		function() {
			var lang = Cookies.get( 'lang' ) ? Cookies.get( 'lang' ) : config.language;
			setLanguage( config.language );//always load default language as fallback language
			setLanguage( lang );

			var api = new wb.api.Wikibase( config.api.wikibase.uri );
			api.setLanguage( lang );
			var languageSelector = new wb.ui.i18n.LanguageSelector( $( '.uls-trigger' ), api, lang );
			languageSelector.setChangeListener( function( lang ) {
				api.setLanguage( lang );
				setLanguage( lang );
			} );

			var rdfHint = new wb.ui.editor.hint.Rdf( api );
			var rdfTooltip = new wb.ui.editor.tooltip.Rdf( api );

			new wb.ui.App( $( '.wikibase-queryservice ' ), new wb.ui.editor.Editor( rdfHint,
					null, rdfTooltip ), new wb.ui.visualEditor.VisualEditor( api ),
					new wb.api.Sparql( config.api.sparql.uri ) );
		} );

} )( jQuery, CONFIG, moment );
