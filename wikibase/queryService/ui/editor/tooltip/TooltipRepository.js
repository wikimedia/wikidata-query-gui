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

	return {
		getTooltipContentForId: function ( id ) {
			if ( id.match( /^[Q|P]\d+$/ ) ) {
				return getTooltipForLabelDescriptionEntity( id );
			}

			throw new Error( 'Unknown entity type for id: ' + id );
		},
		setLanguage: function ( newLanguage ) { lang = newLanguage; }
	};
};
