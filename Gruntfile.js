/* jshint node:true */
module.exports = function( grunt ) {
	'use strict';
	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-qunit' );
	grunt.loadNpmTasks( 'grunt-jsonlint' );
	grunt.loadNpmTasks( 'grunt-jscs' );

	grunt.initConfig( {
		jshint: {
			options: {
				jshintrc: true
			},
			all: [
				'**/*.js'
			]
		},
		jscs: {
			src: '<%= jshint.all %>'
		},
		jsonlint: {
			all: [
					'**/*.json', '!node_modules/**', '!vendor/**'
			]
		},
		qunit: {
			all: [
				'wikibase/tests/*.html'
			]
		},
		banana: {
			all: 'i18n/'
		}
	} );

	grunt.registerTask( 'test', [
			'jshint', 'jscs', 'jsonlint', 'banana', 'qunit'
	] );
	grunt.registerTask( 'default', 'test' );
};
