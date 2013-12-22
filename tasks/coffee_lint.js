'use strict';

var coffeelint = require('coffeelint');
var hintFiles = require("coffee-jshint/lib-js/hint");

module.exports = function(grunt) {

  grunt.registerMultiTask('coffee_lint', 'Validate files with CoffeeLint and JSHint', function() {

    var errorCount = 0;
    var warnCount = 0;
    var files = this.filesSrc;
    var options = this.options({
      jshintOptions: [],
      withDefaults: true,
      globals: []
    });

    var hintFile = function(path, options) {
      var errors = hintFiles([path],
        {options: options.jshintOptions,
          withDefaults: options.withDefaults,
          globals: options.globals},
          false);
      var flattened_errors = [].concat.apply([], errors);
      var formatted_errors = flattened_errors.map(function(error) {
        return '' + path + ': ' + error.line + ":" + error.character + " " + error.reason;
      });

      return formatted_errors.join('\n');
    };

    if (typeof options.configFile !== 'undefined') {
      var config = grunt.file.readJSON(options.configFile);
      options.configFile = undefined;
      for (var key in options) {
        config[key] = options[key];
      }
      options = config;
    }

    files.forEach(function(file) {
      grunt.verbose.writeln('Linting ' + file + '...');

      var literate = !!file.match(/\.(litcoffee|coffee\.md)$/i);
      var errors = coffeelint.lint(grunt.file.read(file), options, literate);

      if (!errors.length) {
        var errors = files.map(function(path) {
          return hintFile(file, options);
        });
        var hasErrors = (/:/.test('\n' + errors.join('\n\n') + '\n'));
        if (!hasErrors) {
          return grunt.verbose.ok();
        } else {
          return grunt.fail.warn('\n' + errors.join('\n\n') + '\n');
        }
      } else {
        errors.forEach(function(error) {
          var status, message;

          if (error.level === 'error') {
            errorCount += 1;
            status = "[error]".red;
          } else if (error.level === 'warn') {
            warnCount += 1;
            status = "[warn]".yellow;
          } else {
            return;
          }

          message = file + ':' + error.lineNumber + ' ' + error.message +
          ' (' + error.rule + ')';

          grunt.log.writeln(status + ' ' + message);
          grunt.event.emit('coffeelint:' + error.level, error.level, message);
          grunt.event.emit('coffeelint:any', error.level, message);
        });
      }

    });


    if (errorCount && !options.force) {
      return false;
    }

    if (!warnCount && !errorCount) {
      grunt.log.ok(files.length + ' file' + (files.length === 1 ? '' : 's') + ' lint free.');
    }

  });
};
