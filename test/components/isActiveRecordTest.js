var tape = require('tape');
var event_stream = require('event-stream');

var isActiveRecord = require('../../src/components/isActiveRecord');

function test_stream(input, testedStream, callback) {
    var input_stream = event_stream.readArray(input);
    var destination_stream = event_stream.writeArray(callback);

    input_stream.pipe(testedStream).pipe(destination_stream);
}

tape('isActiveRecord', function(test) {
  test.test('undefined/blank edtf:deprecated values should return true', function(t) {
    var input = [
      { properties: { 'edtf:deprecated': undefined } },
      { properties: { 'edtf:deprecated': '' } },
      { properties: { 'edtf:deprecated': ' \t ' } }
    ];
    var expected = [
      { properties: { 'edtf:deprecated': undefined } },
      { properties: { 'edtf:deprecated': '' } },
      { properties: { 'edtf:deprecated': ' \t ' } }
    ];

    test_stream(input, isActiveRecord.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('undefined/blank edtf:superseded values should return true', function(t) {
    var input = [
      { properties: { 'edtf:superseded': undefined } },
      { properties: { 'edtf:superseded': '' } },
      { properties: { 'edtf:superseded': ' \t ' } }
    ];
    var expected = [
      { properties: { 'edtf:superseded': undefined } },
      { properties: { 'edtf:superseded': '' } },
      { properties: { 'edtf:superseded': ' \t ' } }
    ];

    test_stream(input, isActiveRecord.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('properties without edtf:superseded or edtf:deprecated or mz:is_current should return true', function(t) {
    var input = [
      { properties: { } }
    ];
    var expected = [
      { properties: { } }
    ];

    test_stream(input, isActiveRecord.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('non-blank edtf:deprecated values should return false', function(t) {
    var input = [
      { properties: { 'edtf:deprecated': 'some value' } }
    ];
    var expected = [];

    test_stream(input, isActiveRecord.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned true');
      t.end();
    });

  });

  test.test('non-blank edtf:superseded values should return false', function(t) {
    var input = [
      { properties: { 'edtf:superseded': 'some value' } }
    ];
    var expected = [];

    test_stream(input, isActiveRecord.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned false');
      t.end();
    });

  });

  test.test('mz:is_current 0 value should return false', function(t) {
    var input = [
      { properties: { 'mz:is_current': 0 } }
    ];
    var expected = [];

    test_stream(input, isActiveRecord.create(), function(err, actual) {
      t.deepEqual(actual, expected, 'should have returned false');
      t.end();
    });

  });

});
