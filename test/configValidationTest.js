'use strict';

var tape = require('tape');

var configValidation = require('../src/configValidation');

tape('tests for looking up hierarchies', function(test) {
  test.test('config lacking datapath should throw error', function(t) {
    var config = {
      importVenues: true
    };

    t.throws(function() {
      configValidation.validate(config);
    }, /"datapath" is required/);
    t.end();

  });

  test.test('config lacking importVenues should not throw error', function(t) {
    var config = {
      datapath: '/path/to/data'
    };

    t.doesNotThrow(function() {
      configValidation.validate(config);
    });
    t.end();

  });

  test.test('config with spurious keys should throw error', function(t) {
    var config = {
      datapath: '/path/to/data',
      importVenues: true,
      spurious_key: 'value'
    };

    t.throws(function() {
      configValidation.validate(config);
    }, /"spurious_key" is not allowed/);
    t.end();

  });

  test.test('non-string datapath should throw error', function(t) {
    [null, 17, {}, [], true].forEach((value) => {
      var config = {
        datapath: value
      };

      t.throws(function() {
        configValidation.validate(config);
      }, /"datapath" must be a string/);

    });

    t.end();

  });

  test.test('non-boolean importVenues should throw error', function(t) {
    [null, 17, {}, [], 'string'].forEach((value) => {
      var config = {
        datapath: '/path/to/data',
        importVenues: value
      };

      t.throws(function() {
        configValidation.validate(config);
      }, /"importVenues" must be a boolean/);

    });

    t.end();

  });

  test.test('case-insensitive \'yes\' and true should be valid importVenues values', function(t) {
    [true, 'YeS', 'yEs'].forEach((value) => {
      var config = {
        datapath: '/path/to/data',
        importVenues: value
      };

      t.doesNotThrow(function() {
        configValidation.validate(config);
      });

    });

    t.end();

  });

  test.test('case-insensitive \'no\' and false should be valid importVenues values', function(t) {
    [false, 'nO', 'No'].forEach((value) => {
      var config = {
        datapath: '/path/to/data',
        importVenues: value
      };

      t.doesNotThrow(function() {
        configValidation.validate(config);
      });

    });

    t.end();

  });

});
