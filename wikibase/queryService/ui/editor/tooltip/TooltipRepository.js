var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.editor = wikibase.queryService.ui.editor || {};
wikibase.queryService.ui.editor.tooltip = wikibase.queryService.ui.editor.tooltip || {};

wikibase.queryService.ui.editor.tooltip.TooltipRepository = function ( api, initialLanguage, $ ) {
	'use strict';

	var lang = initialLanguage;

	function createLabelDescriptionTooltip( label, description, id ) {
		if ( !label.value && !description.value ) {
			return null;
		}
		var $title = $( '<span>' ).attr( 'lang', label.language ).text( label.value );
		var $idNode = $( '<span>' ).text( '(' + id + ')' );
		var $heading = $( '<span>' ).append( $title, ' ', $idNode );
		var $description = $( '<small>' ).attr( 'lang', description.language ).text( description.value );
		return $( '<div>' ).append( $heading, '<br>', $description );
	}

	// TODO: would be nice to add the datatype here
	function getTooltipForLabelDescriptionEntity( entityId ) {
		return api.getEntitiesData( [ entityId ], lang ).then( function ( entitiesData ) {
			var entityData = entitiesData.get( entityId );
			if ( entityData.missing !== undefined ) {
				return null;
			}
			var label = entityData.labels[lang] || {};
			var description = entityData.descriptions[lang] || {};

			return createLabelDescriptionTooltip( label, description, entityId );
		} );
	}

	function createLexemeTooltip( lemmas, languageLabel, lexCatLabel, lexemeId ) {
		var $lemmasAsSpans = Object.keys( lemmas ).map( function ( lemmaLang ) {
			var lemmaValue = lemmas[lemmaLang].value;
			return $( '<span>' ).attr( 'lang', lemmaLang ).text( lemmaValue );
		} );
		var $title = $lemmasAsSpans.reduce( function ( $acc, $lemma, index ) {
			if ( index > 0 ) {
				$acc.append( '/' );
			}
			return $acc.append( $lemma );
		}, $( '<span>' ) );
		var $idNode = $( '<span>' ).text( '(' + lexemeId + ')' );
		var $heading = $( '<span>' ).append( $title, ' ', $idNode );

		var $language = $( '<span>' ).attr( 'lang', languageLabel.language ).text( languageLabel.value );
		var $lexicalCategory = $( '<span>' ).attr( 'lang', lexCatLabel.language ).text( lexCatLabel.value );
		var $description = $( '<small>' ).append( $language, ', ', $lexicalCategory );

		return $( '<div>' ).append( $heading, '<br>', $description );
	}

	function getTooltipForLexeme( lexemeId ) {
		return api.getEntitiesData( [ lexemeId ], lang ).then( function ( entitiesData ) {
			var lexemeData = entitiesData.get( lexemeId );
			if ( lexemeData.missing !== undefined ) {
				return null;
			}
			var languageId = lexemeData.language;
			var lexicalCategoryId = lexemeData.lexicalCategory;

			return api.getEntitiesData( [ languageId, lexicalCategoryId ], lang ).then( function ( entitiesData ) {
				var languageData = entitiesData.get( languageId );
				var lexicalCategoryData = entitiesData.get( lexicalCategoryId );
				var languageLabel = languageData.labels && languageData.labels[lang] || { value: languageId, language: lang };
				var lexicalCategoryLabel = lexicalCategoryData.labels && lexicalCategoryData.labels[lang] || { value: lexicalCategoryId, language: lang };

				return createLexemeTooltip( lexemeData.lemmas, languageLabel, lexicalCategoryLabel, lexemeId );
			} );
		} );
	}

	return {
		getTooltipContentForId: function ( id ) {
			if ( id.match( /^[Q|P]\d+$/ ) ) {
				return getTooltipForLabelDescriptionEntity( id );
			}

			if ( id.match( /^L\d+$/ ) ) {
				return getTooltipForLexeme( id );
			}

			throw new Error( 'Unknown entity type for id: ' + id );
		},
		setLanguage: function ( newLanguage ) { lang = newLanguage; }
	};
};
