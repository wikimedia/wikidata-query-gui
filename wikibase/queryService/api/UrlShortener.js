var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.api = wikibase.queryService.api || {};

wikibase.queryService.api.UrlShortener = ( function ( $ ) {
    'use strict';

    /*
     * Service callbacks.
     * The callback should accept URL and return either HTML or a promise,
     * which should resolve to the shortened URL.
     */
    var SERVICE_PROVIDERS = {
        'tinyurl': function( url ) {
            return this._getTinyUrl( url );
        },
        // WMF production shortener, lives on Meta wiki
        'wmf': function( url ) {
            return this._getWikiShort( url, 'meta.wikimedia.org' );
        },
        // Do not use this one in production! This is for testing only!
        'wikibeta': function( url ) {
            return this._getWikiShort( url, 'en.wikipedia.beta.wmflabs.org' );
        }
    };

    /**
     * URL shortener service abstraction.
     *
     * @class wikibase.queryService.api.UrlShortener
     * @license GNU GPL v2+
     *
     * @author Stanislav Malyshev
     * @constructor
     */
    function SELF( serviceType ) {
        this._service =  SERVICE_PROVIDERS[serviceType] || this._badService;
    }

    /**
     * Service provider chosen by config.
     * @type {function}
     * @private
     */
    SELF.prototype._service = null;

    /**
     * Shorten given URL.
     *
     * @param {string} url URL to be shortened
     * @return {string} HTML to display.
     */
    SELF.prototype.shorten = function( url ) {
        // FIXME: due to the way popover works, this gets called twice
        // we may want to consider short-term caching maybe, or some kind of debouncing?
        var urlDiv =  'url-shortener-id-' + $.now();
        $.when( this._service.call( this, url ) ).then( function( resolved ) {
                $( '#' + urlDiv ).html( resolved );
        } );
        return '<div class="shortUrl" id="' + urlDiv + '">' +
            wikibase.queryService.ui.i18n.getMessage( 'wdqs-app-urlshortener-loading' ) + '</div>';
    };

    SELF.prototype._badService = function( url ) {
        return wikibase.queryService.ui.i18n.getMessage( 'wdqs-app-urlshortener-bad-service' );
    };

    SELF.prototype._getTinyUrl = function( url ) {
        var TINYURL_API = '//tinyurl.com/api-create.php?url=';

        return '<iframe ' +
            'class="shortUrl" ' +
            'src="' + TINYURL_API + encodeURIComponent( url ) + '" ' +
            'referrerpolicy="origin" ' +
            'sandbox="" ' +
            '></iframe>';
    };

    SELF.prototype._getWikiShort = function( url, server ) {
        var deferred = $.Deferred();
        $.ajax( {
            'url': 'https://' + server + '/w/api.php',
            'data': {
                'action': 'shortenurl',
                'format': 'json',
                'origin': '*',
                'url': url
            },
            'dataType': 'json',
            'method': 'POST'
        } ).done( function( data ) {
            if ( data && !data.error && data.shortenurl && data.shortenurl.shorturl ) {
                deferred.resolve( data.shortenurl.shorturl );
            } else {
                deferred.resolve( wikibase.queryService.ui.i18n.getMessage( 'wdqs-app-urlshortener-failed' ) );
            }
        } ).fail( function() {
            deferred.resolve( wikibase.queryService.ui.i18n.getMessage( 'wdqs-app-urlshortener-failed' ) );
        } );
        return deferred;
    };

    return SELF;

}( jQuery ) );
