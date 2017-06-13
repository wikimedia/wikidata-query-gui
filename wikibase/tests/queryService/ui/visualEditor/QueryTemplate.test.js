( function ( $, QUnit, sinon, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.ui.visualEditor' );

	var QueryTemplate = wb.queryService.ui.visualEditor.QueryTemplate;

	QUnit.test( '_getQueryTemplateFragments internal function', function( assert ) {
		assert.expect( 7 );

		assert.deepEqual(
			QueryTemplate._getQueryTemplateFragments( { template: 'a ?b c ?d e', variables: { '?b': {}, '?d': {} } } ),
			[ 'a ', '?b', ' c ', '?d', ' e' ],
			"fragments should be split correctly"
		);
		assert.deepEqual(
			QueryTemplate._getQueryTemplateFragments( { template: 'a ?b c ?d e ?f g', variables: { '?b': {}, '?d': {} } } ),
			[ 'a ', '?b', ' c ', '?d', ' e ?f g' ],
			"only variables mentioned in template should be replaced"
		);
		assert.deepEqual(
			QueryTemplate._getQueryTemplateFragments( { template: 'a ?b c ?b a', variables: { '?b': {} } } ),
			[ 'a ', '?b', ' c ', '?b', ' a' ],
			"variables occurring multiple times should work"
		);
		assert.deepEqual(
			QueryTemplate._getQueryTemplateFragments( { template: '?b a ?b', variables: { '?b': {} } } ),
			[ '', '?b', ' a ', '?b', '' ],
			"fragments should always begin and end with text fragment"
		);
		assert.deepEqual(
			QueryTemplate._getQueryTemplateFragments( { template: '', variables: { '?b': {} } } ),
			[ '' ],
			"empty template should convert to single empty fragment"
		);
		assert.throws(
			function() {
				QueryTemplate._getQueryTemplateFragments( { template: 'a \0 c', variables: { '?b': {} } } );
			},
			Error,
			"should not be possible to manipulate the fragment list via null bytes in template"
		);
		assert.throws(
			function() {
				QueryTemplate._getQueryTemplateFragments( { template: 'a b c', variables: { '.*': {} } } );
			},
			Error,
			"should not be possible to manipulate the fragment list via regex characters in variables"
		);
	} );
}( jQuery, QUnit, sinon, wikibase ) );
