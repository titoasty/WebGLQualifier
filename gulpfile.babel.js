'use strict';

// load plugins
import gulp from 'gulp';
import rename from 'gulp-rename';
import notify from 'gulp-notify';
import del from 'del';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import sourcemaps from 'gulp-sourcemaps';
import browserify from 'browserify';
import watchify from 'watchify';
import babelify from 'babelify';
import uglify from 'gulp-uglify';
import stringify from 'stringify';


var config = {
    entryFile: './src/WebGLQualifier.js',
	outputFile: 'webglqualifier.js',
    srcDir: './src/',
    outputDir: './dist/'
};

function compile(watch) {
    var bundler = browserify(config.entryFile, {
			debug: true,
			standalone: 'WebGLQualifier'
		})
		.transform(babelify)
		.transform(stringify, { appliesTo: {includeExtensions: ['.glsl'] }});

    function rebundle() {
        bundler.bundle()
            .on('error', function(err) {
				console.error(err);
				this.emit('end');
			})
            .pipe(source(config.outputFile))
            .pipe(buffer())
			.pipe(gulp.dest(config.outputDir))
			.pipe(rename({extname: '.min.js'}))
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(uglify())
            .pipe(sourcemaps.write('./'))
			.pipe(gulp.dest(config.outputDir));
    }

    if (watch) {
        watchify(bundler).on('update', function() {
            console.log('-> bundling...');
            rebundle();
        });
    }

    rebundle();
}

function watch() {
    return compile(true);
}

// clean
gulp.task('clean', function() {
	return del([config.outputDir]);
});

// build
gulp.task('build', function() {
	return compile();
});

// watch
gulp.task('watch', function() {
	return watch();
});

// default
gulp.task('default', ['watch']);

/*
 // scripts
 gulp.task('scripts', () => {
 return gulp.src(config.srcDir + config.entryFile)
 .pipe(babel({
 presets: ['es2015']
 }))
 .pipe(gulp.dest(config.outputDir))
 .pipe(uglify())
 .pipe(rename({extname: '.min.js'}))
 .pipe(gulp.dest(config.outputDir))
 .pipe(notify({ message: 'scripts task complete' }));
 });
 */
/*

// default task
gulp.task('default', ['watch'], () => {
});
*/
// watch
//gulp.task('watch', ['clean', 'scripts'], () => {
    // watch .js files
    //gulp.watch(config.srcDir + '**/*.js', ['scripts']);
//});
