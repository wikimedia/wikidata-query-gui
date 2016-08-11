/* jshint node:true */
module.exports = function( grunt ) {
	'use strict';
	require( 'load-grunt-tasks' )( grunt );
	var pkg = grunt.file.readJSON( 'package.json' );
	var dist = 'dist';

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
				dist
			],
			deploy: [
					dist + '/*', dist + '!.git/**'
			]
		},
		useminPrepare: {
			html: [
					'index.html', 'embed.html'
			],
			options: {
				dest: dist
			}
		},
		concat: {},
		uglify: {},
		copy: {
			release: {
				files: [
						{// bootstrap icons
							expand: true,
							flatten: true,
							src: [
								'**/*.{eot,ttf,woff,woff2}'
							],
							dest: dist + '/fonts/',
							filter: 'isFile'
						},
						{// uls images
							expand: true,
							flatten: true,
							src: [
								'**/jquery.uls/images/*.{png,jpg,svg}'
							],
							dest: dist + '/images/',
							filter: 'isFile'
						},
						{// leaflet fullscreen images
							expand: true,
							flatten: true,
							src: [
								'**/leaflet-fullscreen/**/*.png'
							],
							dest: dist + '/css/',
							filter: 'isFile'
						},
						{
							expand: true,
							cwd: './',
							src: [
									'i18n/**', 'vendor/jquery.uls/**', '*.html',
									'logo.svg', 'robots.txt'
							],
							dest: dist
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
								dist + '/js/*.js', dist + '/css/*.css'
						]
					}
				]
			}
		},
		usemin: {
			html: [
					dist + '/index.html', dist + '/embed.html'
			]
		},
		htmlmin: {
			dist: {
				options: {
					removeComments: true,
					collapseWhitespace: true
				},
				files: [
					{
						expand: true,
						cwd: dist,
						src: '**/*.html',
						dest: dist
					}
				]
			}
		},
		shell: {
			options: {
				execOptions: {
					shell: '/bin/sh'
				}
			},
			updateRepo: {// updates the gui repo
				command: 'git remote update && git pull'
			},
			cloneDeploy: {// clone gui deploy to dist folder
				command: 'git clone --branch <%= pkg.repository.deploy.branch %>' +
						' --single-branch https://<%= pkg.repository.deploy.gerrit %>/r/<%= pkg.repository.deploy.repo %> ' +
						dist
			},
			commitDeploy: {// get gui commit message and use it for deploy commit
				command: [
						'lastrev=$(git rev-parse HEAD)',
						'message=$(git log -1 --pretty=%B)',
						'newmessage=$(cat <<END\nMerging from $lastrev:\n\n$message\nEND\n)',
						'cd ' + dist,
						'git add -A', 'git commit -m "$newmessage"',
						'echo "$newmessage"'
				].join( '&&' )
			},
			review: {
				command: [
						'cd ' + dist,
						'git review'
				].join( '&&' )
			}
		}
	} );

	grunt.registerTask( 'configDeploy', 'Creates .git-review in dist folder', function() {
		var file = '[gerrit]\nhost=' + pkg.repository.deploy.gerrit + '\n' +
			'port=29418\n' +
			'project=' + pkg.repository.deploy.repo + '.git\n' +
			'defaultbranch=' + pkg.repository.deploy.branch + '\n' +
			'defaultrebase=0\n';

		grunt.file.write( dist + '/.gitreview', file );
	} );

	grunt.registerTask( 'test', [
			'jshint', 'jscs', 'jsonlint', 'banana', 'qunit'
	] );
	grunt.registerTask( 'build', [
			'clean', 'build_dist'
	] );
	grunt.registerTask( 'build_dist', [
			'copy', 'useminPrepare', 'concat', 'cssmin', 'uglify', 'filerev', 'usemin', 'htmlmin'
	] );
	grunt.registerTask( 'deploy', [
			'clean', 'shell:updateRepo', 'shell:cloneDeploy', 'clean:deploy', 'build_dist', 'shell:commitDeploy', 'configDeploy', 'shell:review'
	] );
	grunt.registerTask( 'default', 'test' );
};
