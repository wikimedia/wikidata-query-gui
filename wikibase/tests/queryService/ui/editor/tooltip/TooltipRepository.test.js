( function ( QUnit, sinon, $, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.ui.editor.tooltip.TooltipRepository' );

	const tooltipRepositoryModule = wb.queryService.ui.editor.tooltip.TooltipRepository;

	const getApiStub = ( id, fakeWikidataResponse ) => {
		if ( Array.isArray( fakeWikidataResponse ) ) {
			const stub = sinon.stub();
			fakeWikidataResponse.forEach( function ( response, index ) {
				stub.onCall( index ).resolves( new Map( response ) );
			} );
			return stub;
		}
		const fakeApiResponse = new Map( [ [ id, fakeWikidataResponse ] ] );
		return sinon.stub().returns( Promise.resolve( fakeApiResponse ) );
	};

	const getMissingEntityResponse = ( id ) => {
		return {
			id,
			missing: ''
		};
	};

	const getItemResponse = ( id, label = 'label', description = 'description' ) => {
		return {
			type: 'item',
			id: id,
			labels: label === null ? {} : {
				'de-formal': {
					value: label,
					language: 'de',
					'for-language': 'de-formal'
				}
			},
			descriptions: description === null ? {} : {
				'de-formal': {
					value: description,
					language: 'de',
					'for-language': 'de-formal'
				}
			}
		};
	};

	const getLexemeResponse = ( lexemeId, languageId, lexicalCategoryId ) => {
		return {
			type: 'lexeme',
			id: lexemeId,
			lemmas: {
				'en-gb': {
					language: 'en-gb',
					value: 'colour<script></script>'
				},
				en: {
					language: 'en',
					value: 'color'
				},
				'en-ca': {
					language: 'en-ca',
					value: 'colour'
				}
			},
			lexicalCategory: lexicalCategoryId,
			language: languageId,
			forms: [],
			senses: []
		};
	};

	const testcases = [
		[
			'Properties: returns null for missing Property',
			'P7',
			getMissingEntityResponse( 'P7' ),
			null
		],
		[
			'Properties: returns null if the Property has neither Label nor Description',
			'P71',
			{
				type: 'property',
				id: 'P71',
				labels: {},
				descriptions: {}
			},
			null
		],
		[
			'Properties: Show only Label and (id) with missing Description',
			'P72',
			{
				type: 'itpropertyem',
				id: 'P72',
				labels: {
					'de-formal': {
						value: 'Label only',
						language: 'en',
						'for-language': 'de-formal'
					}
				},
				descriptions: {}
			},
			'<div><span><span lang="en">Label only</span> <span>(P72)</span></span><br><small></small></div>'
		],
		[
			'Properties: Show only (id) and Description with missing Label',
			'P73',
			{
				type: 'property',
				id: 'P73',
				labels: {},
				descriptions: {
					'de-formal': {
						language: 'de',
						value: 'nur Beschreibung',
						'for-language': 'de-formal'
					}
				}
			},
			'<div><span><span></span> <span>(P73)</span></span><br><small lang="de">nur Beschreibung</small></div>'
		],
		[
			'Properties: when label and descriptions are available, it creates and escapes the tooltip',
			'P74',
			{
				type: 'property',
				id: 'P74',
				labels: {
					'de-formal': {
						value: 'Label <script>alert("label is not escaped properly")</script>',
						language: 'en',
						'for-language': 'de-formal'
					}
				},
				descriptions: {
					'de-formal': {
						value: 'Description <script>alert("description is not escaped properly")</script>',
						language: 'en',
						'for-language': 'de-formal'
					}
				}
			},
			'<div><span><span lang="en">Label &lt;script&gt;alert("label is not escaped properly")&lt;/script&gt;</span> <span>(P74)</span></span><br><small lang="en">Description &lt;script&gt;alert("description is not escaped properly")&lt;/script&gt;</small></div>'
		],
		[
			'Items: returns null for missing Item',
			'Q99999999999999999',
			getMissingEntityResponse( 'Q99999999999999999' ),
			null
		],
		[
			'Items: returns null if the Item has neither Label nor Description',
			'Q4965597199',
			getItemResponse( 'Q4965597199', null, null ),
			null
		],
		[
			'Items: Show only (id) and Description with missing Label',
			'Q49655971',
			getItemResponse( 'Q49655971', null, 'Wikimedia-Kategorie' ),
			'<div><span><span></span> <span>(Q49655971)</span></span><br><small lang="de">Wikimedia-Kategorie</small></div>'
		],
		[
			'Items: Show only Label and (id) with missing Description',
			'Q93764220',
			getItemResponse( 'Q93764220', 'TYC 7697-2157-1', null ),
			'<div><span><span lang="de">TYC 7697-2157-1</span> <span>(Q93764220)</span></span><br><small></small></div>'
		],
		[
			'Items: when label and descriptions are available, it creates and escapes the tooltip',
			'Q42',
			getItemResponse(
				'Q42',
				'label <script>alert("label is not escaped properly")</script>',
				'description <script>alert("description is not escaped properly")</script>'
			),
			'<div><span><span lang="de">label &lt;script&gt;alert("label is not escaped properly")&lt;/script&gt;</span> <span>(Q42)</span></span><br><small lang="de">description &lt;script&gt;alert("description is not escaped properly")&lt;/script&gt;</small></div>'
		],
		[
			'Lexemes: returns null for missing Lexeme',
			'L99999999999999999',
			getMissingEntityResponse( 'L99999999999999999' ),
			null
		],
		[
			'Lexemes: language Item has been deleted',
			'L1347',
			[
				[
					[
						'L1347',
						getLexemeResponse( 'L1347', 'Q1084', 'Q1860' )
					]
				],
				[
					[
						'Q1084',
						getItemResponse( 'Q1084', 'language' )
					],
					[
						'Q1860',
						getMissingEntityResponse( 'Q1860' )
					]
				]
			],
			'<div><span><span><span lang="en-gb">colour&lt;script&gt;&lt;/script&gt;</span>/<span lang="en">color</span>/<span lang="en-ca">colour</span></span> <span>(L1347)</span></span><br><small><span lang="de">language</span>, <span lang="de-formal">Q1860</span></small></div>'
		],
		[
			'Lexemes: language Item does not have a label',
			'L1347',
			[
				[
					[
						'L1347',
						getLexemeResponse( 'L1347', 'Q1084', 'Q1860' )
					]
				],
				[
					[
						'Q1084',
						getItemResponse( 'Q1084', 'language' )
					],
					[
						'Q1860',
						getItemResponse( 'Q1860', null )
					]
				]
			],
			'<div><span><span><span lang="en-gb">colour&lt;script&gt;&lt;/script&gt;</span>/<span lang="en">color</span>/<span lang="en-ca">colour</span></span> <span>(L1347)</span></span><br><small><span lang="de">language</span>, <span lang="de-formal">Q1860</span></small></div>'
		],
		[
			'Lexemes: Lexeme has complete lemmas and labels',
			'L1347',
			[
				[
					[
						'L1347',
						getLexemeResponse( 'L1347', 'Q1084', 'Q1860' )
					]
				],
				[
					[
						'Q1860',
						getItemResponse( 'Q1860', 'language' )
					],
					[
						'Q1084',
						getItemResponse( 'Q1084', 'lexical category' )
					]
				]
			],
			'<div><span><span><span lang="en-gb">colour&lt;script&gt;&lt;/script&gt;</span>/<span lang="en">color</span>/<span lang="en-ca">colour</span></span> <span>(L1347)</span></span><br><small><span lang="de">lexical category</span>, <span lang="de">language</span></small></div>'
		]
	];

	testcases.forEach( ( [ message, id, fakeWikidataResponse, expectedTooltip ] ) => {
		QUnit.test( message, async ( assert ) => {
			const fakeApi = { getEntitiesData: getApiStub( id, fakeWikidataResponse ) };
			const tooltipRepository = tooltipRepositoryModule( fakeApi, 'de-formal', $ );

			const actualResponse = await tooltipRepository.getTooltipContentForId( id );

			assert.strictEqual( actualResponse && actualResponse.prop( 'outerHTML' ), expectedTooltip );
		} );
	} );

}( QUnit, sinon, jQuery, wikibase ) );
