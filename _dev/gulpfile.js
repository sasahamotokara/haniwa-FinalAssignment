(function () {
    'use strict';

    var autoprefixer = require('gulp-autoprefixer');
    var gulp = require('gulp');
    var plumber = require('gulp-plumber');
    var watch = require('gulp-watch');
    var sass = require('gulp-sass');
    var csscomb = require('gulp-csscomb');
    var postcss = require('gulp-postcss');
    var mqpacker = require('css-mqpacker');
    var sourcemaps = require('gulp-sourcemaps');
    var rename = require('gulp-rename');
    var lineEndingCorrector = require('gulp-line-ending-corrector');

    var path = {
        img: '../img',
        sass: './sass',
        css: '../css',
        js: '../js'
    };

    gulp.task('sass-compile', function () {
        gulp.src(path.sass + '/base.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'expanded'
        }))
        .pipe(autoprefixer({
            browsers: [
                'ie >= 10',
                'last 2 Chrome versions',
                'last 2 Firefox versions',
                'Android >= 5',
                'iOS >= 10'
            ]
        }))
        .pipe(csscomb({
            options: {
                config: 'csscomb.json'
            }
        }))
        .pipe(postcss([
            mqpacker({
                sort: true
            })
        ]))
        // .pipe(sourcemaps.write('./'))
        .pipe(lineEndingCorrector({
            eolc: 'CRLF',
            encoding: 'utf8'
        }))
        .pipe(rename('common.css'))
        .pipe(gulp.dest(path.css));
    });

    gulp.task('default', function () {
        gulp.watch(path.sass + '/**/*.scss', ['sass-compile']);
    });
})();
