const tape = require('tape');
const _ = require('lodash');

tape('index (entry point)', (test) => {
  test.test('all exposed components should be functions', (t) => {
    const index = require('../index');

    t.equals(6, Object.keys(index).length);
    t.ok(_.every(index, _.isFunction), 'all exposed properties should be functions');
    t.end();

  });

});
