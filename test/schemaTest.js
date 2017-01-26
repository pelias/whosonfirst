'use strict';

const tape = require('tape');
const Joi = require('joi');
const schema = require('../schema');

function validate(config) {
  Joi.validate(config, schema, (err, value) => {
    if (err) {
      throw new Error(err.details[0].message);
    }
  });
}

tape('tests for looking up hierarchies', (test) => {
  test.test('non-object imports should throw error', (t) => {
    [null, 17, true, [], 'string'].forEach((value) => {
      const config = {
        imports: value
      };

      t.throws(validate.bind(null, config), /"imports" must be an object/);
    });

    t.end();

  });

  test.test('non-object whosonfirst should throw error', (t) => {
    [null, 17, true, [], 'string'].forEach((value) => {
      const config = {
        imports: {
          whosonfirst: value
        }
      };

      t.throws(validate.bind(null, config), /"whosonfirst" must be an object/);
    });

    t.end();

  });

  test.test('config lacking datapath should throw error', (t) => {
    const config = {
      imports: {
        whosonfirst: {
          importVenues: true
        }
      }
    };

    t.throws(validate.bind(null, config), /"datapath" is required/);
    t.end();

  });

  test.test('config lacking importVenues should not throw error', (t) => {
    const config = {
      imports: {
        whosonfirst: {
          datapath: '/path/to/data'
        }
      }
    };

    t.doesNotThrow(validate.bind(this, config));
    t.end();

  });

  test.test('config with spurious keys should throw error', (t) => {
    const config = {
      imports: {
        whosonfirst: {
          datapath: '/path/to/data',
          importVenues: true,
          spurious_key: 'value'
        }
      }
    };

    t.throws(validate.bind(null, config), /"spurious_key" is not allowed/);
    t.end();

  });

  test.test('non-string datapath should throw error', (t) => {
    [null, 17, {}, [], true].forEach((value) => {
      const config = {
        imports: {
          whosonfirst: {
            datapath: value
          }
        }
      };

      t.throws(validate.bind(null, config), /"datapath" must be a string/);

    });

    t.end();

  });

  test.test('non-boolean importVenues should throw error', (t) => {
    [null, 17, {}, [], 'string'].forEach((value) => {
      const config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            importVenues: value
          }
        }
      };

      t.throws(validate.bind(null, config), /"importVenues" must be a boolean/);

    });

    t.end();

  });

  test.test('case-insensitive \'yes\' and true should be valid importVenues values', (t) => {
    [true, 'YeS', 'yEs'].forEach((value) => {
      const config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            importVenues: value
          }
        }
      };

      t.doesNotThrow(validate.bind(null, config));

    });

    t.end();

  });

  test.test('case-insensitive \'no\' and false should be valid importVenues values', (t) => {
    [false, 'nO', 'No'].forEach((value) => {
      const config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            importVenues: value
          }
        }
      };

      t.doesNotThrow(validate.bind(null, config));

    });

    t.end();

  });

});
