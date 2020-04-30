( function ( $, Cookies ) {
	'use strict';

	var DISMISS_BANNER_COOKIE = 'dismiss-query-builder-discovery-feedback-banner',
		feedbackEndDate = new Date( '2020-05-10' );

	if ( !Cookies.get( DISMISS_BANNER_COOKIE ) &&
		( new Date() ).getTime() < feedbackEndDate.getTime() &&
		window.location.host === 'query.wikidata.org' ) {
		var $feedbackBanner = $( '#query-builder-discovery-feedback' );

		$feedbackBanner.delay( 3000 ).slideDown();
		$feedbackBanner.find( '.close' ).click( function () {
			Cookies.set( DISMISS_BANNER_COOKIE, true );
			$feedbackBanner.hide();
		} );
	}
} )( jQuery, Cookies );
