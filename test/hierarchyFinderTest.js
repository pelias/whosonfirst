var tape = require('tape');

var hierarchyFinder = require('../src/hierarchyFinder');

tape('parent_id_walker tests', function(test) {
  test.test('all parents up to undefined should be included', function(t) {
    // records are limited to just the fields needed to operate
    var wofRecords = {
      1: {
        name: 'name 1',
        parent_id: undefined
      },
      2: {
        name: 'name 2',
        parent_id: 1
      },
      3: {
        name: 'name 3',
        parent_id: 2
      },
      4: {
        id: 4,
        name: 'name 4',
        parent_id: 3
      }
    };

    // seed the parent_id_walker with wofRecords
    var parent_id_walker = hierarchyFinder.parent_id_walker(wofRecords);

    var hierarchies = parent_id_walker(wofRecords['4']);

    t.deepEqual(hierarchies, [[
      wofRecords['4'],
      wofRecords['3'],
      wofRecords['2'],
      wofRecords['1']
    ]]);
    t.end();

  });

  test.test('parents without names should not be included', function(t) {
    // records are limited to just the fields needed to operate
    var wofRecords = {
      1: {
        name: 'name 1',
        parent_id: undefined
      },
      2: {
        name: undefined,
        parent_id: 1
      },
      3: {
        name: undefined,
        parent_id: 2
      },
      4: {
        id: 4,
        name: 'name 4',
        parent_id: 3
      }
    };

    // seed the parent_id_walker with wofRecords
    var parent_id_walker = hierarchyFinder.parent_id_walker(wofRecords);

    var hierarchies = parent_id_walker(wofRecords['4']);

    t.deepEqual(hierarchies, [[
      wofRecords['4'],
      wofRecords['1']
    ]]);
    t.end();

  });

});

tape('hierarchies_walker tests', function(test) {
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

    // seed the hierarchies_walker with wofRecords
    var hierarchies_walker = hierarchyFinder.hierarchies_walker(wofRecords);

    var hierarchies = hierarchies_walker(wofRecords['4']);

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
        hierarchies: [{ // keys don't matter
          'first arbitrary level': 4,
          'second arbitrary level': 3, // no name, will be excluded
          'third arbitrary level': 2,
          'fourth arbitrary level': 1
        }]
      }
    };

    // seed the hierarchies_walker with wofRecords
    var hierarchies_walker = hierarchyFinder.hierarchies_walker(wofRecords);

    var hierarchies = hierarchies_walker(wofRecords['4']);

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

    // seed the hierarchies_walker with wofRecords
    var hierarchies_walker = hierarchyFinder.hierarchies_walker(wofRecords);

    var hierarchy = hierarchies_walker(wofRecords['4']);

    t.deepEqual(hierarchy, [
      [
        wofRecords['4'],
        wofRecords['3'],
        wofRecords['1']
      ]
    ]);
    t.end();

  });

});
