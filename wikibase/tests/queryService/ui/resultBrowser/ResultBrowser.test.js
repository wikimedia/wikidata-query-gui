( function ( $, QUnit, sinon, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.ui.resultBrowser' );
	var resultBrowser = wb.queryService.ui.resultBrowser;
	var browsers = [
		'TableResultBrowser', 'ImageResultBrowser', 'CoordinateResultBrowser',
		'BubbleChartResultBrowser', 'LineChartResultBrowser', 'BarChartResultBrowser',
		'AreaChartResultBrowser', 'ScatterChartResultBrowser', 'TreeMapResultBrowser',
		'TreeResultBrowser', 'TimelineResultBrowser', 'MultiDimensionResultBrowser',
		'GraphResultBrowser'
	];

	var data = {
		EMPTY: { 'head': { 'vars': [ ] }, 'results': { 'bindings': [ ] } },
		TableResultBrowser: { 'head': { 'vars': [ 'item', 'itemLabel' ] }, 'results': { 'bindings': [ { 'item': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q498787' }, 'itemLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Muezza' } }, { 'item': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q677525' }, 'itemLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Orangey' } } ] } },
		ImageResultBrowser: { 'head': { 'vars': [ 'spaceProbeLabel', 'date', 'picture' ] }, 'results': { 'bindings': [ { 'date': { 'datatype': 'http://www.w3.org/2001/XMLSchema#dateTime', 'type': 'literal', 'value': '1957-10-04T00:00:00Z' }, 'picture': { 'type': 'uri', 'value': 'http://commons.wikimedia.org/wiki/Special:FilePath/Sputnik.jpg' }, 'spaceProbeLabel': { 'xml:lang': 'fr', 'type': 'literal', 'value': 'Spoutnik1' } }, { 'date': { 'datatype': 'http://www.w3.org/2001/XMLSchema#dateTime', 'type': 'literal', 'value': '1957-10-04T00:00:00Z' }, 'picture': { 'type': 'uri', 'value': 'http://commons.wikimedia.org/wiki/Special:FilePath/Sputnik%201.jpg' }, 'spaceProbeLabel': { 'xml:lang': 'fr', 'type': 'literal', 'value': 'Spoutnik1' } }, { 'date': { 'datatype': 'http://www.w3.org/2001/XMLSchema#dateTime', 'type': 'literal', 'value': '1961-02-12T00:00:00Z' }, 'picture': { 'type': 'uri', 'value': 'http://commons.wikimedia.org/wiki/Special:FilePath/Venera%201%20%28a%29%20%28Memorial%20Museum%20of%20Astronautics%29.JPG' }, 'spaceProbeLabel': { 'xml:lang': 'fr', 'type': 'literal', 'value': 'Venera1' } } ] } },
		CoordinateResultBrowser: { 'head': { 'vars': [ 'label', 'coord', 'place', 'image' ] }, 'results': { 'bindings': [ { 'coord': { 'datatype': 'http://www.opengis.net/ont/geosparql#wktLiteral', 'type': 'literal', 'value': 'Point(41.4869 -79.5953)' }, 'label': { 'xml:lang': 'en', 'type': 'literal', 'value': 'PitholeStoneArchBridge' } }, { 'coord': { 'datatype': 'http://www.opengis.net/ont/geosparql#wktLiteral', 'type': 'literal', 'value': 'Point(43.5046 11.7996)' }, 'label': { 'xml:lang': 'en', 'type': 'literal', 'value': 'PonteBuriano' } } ] } },
		BubbleChartResultBrowser: { 'head': { 'vars': [ 'item', 'itemLabel', 'duration' ] }, 'results': { 'bindings': [ { 'item': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q1440764' }, 'itemLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'BattleofTimor' }, 'duration': { 'datatype': 'http://www.w3.org/2001/XMLSchema#double', 'type': 'literal', 'value': '356.0' } }, { 'item': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q383614' }, 'itemLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'BattleofKohima' }, 'duration': { 'datatype': 'http://www.w3.org/2001/XMLSchema#double', 'type': 'literal', 'value': '79.0' } } ] } },
		AbstractDimpleChartResultBrowser: { 'head': { 'vars': [ 'objectLabel', 'year', 'population', 'Location' ] }, 'results': { 'bindings': [ { 'population': { 'datatype': 'http://www.w3.org/2001/XMLSchema#decimal', 'type': 'literal', 'value': '7047539' }, 'objectLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' }, 'year': { 'datatype': 'http://www.w3.org/2001/XMLSchema#integer', 'type': 'literal', 'value': '1960' }, 'Location': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' } }, { 'population': { 'datatype': 'http://www.w3.org/2001/XMLSchema#decimal', 'type': 'literal', 'value': '7086299' }, 'objectLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' }, 'year': { 'datatype': 'http://www.w3.org/2001/XMLSchema#integer', 'type': 'literal', 'value': '1961' }, 'Location': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' } }, { 'population': { 'datatype': 'http://www.w3.org/2001/XMLSchema#decimal', 'type': 'literal', 'value': '7129864' }, 'objectLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' }, 'year': { 'datatype': 'http://www.w3.org/2001/XMLSchema#integer', 'type': 'literal', 'value': '1962' }, 'Location': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' } }, { 'population': { 'datatype': 'http://www.w3.org/2001/XMLSchema#decimal', 'type': 'literal', 'value': '7175811' }, 'objectLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' }, 'year': { 'datatype': 'http://www.w3.org/2001/XMLSchema#integer', 'type': 'literal', 'value': '1963' }, 'Location': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' } }, { 'population': { 'datatype': 'http://www.w3.org/2001/XMLSchema#decimal', 'type': 'literal', 'value': '7223801' }, 'objectLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' }, 'year': { 'datatype': 'http://www.w3.org/2001/XMLSchema#integer', 'type': 'literal', 'value': '1964' }, 'Location': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' } }, { 'population': { 'datatype': 'http://www.w3.org/2001/XMLSchema#decimal', 'type': 'literal', 'value': '7270889' }, 'objectLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' }, 'year': { 'datatype': 'http://www.w3.org/2001/XMLSchema#integer', 'type': 'literal', 'value': '1965' }, 'Location': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' } }, { 'population': { 'datatype': 'http://www.w3.org/2001/XMLSchema#decimal', 'type': 'literal', 'value': '7322066' }, 'objectLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' }, 'year': { 'datatype': 'http://www.w3.org/2001/XMLSchema#integer', 'type': 'literal', 'value': '1966' }, 'Location': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' } }, { 'population': { 'datatype': 'http://www.w3.org/2001/XMLSchema#decimal', 'type': 'literal', 'value': '7376998' }, 'objectLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' }, 'year': { 'datatype': 'http://www.w3.org/2001/XMLSchema#integer', 'type': 'literal', 'value': '1967' }, 'Location': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' } }, { 'population': { 'datatype': 'http://www.w3.org/2001/XMLSchema#decimal', 'type': 'literal', 'value': '7415403' }, 'objectLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' }, 'year': { 'datatype': 'http://www.w3.org/2001/XMLSchema#integer', 'type': 'literal', 'value': '1968' }, 'Location': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' } }, { 'population': { 'datatype': 'http://www.w3.org/2001/XMLSchema#decimal', 'type': 'literal', 'value': '7441055' }, 'objectLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' }, 'year': { 'datatype': 'http://www.w3.org/2001/XMLSchema#integer', 'type': 'literal', 'value': '1969' }, 'Location': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Austria' } } ] } },
		TreeMapResultBrowser: { 'head': { 'vars': [ 'show', 'showLabel', 'season', 'seasonLabel', 'episode', 'episodeLabel' ] }, 'results': { 'bindings': [ { 'show': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q886' }, 'season': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q13131' }, 'episode': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q48697' }, 'showLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'TheSimpsons' }, 'seasonLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': '24thseasonofTheSimpsons' }, 'episodeLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'AdventuresinBaby-Getting' } }, { 'show': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q886' }, 'season': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q13131' }, 'episode': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q218073' }, 'showLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'TheSimpsons' }, 'seasonLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': '24thseasonofTheSimpsons' }, 'episodeLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'MoonshineRiver' } } ] } },
		TreeResultBrowser: { 'head': { 'vars': [ 'show', 'showLabel', 'season', 'seasonLabel', 'episode', 'episodeLabel' ] }, 'results': { 'bindings': [ { 'show': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q886' }, 'season': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q13131' }, 'episode': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q48697' }, 'showLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'TheSimpsons' }, 'seasonLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': '24thseasonofTheSimpsons' }, 'episodeLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'AdventuresinBaby-Getting' } }, { 'show': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q886' }, 'season': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q13131' }, 'episode': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q218073' }, 'showLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'TheSimpsons' }, 'seasonLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': '24thseasonofTheSimpsons' }, 'episodeLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'MoonshineRiver' } } ] } },
		TimelineResultBrowser: { 'head': { 'vars': [ '_WikidataLabel', '_publication_date' ] }, 'results': { 'bindings': [ { '_publication_date': { 'datatype': 'http://www.w3.org/2001/XMLSchema#dateTime', 'type': 'literal', 'value': '2014-10-01T00:00:00Z' }, '_WikidataLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Wikidata: A Free Collaborative Knowledgebase' } }, { '_publication_date': { 'datatype': 'http://www.w3.org/2001/XMLSchema#dateTime', 'type': 'literal', 'value': '2015-01-01T00:00:00Z' }, '_WikidataLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Utilizing the Wikidata system to improve the quality of medical content in Wikipedia in diverse languages: a pilot study' } }, { '_publication_date': { 'datatype': 'http://www.w3.org/2001/XMLSchema#dateTime', 'type': 'literal', 'value': '2015-11-16T00:00:00Z' }, '_WikidataLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Wikidata: A platform for data integration and dissemination for the life sciences and beyond' } } ] } },
		MultiDimensionResultBrowser: { 'head': { 'vars': [ 'item', 'itemLabel' ] }, 'results': { 'bindings': [ { 'item': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q498787' }, 'itemLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Muezza' } }, { 'item': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q677525' }, 'itemLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Orangey' } } ] } },
		GraphResultBrowser: { 'head': { 'vars': [ 'item', 'itemLabel' ] }, 'results': { 'bindings': [ { 'item': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q498787' }, 'itemLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Muezza' } }, { 'item': { 'type': 'uri', 'value': 'http://www.wikidata.org/entity/Q677525' }, 'itemLabel': { 'xml:lang': 'en', 'type': 'literal', 'value': 'Orangey' } } ] } }
	};
	data.LineChartResultBrowser = data.AbstractDimpleChartResultBrowser;
	data.BarChartResultBrowser = data.AbstractDimpleChartResultBrowser;
	data.AreaChartResultBrowser = data.AbstractDimpleChartResultBrowser;
	data.ScatterChartResultBrowser = data.AbstractDimpleChartResultBrowser;
	delete data.AbstractDimpleChartResultBrowser;

	var expected = {
		TableResultBrowser: '<div class="bootstrap-table',
		ImageResultBrowser: '<div class="img-grid">',
		CoordinateResultBrowser: '<div id="map" .*class="leaflet-container',
		BubbleChartResultBrowser: '<svg',
		LineChartResultBrowser: '<svg',
		BarChartResultBrowser: '<svg',
		AreaChartResultBrowser: '<svg',
		ScatterChartResultBrowser: '<svg',
		TreeMapResultBrowser: '<svg',
		TreeResultBrowser: '<div class="jstree'
	};

	$.each( browsers, function ( index, browser ) {

		QUnit.test( 'When instantiating ' + browser + ' there should be no error ', function ( assert ) {
			var b = new resultBrowser[ browser ]();
			b.setResult( { foo: true } );
			assert.ok( true, 'Instantiating must not throw an error' );
		} );

		if ( browser !== 'TableResultBrowser' ) {
			QUnit.test( 'When ' + browser + ' is visiting TableResultBrowser with drawable data then drawable must be true', function ( assert ) {
				var b = new resultBrowser[ browser ]();
				var tb = new resultBrowser.TableResultBrowser();
				tb.addVisitor( b );

				$.each( browsers, function ( i, ob ) {
					if ( ob === browser ) {
						return;
					}
					tb.addVisitor( new resultBrowser[ ob ]() );
				} );

				tb.setResult( data[ browser ] );
				tb.draw( $( '<div> ' ) );

				assert.ok( b.isDrawable(), browser + ' must be drawable' );
			} );

			QUnit.test( 'When ' + browser + ' is visiting TableResultBrowser with not drawable data then drawable must be false', function ( assert ) {
				var b = new resultBrowser[ browser ]();
				var tb = new resultBrowser.TableResultBrowser();
				tb.addVisitor( b );
				tb.setResult( data.EMPTY );
				tb.draw( $( '<div> ' ) );

				assert.notOk( b.isDrawable(), browser + ' must not be drawable' );
			} );
		}

		QUnit.test( 'When rendering ' + browser + ' then expected result should be displayed ', function ( assert ) {
			var b = new resultBrowser[ browser ]();
			b.setResult( data[ browser ] );

			var $result = $( '<div>' ).width( 100 ).height( 100 );
			$result.appendTo( 'body' );

			b.draw( $result );
			assert.ok( true, 'Drawing must not throw an error' );

			assert.ok( $result.html().match( expected[ browser ] ), 'Result must be expected result' + $result.html() );
			$result.remove();
		} );

	} );

}( jQuery, QUnit, sinon, wikibase ) );
