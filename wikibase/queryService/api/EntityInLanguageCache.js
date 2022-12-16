var wikibase = window.wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.EntityInLanguageCache = function () {
	'use strict';

	var cache = new Map();

	function getCacheKey( key, language ) {
		return key + '_' + language;
	}

	return {
		hasKeyInLanguage: function ( key, language ) {
			return cache.has( getCacheKey( key, language ) );
		},
		setKeyInLanguage: function ( key, language, value ) {
			cache.set( getCacheKey( key, language ), value );
		},
		getKeyInLanguage: function ( key, language ) {
			return cache.get( getCacheKey( key, language ) );
		},
		getDataForKeysInLanguage: function ( keys, language ) {
			return keys.reduce( function ( resultMap, key ) {
				resultMap.set( key, cache.get( getCacheKey( key, language ) ) );
				return resultMap;
			}, new Map() );
		}
	};

};
