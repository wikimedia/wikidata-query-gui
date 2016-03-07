/* exported CONFIG */
var CONFIG = ( function ( window ) {
	'use strict';

	var configLocal = {
		api : {
			sparql : {
				uri : 'https://query.wikidata.org/bigdata/namespace/wdq/sparql'
			}
		}
	};

	var configDeploy = {
		api : {
			sparql : {
				uri : '/bigdata/namespace/wdq/sparql'
			}
		}
	};

	var hostname = window.location.hostname.toLowerCase();

	if( hostname === '' ||
		hostname === 'localhost' ||
		hostname === '127.0.0.1'){
		return configLocal;
	}

	return configDeploy;

} )( window );