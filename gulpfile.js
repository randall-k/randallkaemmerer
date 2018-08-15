var gulp = require('gulp'),
    gutil = require('gulp-util'),
    merge = require('merge-stream'),
    browserSync = require('browser-sync'),
    del = require('del'),
    symlink = require('gulp-symlink'),
    rename = require('gulp-rename'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    webpack = require('gulp-webpack-build'),
    replace = require('gulp-replace'),
    modernizr = require('gulp-modernizr'),
    postcss = require('gulp-postcss'),
    cssnext = require('cssnext'),
    autoprefixer = require('autoprefixer-core'),
    RevAll = require('gulp-rev-all'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    imageminSvgo = require('imagemin-svgo'),
    minifyCss = require('gulp-minify-css'),
    webpackOptions = {
        debug: true,
        devtool: '#source-map',
        watchDelay: 200
    },
    webpackConfig = {
        useMemoryFs: true,
        progress: true
    },
    names = {
        project: 'randallkaemmerer',
        working: './site/',
        build: './dist/'
    };

if (!names.domain) {
    names.domain = names.project;
}
names.workingDomain = names.domain + '.test';
names.workingSite = names.working;
names.buildSite = names.build;

gulp.task('webpack', function() {
    return gulp.src('./webpack.config.js')
        .pipe(webpack.init(webpackConfig))
        .pipe(webpack.props(webpackOptions))
        .pipe(webpack.run())
        .pipe(webpack.format({
            version: false,
            timings: true
        }))
        .pipe(webpack.failAfter({
            errors: true,
            warnings: true
        }))
        .pipe(gulp.dest(names.workingSite));
});

gulp.task('lint:js', function () {
    return gulp.src([
        'gulpfile.js',
        names.workingSite + 'js/*.js',
        '!' + names.workingSite + 'js/modernizr*.js',
        '!' + names.workingSite + 'js/bundle.js'
    ])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

gulp.task('css', function () {
    var processors = [
            cssnext(),
            autoprefixer({browsers: ['> 1%', 'last 3 versions']})
        ];

    return gulp.src(names.workingSite + 'css/base.css')
        .pipe(postcss(processors))
        .pipe(rename('style.css'))
        // .pipe(gulp.dest(names.workingSite + 'css/'))
        // .pipe(rename('editor.css'))
        .pipe(gulp.dest(names.workingSite));
});

gulp.task('browser-sync', ['lint:js', 'css'], function () {
    return browserSync.init({
        proxy: names.workingDomain,
        port: 3030,
        ui: {
            port: 3031
        }
    });
});

gulp.task('watch:css', function () {
    var processors = [
            cssnext(),
            autoprefixer({browsers: ['> 1%', 'last 3 versions']})
        ];

    return gulp.src(names.workingSite + 'css/base.css')
        .pipe(postcss(processors))
        .pipe(rename('style.css'))
        // .pipe(gulp.dest(names.workingSite + 'css/'))
        // .pipe(rename('editor.css'))
        .pipe(gulp.dest(names.workingSite))
        .pipe(browserSync.stream({
            notify: true,
            match: '**/*.css'
        }));
});

gulp.task('watch:js', ['webpack'], browserSync.reload);

gulp.task('watch', ['lint:js', 'webpack', 'css', 'browser-sync'], function () {
    gulp.watch(names.workingSite + 'css/**.css', ['watch:css']);

    gulp.watch(names.workingSite + 'js/**', ['lint:js', 'watch:js']);

    gulp.watch([
        names.workingSite + '**',
        '!' + names.workingSite + 'bower_components/**',
        '!' + names.workingSite + 'js/**',
        '!' + names.workingSite + 'css/**',
        '!' + names.workingSite + 'style.css'
    ]).on('change', browserSync.reload);
});

gulp.task('default', ['lint:js', 'css'], function () {
    return true;
});

// gulp.task('modernizr', ['css'], function () {
//     return gulp.src([
//         names.workingSite + '*.css',
//         names.workingSite + 'js/**/*.js',
//         '!' + names.workingSite + 'js/modernizr*.js'
//     ])
//         .pipe(modernizr('modernizr-custom.js'))
//         .pipe(gulp.dest(names.workingSite + 'js/'));
// });

gulp.task('build:clean', function (cb) {
    del(names.build, cb);
});

gulp.task('build:site', ['build:clean', 'css', 'webpack'], function () {
    var revAll = new RevAll({
            dontGlobal: [
                /acf-json\//, /inc\//, /languages\//,
                '.pdf',
                'favicon.ico',
                'apple-touch-icon.png',
                'tile.png',
                'tile-wide.png',
                '.txt',
                '.xml'
            ],
            dontSearchFile: [/bower_components\//],
            dontRenameFile: [
                '.php',
                '.html',
                'rtl.css'
            ]
        }),
        filterCss = '**/*.css',
        filterJs = 'js/*.js',
        filterSvg = 'img/**.svg',
        filterImg = 'img/**{.jpg,.jpeg,.png,.gif}';

    return merge(
        gulp.src(names.workingSite + filterCss)
            .pipe(minifyCss()),

        gulp.src(names.workingSite + filterJs)
            .pipe(uglify()),

        gulp.src(names.workingSite + filterSvg)
            .pipe(imageminSvgo({plugins: [{removeViewBox: false}]})()),

        gulp.src(names.workingSite + filterImg)
            .pipe(imagemin({progressive: true})),

        gulp.src([
            names.workingSite + '**',
            '!' + names.workingSite + filterCss,
            '!' + names.workingSite + filterJs,
            '!' + names.workingSite + filterSvg,
            '!' + names.workingSite + filterImg,
            '!' + names.workingSite + 'css/**'
        ])
        //    .pipe(replace('bower_components/modernizr/modernizr', 'js/modernizr-custom'))
    ).pipe(revAll.revision())
        .pipe(gulp.dest(names.buildSite));
});

gulp.task('build:copy', ['build:clean'], function () {
    return gulp.src([
        names.working + '{**,.htaccess}',
        '!' + names.workingSite + 'bower_components{,/**}',
        '!' + names.workingSite + 'css{,/**}',
        '!' + names.workingSite + 'js{,/**}',
        '!' + names.workingSite + 'img{,/**}',
        '!' + names.workingSite + 'fonts{,/**}'
    ]).pipe(gulp.dest(names.build));
});

// gulp.task('build:symlink', ['build:clean'], function () {
//     return gulp.src(names.working + names.content + 'uploads')
//         .pipe(symlink(names.build + names.content + 'uploads'));
// });

gulp.task('build', ['build:clean', 'build:copy', 'build:site'], function () {
    return gulp.src(names.workingSite + 'style.css')
      .pipe(gulp.dest(names.buildSite));
});
