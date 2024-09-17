( function ( $, CONFIG, moment ) {
	'use strict';

	$.when( CONFIG.getConfig(), $.ready ).then( function ( config ) {
		var wb = wikibase.queryService,
			lang = Cookies.get( 'lang' ) ? Cookies.get( 'lang' ) : config.language,
			banner = config.banners[config.bannerName] || null,
			app;

		function setExamplesHelpLink( url ) {
			$( 'a#examples-link' ).attr( 'href', url );
		}

		function setBrand( lang ) {
			$( '.navbar-brand img' ).attr( 'src', config.brand.logo );
			$( '.navbar-brand a > span' ).text( config.brand.title );
			document.title = config.brand.title;
			$( 'a#copyright-link' ).attr( 'href', config.brand.copyrightUrl );
			$( '#favicon' ).attr( 'href', config.brand.favicon );
			// Contacting using "?" means root query builder URL can't have any argument.
			// This should be changed once we support ES6 only and then we can simply use URL()
			$( '.query-builder-toggle' ).attr( 'href', config.api['query-builder'].server + '?' + $.param( { uselang: lang || 'en' } ) );
		}

		function setLogoutLink() {
			if ( config.logout ) {
				var $link = $( '<a id="logout" data-i18n="wdqs-app-logout">' ).attr( 'href', config.logout.url );
				var $entry = $( '<li>' ).append( $link );
				$( 'ul#right-navbar' ).append( $entry );
			}
		}

		function setLanguage( lang, save, callback ) {
			if ( save ) {
				Cookies.set( 'lang', lang );
			}

			$.i18n.debug = true;
			$.i18n().locale = lang;
			moment.locale( lang );

			$.when(
				config.i18nLoad( lang )
			).done( function () {
				$( '.wikibase-queryservice' ).i18n();
				$( '#keyboardShortcutHelpModal' ).i18n();

				if ( banner ) {
					$( '.' + banner.i18nKey ).i18n();
				}

				if ( config.bannerName === 'query-builder' ) {
					// If the query builder banner message exists, update the link to the correct
					// language of query builder
					$( '.wdqs-app-query-builder-banner-content a' ).attr(
						'href',
						$( '.query-builder-toggle' ).attr( 'href' )
					);
				}

				$( 'html' ).attr( { lang: lang, dir: $.uls.data.getDir( lang ) } );
				app.resizeNavbar();
				if ( callback ) {
					callback();
				}
			} );
		}

		setBrand( lang );
		setLogoutLink();
		wb.ui.resultBrowser.helper.FormatterHelper.initMoment();

		$( '#query-form' ).attr( 'action', config.api.sparql.uri );
		var api = new wb.api.Wikibase( config.api.wikibase.uri, lang ),
			sparqlApi = new wb.api.Sparql( config.api.sparql.uri, lang ),
			sparqlApiHelper = new wb.api.Sparql( config.api.sparql.uri, lang ),
			querySamplesApi = new wb.api.QuerySamples(
				lang,
				config.api.examples
			),
			codeSamplesApi = new wb.api.CodeSamples(
				config.api.sparql.uri,
				config.location.root,
				config.location.index
			),
			shortenApi = new wb.api.UrlShortener( config.api.urlShortener ),
			languageSelector = new wb.ui.i18n.LanguageSelector( $( '.uls-trigger' ), api, lang );

		setExamplesHelpLink( querySamplesApi.getExamplesPageUrl() );

		var isTopWindow = window.top === window;

		var tooltipRepository = wb.ui.editor.tooltip.TooltipRepository( api, lang, $ );
		var rdfHint = new wb.ui.editor.hint.Rdf( api ),
			rdfTooltip = new wb.ui.editor.tooltip.Rdf( tooltipRepository ),
			editor = new wb.ui.editor.Editor( rdfHint, null, rdfTooltip, { focus: isTopWindow } );

		if ( config.prefixes ) {
			wb.RdfNamespaces.addPrefixes( config.prefixes );
		}

		function afterLanguageChange() {
			editor.updatePlaceholder();
		}

		setLanguage( lang, false, afterLanguageChange );

		languageSelector.setChangeListener( function ( lang ) {
			api.setLanguage( lang );
			sparqlApi.setLanguage( lang );
			sparqlApiHelper.setLanguage( lang );
			querySamplesApi.setLanguage( lang );
			tooltipRepository.setLanguage( lang );
			setLanguage( lang, true, afterLanguageChange );
		} );

		app = new wb.ui.App(
			$( '.wikibase-queryservice ' ),
			editor,
			new wb.ui.queryHelper.QueryHelper( api, sparqlApiHelper ),
			sparqlApi,
			querySamplesApi,
			api,
			codeSamplesApi,
			shortenApi,
			config.api['query-builder'].server,
			banner
		);
	} );

} )( jQuery, CONFIG, moment );
