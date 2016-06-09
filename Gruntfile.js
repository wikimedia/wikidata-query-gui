/* jshint node:true */
module.exports = function( grunt ) {
	'use strict';
	grunt.loadNpmTasks( 'grunt-banana-checker' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-qunit' );
	grunt.loadNpmTasks( 'grunt-jsonlint' );
	grunt.loadNpmTasks( 'grunt-jscs' );
	grunt.loadNpmTasks( 'grunt-usemin' );
	grunt.loadNpmTasks( 'grunt-filerev' );
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-contrib-cssmin' );

	var pkg = grunt.file.readJSON( 'package.json' );

	grunt.initConfig( {
		pkg: pkg,
		jshint: {
			options: {
				jshintrc: true
			},
			all: [
					'**/*.js', '!dist/**'
			]
		},
		jscs: {
			src: '<%= jshint.all %>'
		},
		jsonlint: {
			all: [
					'**/*.json', '!node_modules/**', '!vendor/**', '!dist/**'
			]
		},
		qunit: {
			all: [
				'wikibase/tests/*.html'
			]
		},
		banana: {
			all: 'i18n/'
		},
		clean: {
			release: [
				'dist'
			]
		},
		useminPrepare: {
			html: 'index.html',
			options: {
				dest: 'dist'
			}
		},
		concat: {},
		uglify: {},
		copy: {
			release: {
				files: [
						{//bootstrap icons
							expand: true,
							flatten: true,
							src: [
								'**/*.{eot,ttf,woff,woff2}'
							],
							dest: 'dist/fonts/',
							filter: 'isFile'
						},
						{// uls images
							expand: true,
							flatten: true,
							src: [
								'**/jquery.uls/images/*.{png,jpg,svg}'
							],
							dest: 'dist/images/',
							filter: 'isFile'
						},
						{// leaflet fullscreen images
							expand: true,
							flatten: true,
							src: [
								'**/leaflet-fullscreen/**/*.png'
							],
							dest: 'dist/css/',
							filter: 'isFile'
						},
						{
							expand: true,
							cwd: './',
							src: [
									'i18n/**', 'vendor/jquery.uls/**', '*.html', 'logo.svg',
									'robots.txt'
							],
							dest: 'dist'
						}
				]
			}
		},
		cssmin: {
			options: {
				debug: true
			}
		},
		filerev: {
			options: {
				encoding: 'utf8',
				algorithm: 'md5',
				length: 20
			},
			release: {
				files: [
					{
						src: [
								'dist/js/*.js', 'dist/css/*.css'
						]
					}
				]
			}
		},
		usemin: {
			html: [
				'dist/index.html'
			]
		}
	} );

	grunt.registerTask( 'test', [
			'jshint', 'jscs', 'jsonlint', 'banana', 'qunit'
	] );
	grunt.registerTask( 'build', [
			'clean', 'copy', 'useminPrepare', 'concat', 'cssmin', 'uglify', 'filerev', 'usemin'
	] );
	grunt.registerTask( 'default', 'test' );
};
