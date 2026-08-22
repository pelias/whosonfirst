var tape = require('tape');

var hierarchyFinder = require('../src/hierarchyFinder');

tape('tests for looking up hierarchies', function(test) {
  test.test('all hierarchies should be returned', function(t) {
    // records are limited to just the fields needed to operate
    var wofRecords = {
      1: {
        name: 'name 1'
      },
      2: {
        name: 'name 2'
      },
      3: {
        name: 'name 3'
      },
      4: {
        name: 'name 4',
        hierarchies: [
          { // keys don't matter
            'first arbitrary level': 4,
            'second arbitrary level': 3,
            'third arbitrary level': 2,
            'fourth arbitrary level': 1
          },
          {
            'fifth arbitrary level': 4,
            'sixth arbitrary level': 2
          }
        ]
      }
    };

    var hierarchies = hierarchyFinder(wofRecords)(wofRecords['4']);

    t.deepEqual(hierarchies, [
      [
        wofRecords['4'],
        wofRecords['3'],
        wofRecords['2'],
        wofRecords['1']
      ],
      [
        wofRecords['4'],
        wofRecords['2']
      ]
    ]);
    t.end();

  });

  test.test('hierarchy elements with no names should be excluded', function(t) {
    // records are limited to just the fields needed to operate
    var wofRecords = {
      1: {
        name: 'name 1'
      },
      2: {
        name: 'name 2'
      },
      3: {
        name: undefined
      },
      4: {
        name: 'name 4',
        hierarchies: [
          { // keys don't matter
            'first arbitrary level': 4,
            'second arbitrary level': 3, // no name, will be excluded
            'third arbitrary level': 2,
            'fourth arbitrary level': 1
          }
        ]
      }
    };

    var hierarchies = hierarchyFinder(wofRecords)(wofRecords['4']);

    t.deepEqual(hierarchies, [[
      wofRecords['4'],
      wofRecords['2'],
      wofRecords['1']
    ]]);
    t.end();

  });

  test.test('only defined hierarchy members should be returned', function(t) {
    // records are limited to just the fields needed to operate
    var wofRecords = {
      1: {
        name: 'name 1'
      },
      3: {
        name: 'name 3'
      },
      4: {
        name: 'name 4',
        hierarchies: [{ // keys don't matter
          'first arbitrary level': 4,
          'second arbitrary level': 3,
          'third arbitrary level': 2, // this will be undefined
          'fourth arbitrary level': 1
        }]
      }
    };

    var hierarchy = hierarchyFinder(wofRecords)(wofRecords['4']);

    t.deepEqual(hierarchy, [
      [
        wofRecords['4'],
        wofRecords['3'],
        wofRecords['1']
      ]
    ]);
    t.end();

  });
  test.test('a stale self-reference in wof:hierarchy should be overridden by the record itself ' +
    '(eg. a record renamed/merged whose own wof:hierarchy still points at its deprecated ' +
    'predecessor id - see whosonfirst:locality:1175610569 "Brussels")', function(t) {
    // records are limited to just the fields needed to operate
    var wofRecords = {
      1: { // continent
        name: 'name 1'
      },
      2: { // country
        name: 'name 2'
      },
      // note: id 3 (the stale/deprecated predecessor) is intentionally absent
      // from parentRecords, as deprecated records are filtered out upstream
      4: { // the record itself
        id: 4,
        place_type: 'locality',
        name: 'name 4',
        hierarchies: [
          {
            continent_id: 1,
            country_id: 2,
            locality_id: 3 // stale: should have been 4 (self)
          }
        ]
      }
    };

    var hierarchies = hierarchyFinder(wofRecords)(wofRecords['4']);

    t.deepEqual(hierarchies, [
      [
        wofRecords['1'],
        wofRecords['2'],
        wofRecords['4']
      ]
    ]);
    t.end();

  });

  test.test('a correct self-reference in wof:hierarchy should be left as-is', function(t) {
    var wofRecords = {
      1: {
        name: 'name 1'
      },
      4: {
        id: 4,
        place_type: 'locality',
        name: 'name 4',
        hierarchies: [
          {
            continent_id: 1,
            locality_id: 4
          }
        ]
      }
    };

    var hierarchies = hierarchyFinder(wofRecords)(wofRecords['4']);

    t.deepEqual(hierarchies, [
      [
        wofRecords['1'],
        wofRecords['4']
      ]
    ]);
    t.end();

  });

  test.end();

});
