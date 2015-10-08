var argv = require('yargs').argv;

var gulp = require('gulp');

// Plugins.
var jshint = require('gulp-jshint');
  var stylish = require('jshint-stylish');

var jsonlint = require("gulp-jsonlint");

// We only want to process our own non-processed JavaScript files.
var jsPath = ['../plugins/*/*.js', '!../plugins/*/node_module/*', '../app.js', '../public/js/*.js'];
var jsonPath = ['../*.json', '../plugins/*/*.json']

/**
 * Run Javascript through JSHint.
 */
gulp.task('jshint', function() {
  return gulp.src(jsPath)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

/**
 * Watch files for changes and run tasks.
 */
gulp.task('watch', function() {
  gulp.watch(jsPath, ['jshint']);
  gulp.watch(jsonPath, ['json']);
});

/**
 * Watch javascript files for changes.
 */
gulp.task('js-watch', function() {
  gulp.watch(jsPath, ['jshint']);
});

/**
 * Check json files.
 */
gulp.task('json', function() {
  gulp.src(jsonPath)
    .pipe(jsonlint())
    .pipe(jsonlint.reporter());
});

// Tasks to compile sass and watch js file.
gulp.task('default', ['watch']);
