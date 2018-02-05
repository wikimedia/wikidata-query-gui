/* jshint node:true */
module.exports = function( grunt ) {
	'use strict';
	require( 'load-grunt-tasks' )( grunt );
	var pkg = grunt.file.readJSON( 'package.json' );
	var buildFolder = 'build';

	grunt.initConfig( {
		pkg: pkg,
		jshint: {
			options: {
				jshintrc: true
			},
			all: [
					'**/*.js', '!dist/**', '!' + buildFolder + '/**', '!target/**'
			]
		},
		jscs: {
			src: '<%= jshint.all %>'
		},
		jsonlint: {
			all: [
					'**/*.json', '!node_modules/**', '!vendor/**', '!dist/**', '!' + buildFolder + '/**', '!polestar/**', '!target/**'
			]
		},
		qunit: {
			all: [
				'wikibase/tests/*.html'
			]
		},
		less: {
			all: {
				files: {
					'style.css': 'style.less'
				}
			}
		},
		stylelint: {
			all: [
				'style.less'
			]
		},
		banana: {
			all: 'i18n/',
					options: {
						disallowBlankTranslations: false
					}
				},
		clean: {
			release: [
				buildFolder
			],
			deploy: [
					buildFolder + '/*', buildFolder + '!.git/**'
			]
		},
		useminPrepare: {
			html: [
					'index.html', 'embed.html'
			],
			options: {
				dest: buildFolder
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
							dest: buildFolder + '/fonts/',
							filter: 'isFile'
						},
						{// uls images
							expand: true,
							flatten: true,
							src: [
								'**/jquery.uls/images/*.{png,jpg,svg}'
							],
							dest: buildFolder + '/images/',
							filter: 'isFile'
						},
						{// jstree
							expand: true,
							flatten: true,
							src: [
								'**/jstree/**/*.{png,gif}'
							],
							dest: buildFolder + '/css/',
							filter: 'isFile'
						},
						{// leaflet fullscreen images
							expand: true,
							flatten: true,
							src: [
								'**/leaflet-fullscreen/**/*.png'
							],
							dest: buildFolder + '/css/',
							filter: 'isFile'
						},
						{// leaflet images
							expand: true,
							flatten: true,
							src: [
								'**/leaflet/dist/images/*.png'
							],
							dest: buildFolder + '/css/images',
							filter: 'isFile'
						},{
							expand: true,
							cwd: './',
							src: [
									'*.html',
									'logo.svg', 'logo-embed.svg', 'robots.txt', 'favicon.*'
							],
							dest: buildFolder
						},{
							expand: true,
							src: [
								'**/polestar/**'
							],
							dest: buildFolder
						},{
							expand: true,
							src: [
								'examples/code/*.txt'
							],
							dest: buildFolder,
							filter: 'isFile'
						}
				]
			}
		},
		'merge-i18n': {
			i18n: {
				src: [
					'**/i18n/*.json',
					'!**/examples/**',
					'!**/demo/**'
				],
				dest: buildFolder + '/i18n'
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
								buildFolder + '/js/*.js', buildFolder + '/css/*.css'
						]
					}
				]
			}
		},
		usemin: {
			html: [
					buildFolder + '/index.html', buildFolder + '/embed.html'
			]
		},
		htmlmin: {
			build: {
				options: {
					removeComments: true,
					collapseWhitespace: true
				},
				files: [
					{
						expand: true,
						cwd: buildFolder,
						src: '**/*.html',
						dest: buildFolder
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
			cloneDeploy: {// clone gui deploy to build folder
				command: 'git clone --branch <%= pkg.repository.deploy.branch %>' +
						' --single-branch https://<%= pkg.repository.deploy.gerrit %>/r/<%= pkg.repository.deploy.repo %> ' +
						buildFolder
			},
			commitDeploy: {// get gui commit message and use it for deploy commit
				command: [
						'lastrev=$(git rev-parse HEAD)',
						'message=$(git log -1 --pretty=%B | grep -v Change-Id)',
						'newmessage=$(cat <<END\nMerging from $lastrev:\n\n$message\nEND\n)',
						'cd ' + buildFolder,
						'git add -A', 'git commit -m "$newmessage"',
						'echo "$newmessage"'
				].join( '&&' )
			},
			review: {
				command: [
						'cd ' + buildFolder,
						'git review'
				].join( '&&' )
			}
		},
		'auto_install': {
			local: {}
		}
	} );

	grunt.registerTask( 'configDeploy', 'Creates .git-review in build folder', function() {
		var file = '[gerrit]\nhost=' + pkg.repository.deploy.gerrit + '\n' +
			'port=29418\n' +
			'project=' + pkg.repository.deploy.repo + '.git\n' +
			'defaultbranch=' + pkg.repository.deploy.branch + '\n' +
			'defaultrebase=0\n';

		grunt.file.write( buildFolder + '/.gitreview', file );
	} );

	grunt.registerTask( 'test', [
		'jshint', 'jscs', 'jsonlint', 'banana', 'stylelint', 'qunit'
	] );
	grunt.registerTask( 'build', [
		'clean', 'create_build'
	] );
	grunt.registerTask( 'create_build', [
		'auto_install', 'test', 'less', 'copy', 'useminPrepare', 'concat', 'cssmin', 'uglify', 'filerev', 'usemin', 'htmlmin', 'merge-i18n'
	] );
	grunt.registerTask( 'deploy', [
		'clean', 'shell:updateRepo', 'shell:cloneDeploy', 'clean:deploy', 'create_build', 'shell:commitDeploy', 'configDeploy', 'shell:review'
	] );
	grunt.registerTask( 'default', 'test' );
};
