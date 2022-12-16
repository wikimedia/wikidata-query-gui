( function ( $, QUnit, sinon, wb ) {
	'use strict';

	var Wikibase = wb.queryService.api.Wikibase;

	const getNewApi = ( fakeApiResponses ) => {
		const endpoint = 'https://example.com/w/api.php';
		const api = new Wikibase( endpoint );
		const apiResponseGenerator = function*() {
			for ( const fakeApiResponse of fakeApiResponses ) {
				yield Promise.resolve( fakeApiResponse );
			}
		};
		const apiResponseIterator = apiResponseGenerator();
		const apiResponseProvider = () => apiResponseIterator.next().value;
		sinon.replace(
			$,
			'ajax',
			sinon.fake( apiResponseProvider )
		);
		return api;
	};

	const getFailureMessage = ( actual, expected ) => {
		return `Expected ${JSON.stringify( expected, null, 2 )} to match actual ${JSON.stringify( actual, null, 2 )}`;
	};

	QUnit.module( 'wikibase.queryService.api.Wikibase', ( hooks ) => {
		hooks.afterEach( () => {
			sinon.restore();
		} );
		QUnit.module( 'getEntitiesData' );

		QUnit.test( 'calls API and caches response for id + lang', async ( assert ) => {
			const fakeEntityData = {};
			const api = getNewApi( [ { entities: { Q1: fakeEntityData } } ] );

			const firstResponse = await api.getEntitiesData( [ 'Q1' ], 'de' );
			const secondResponse = await api.getEntitiesData( [ 'Q1' ], 'de' );

			assert.ok( jQuery.ajax.calledOnce );
			const expectedAjaxArgs = [ { url: 'https://example.com/w/api.php?origin=*&action=wbgetentities&props=labels%7Cdescriptions&format=json&languages=de&languagefallback=1&ids=Q1' } ];
			const actualAjaxArgs = jQuery.ajax.args[0];
			assert.deepEqual(
				actualAjaxArgs,
				expectedAjaxArgs,
				getFailureMessage(
					actualAjaxArgs,
					expectedAjaxArgs
				)
			);
			assert.strictEqual( firstResponse.get( 'Q1' ), fakeEntityData );
			assert.strictEqual( secondResponse.get( 'Q1' ), fakeEntityData );
		} );

		QUnit.test( 'only calls API for ids + lang that are not yet cached', async ( assert ) => {
			const api = getNewApi( [ { entities: { Q1: {} } }, { entities: { Q2: {}, Q3: {} } } ] );

			const firstResponse = await api.getEntitiesData( [ 'Q1' ], 'de' );
			const secondResponse = await api.getEntitiesData( [ 'Q1', 'Q2', 'Q3' ], 'de' );

			assert.strictEqual( jQuery.ajax.callCount, 2 );

			const expectedAjaxArgsFirstCall = [ { url: 'https://example.com/w/api.php?origin=*&action=wbgetentities&props=labels%7Cdescriptions&format=json&languages=de&languagefallback=1&ids=Q1' } ];
			const actualAjaxArgsFirstCall = jQuery.ajax.args[0];
			assert.deepEqual(
				actualAjaxArgsFirstCall,
				expectedAjaxArgsFirstCall,
				getFailureMessage(
					actualAjaxArgsFirstCall,
					expectedAjaxArgsFirstCall
				)
			);

			const expectedAjaxArgsSecondCall = [ { url: 'https://example.com/w/api.php?origin=*&action=wbgetentities&props=labels%7Cdescriptions&format=json&languages=de&languagefallback=1&ids=Q2%7CQ3' } ];
			const actualAjaxArgsSecondCall = jQuery.ajax.args[1];
			assert.deepEqual(
				actualAjaxArgsSecondCall,
				expectedAjaxArgsSecondCall,
				getFailureMessage(
					actualAjaxArgsSecondCall,
					expectedAjaxArgsSecondCall
				)
			);

			assert.deepEqual( Array.from( firstResponse.keys() ), [ 'Q1' ] );
			assert.deepEqual( Array.from( secondResponse.keys() ), [ 'Q1', 'Q2', 'Q3' ] );
		} );

		QUnit.test( 'calls API again if language changes', async ( assert ) => {
			const fakeEntityDataDe = {};
			const fakeEntityDataFr = {};
			const api = getNewApi( [ { entities: { Q1: fakeEntityDataDe } }, { entities: { Q1: fakeEntityDataFr } } ] );

			const firstResponse = await api.getEntitiesData( [ 'Q1' ], 'de' );
			const secondResponse = await api.getEntitiesData( [ 'Q1' ], 'fr' );

			assert.strictEqual( jQuery.ajax.callCount, 2 );

			const expectedAjaxArgsFirstCall = [ { url: 'https://example.com/w/api.php?origin=*&action=wbgetentities&props=labels%7Cdescriptions&format=json&languages=de&languagefallback=1&ids=Q1' } ];
			const actualAjaxArgsFirstCall = jQuery.ajax.args[0];
			assert.deepEqual(
				actualAjaxArgsFirstCall,
				expectedAjaxArgsFirstCall,
				getFailureMessage(
					actualAjaxArgsFirstCall,
					expectedAjaxArgsFirstCall
				)
			);

			const expectedAjaxArgsSecondCall = [ { url: 'https://example.com/w/api.php?origin=*&action=wbgetentities&props=labels%7Cdescriptions&format=json&languages=fr&languagefallback=1&ids=Q1' } ];
			const actualAjaxArgsSecondCall = jQuery.ajax.args[1];
			assert.deepEqual(
				actualAjaxArgsSecondCall,
				expectedAjaxArgsSecondCall,
				getFailureMessage(
					actualAjaxArgsSecondCall,
					expectedAjaxArgsSecondCall
				)
			);

			assert.strictEqual( firstResponse.get( 'Q1' ), fakeEntityDataDe );
			assert.strictEqual( secondResponse.get( 'Q1' ), fakeEntityDataFr );
		} );
	} );
}( jQuery, QUnit, sinon, wikibase ) );
