
const tape = require('tape');

const Joi = require('@hapi/joi');
const schema = require('../schema');

function validate(config) {
  const result = schema.validate(config);
  if (result.error) {
    throw new Error(result.error.details[0].message);
  }
}

tape('tests for looking up hierarchies', function(test) {
  test.test('config lacking datapath should throw error', function(t) {
    var config = {
      imports: {
        whosonfirst: {
          importPostalcodes: true
        }
      }
    };

    t.throws(validate.bind(null, config), /"imports.whosonfirst.datapath" is required/, 'missing datapath should throw');
    t.end();

  });

  test.test('missing importPostalcodes, and missingFilesAreFatal should not throw error', function(t) {
    var config = {
      imports: {
        whosonfirst: {
          datapath: '/path/to/data'
        }
      }
    };

    t.doesNotThrow(validate.bind(null, config));
    t.end();

  });

  test.test('config with spurious keys should throw error', function(t) {
    var config = {
      imports: {
        whosonfirst: {
          datapath: '/path/to/data',
          importPostalcodes: true,
          spurious_key: 'value'
        }
      }
    };

    t.throws(validate.bind(null, config), /"imports.whosonfirst.spurious_key" is not allowed/);
    t.end();

  });

  test.test('non-string datapath should throw error', function(t) {
    [null, 17, {}, [], true].forEach((value) => {
      var config = {
        imports: {
          whosonfirst: {
            datapath: value
          }
        }
      };

      t.throws(validate.bind(null, config), /"imports.whosonfirst.datapath" must be a string/);

    });

    t.end();

  });

  test.test('non-boolean sqlite should throw error', function(t) {
    [null, 17, {}, [], 'string'].forEach((value) => {
      var config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            sqlite: value
          }
        }
      };

      t.throws(validate.bind(null, config), /"imports.whosonfirst.sqlite" must be a boolean/);
    });

    t.end();

  });

  test.test('non-boolean importPostalcodes should throw error', function(t) {
    [null, 17, {}, [], 'string'].forEach((value) => {
      var config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            importPostalcodes: value
          }
        }
      };

      t.throws(validate.bind(null, config), /"imports.whosonfirst.importPostalcodes" must be a boolean/);
    });

    t.end();

  });

  test.test('non-string/array countryCode should throw error', function(t) {
    [null, 17, {}, true].forEach((value) => {
      var config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            countryCode: value
          }
        }
      };

      t.throws(validate.bind(null, config), `"imports.whosonfirst.countryCode" must be one of [string, array]`);
    });

    t.end();

  });

  test.test('case-insensitive \'yes\' and true should be valid sqlite values', function(t) {
    [true, 'YeS', 'yEs'].forEach((value) => {
      var config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            sqlite: value
          }
        }
      };

      t.doesNotThrow(validate.bind(null, config));
    });

    t.end();

  });

  test.test('case-insensitive \'no\' and false should be valid sqlite values', function(t) {
    [false, 'nO', 'No'].forEach((value) => {
      var config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            sqlite: value
          }
        }
      };

      t.doesNotThrow(validate.bind(null, config));
    });

    t.end();

  });

  test.test('case-insensitive \'yes\' and true should be valid importPostalcodes values', function(t) {
    [true, 'YeS', 'yEs'].forEach((value) => {
      var config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            importPostalcodes: value
          }
        }
      };

      t.doesNotThrow(validate.bind(null, config));
    });

    t.end();

  });

  test.test('case-insensitive \'no\' and false should be valid importPostalcodes values', function(t) {
    [false, 'nO', 'No'].forEach((value) => {
      var config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            importPostalcodes: value
          }
        }
      };

      t.doesNotThrow(validate.bind(null, config));
    });

    t.end();

  });

  test.end();

});

tape('battery of importPlace tests', test => {
  test.test('string importPlace should be cast as number', t => {
    const config = {
      imports: {
        whosonfirst: {
          datapath: '/path/to/data',
          importPlace: '123'
        }
      }
    };

    const validated = schema.validate(config);

    t.equals(validated.value.imports.whosonfirst.importPlace, 123);
    t.end();

  });

  test.test('array of strings importPlace should be cast as number', t => {
    const config = {
      imports: {
        whosonfirst: {
          datapath: '/path/to/data',
          importPlace: ['123','456']
        }
      }
    };

    const validated = schema.validate(config);

    t.deepEquals(validated.value.imports.whosonfirst.importPlace, [123,456]);
    t.end();

  });

  test.test('non-string importPlace should remain as number', t => {
    const config = {
      imports: {
        whosonfirst: {
          datapath: '/path/to/data',
          importPlace: 123
        }
      }
    };

    const validated = schema.validate(config);

    t.equals(validated.value.imports.whosonfirst.importPlace, 123);
    t.end();

  });

  test.test('array of non-string importPlace should remain as number', t => {
    const config = {
      imports: {
        whosonfirst: {
          datapath: '/path/to/data',
          importPlace: [123, 456]
        }
      }
    };

    const validated = schema.validate(config);

    t.deepEquals(validated.value.imports.whosonfirst.importPlace, [123, 456]);
    t.end();

  });

  test.test('non-string/integer importPlace values should not validate', t => {
    [null, false, {}, 'string'].forEach((value) => {
      const config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            importPlace: value
          }
        }
      };

      const validated = schema.validate(config);

      t.equals(validated.error.details.length, 1);
      t.equals(validated.error.details[0].message, '"imports.whosonfirst.importPlace" must be one of [number, array]');

    });

    t.end();

  });

  test.test('arra of non-string/integer importPlace values should not validate', t => {
    [null, false, {}, 'string'].forEach((value) => {
      const config = {
        imports: {
          whosonfirst: {
            datapath: '/path/to/data',
            importPlace: [value]
          }
        }
      };

      const validated = schema.validate(config);

      t.equals(validated.error.details.length, 1);
      t.equals(validated.error.details[0].message, '"imports.whosonfirst.importPlace[0]" must be a number');

    });

    t.end();

  });

  test.test('non-integer importPlace values should not validate', t => {
    const config = {
      imports: {
        whosonfirst: {
          datapath: '/path/to/data',
          importPlace: 17.3
        }
      }
    };

    const validated = schema.validate(config);

    t.equals(validated.error.details.length, 1);
    t.equals(validated.error.details[0].message, '"imports.whosonfirst.importPlace" must be an integer');
    t.end();

  });

  test.test('array of non-integer importPlace values should not validate', t => {
    const config = {
      imports: {
        whosonfirst: {
          datapath: '/path/to/data',
          importPlace: [17.3, 18.2]
        }
      }
    };

    const validated = schema.validate(config);

    t.equals(validated.error.details.length, 1);
    t.equals(validated.error.details[0].message, '"imports.whosonfirst.importPlace[0]" must be an integer');
    t.end();

  });
  test.end();

});
