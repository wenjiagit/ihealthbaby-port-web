'use strict';
module.exports = function (grunt) {
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        watch: {
            // If any .less file changes in directory "build/less/" run the "less"-task.
            files: ['less/*.less', 'js/*.js', 'page/**/*.html'],
            tasks: ['less', 'csscomb:dev',  'includereplace:dist']
        },
        clean: {
            options: {
                force: true
            },
            dist: '../page'
        },
        less: {
            // Development not compressed
            dev: {
                options: {
                    compress: false,
                    strictMath: true,
                    outputSourceFiles: true
                },
                files: {
                    "../css/page.css": "less/page.less",
                    "../css/doctor.css": "less/doctor.less",
                    "../css/custody.css": "less/custody.less"
                }
            },
            dist: {
                options: {
                    compress: true,
                    strictMath: true,
                    outputSourceFiles: true,
                    sourceMap: true,
                    sourceMapURL: 'css/style.css.map',
                    sourceMapFilename: '../css/style.css.map'
                },
                files: {
                    "../css/page.min.css": 'less/page.less',
                    "../css/doctor.min.css": 'less/doctor.less',
                    "../css/custody.min.css": 'less/custody.less'
                }
            }
        },
        //uglify: {
        //    dist: {
        //        options: {
        //            report: "min",
        //            sourceMap: true
        //        },
        //        files: {
        //        }
        //    }
        //},
        //autoprefixer: {
        //    options: {
        //        browsers: [
        //            "Android 2.3",
        //            "Android >= 4",
        //            "Chrome >= 20",
        //            "Firefox >= 24",
        //            "Explorer >= 8",
        //            "iOS >= 6",
        //            "Opera >= 12",
        //            "Safari >= 6"
        //        ],
        //        map: false
        //    },
        //    dev: {
        //        src: ['../css/page.css', '../css/doctor.css']
        //    },
        //    dist: {
        //        src: ['../css/page.min.css','../css/doctor.min.css']
        //    }
        //},
        cssmin: {
            options : {
                compatibility : 'ie8', //设置兼容模式
                noAdvanced : true //取消高级特性
            },
            minify: {
                expand: true,
                files: {
                    '../lib/normalize.min.css': 'plugins/normalize.css'
                }
            }
        },
        csscomb: {
            options: {
                config: 'less/.csscomb.json'
            },
            dev: {
                expand: true,
                cwd: '../css/',
                src: ['*.css', '!*.min.css'],
                dest: '../css/'
            }
        },
        includereplace: {
            dist: {
                options: {
                    globals: {

                    },
                    includesDir: 'page/common'
                },
                files: {
                    '../': ['page/**/*.html', '!page/common/**/*.html']
                }
            }
        },
        //csslint: {
        //    options: {
        //        csslintrc: 'less/.csslintrc'
        //    },
        //    dev: [
        //        '../css/*.css'
        //    ]
        //},
        copy: {
            lib: {
                files: [
                ]
            }
        }
    });

    grunt.registerTask('default', ['watch']);
    grunt.registerTask('dist', ['copy', 'less','csscomb:dev','includereplace:dist', 'cssmin']);
};