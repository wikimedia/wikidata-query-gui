( function( $, config, moment ) {
	'use strict';

	var wb = wikibase.queryService;

	function setBrand() {
		$( '.navbar-brand img' ).attr( 'src', config.brand.logo );
		$( '.navbar-brand a > span' ).text( config.brand.title );
	}

	function setLanguage( lang, save ) {
		if ( save ) {
			Cookies.set( 'lang', lang );
		}

		$.i18n.debug = true;
		$.i18n().locale = lang;
		moment.locale( lang );

		$.when(
			config.i18nLoad( lang )
		).done( function() {
			$( '.wikibase-queryservice' ).i18n();
			$( 'html' ).attr( { lang: lang, dir: $.uls.data.getDir( lang ) } );
		} );
	}

	$( document ).ready(
		function() {
			setBrand();

			var lang = Cookies.get( 'lang' ) ? Cookies.get( 'lang' ) : config.language;
			setLanguage( lang, false );

			var api = new wb.api.Wikibase( config.api.wikibase.uri, lang ),
				sparqlApi = new wb.api.Sparql( config.api.sparql.uri, lang ),
				querySamplesApi = new wb.api.QuerySamples( lang ),
				languageSelector = new wb.ui.i18n.LanguageSelector( $( '.uls-trigger' ), api, lang );

			languageSelector.setChangeListener( function( lang ) {
				api.setLanguage( lang );
				sparqlApi.setLanguage( lang );
				querySamplesApi.setLanguage( lang );
				setLanguage( lang, true );
			} );

			var rdfHint = new wb.ui.editor.hint.Rdf( api );
			var rdfTooltip = new wb.ui.editor.tooltip.Rdf( api );

			new wb.ui.App(
				$( '.wikibase-queryservice ' ),
				new wb.ui.editor.Editor( rdfHint, null, rdfTooltip ),
				new wb.ui.queryHelper.QueryHelper( api, sparqlApi ),
				sparqlApi,
				querySamplesApi
			);
		} );

} )( jQuery, CONFIG, moment );
