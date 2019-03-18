const tape = require('tape');
const proxyquire = require('proxyquire');
const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');
const peliasConfig = require('pelias-config');
const temp = require('temp').track();

proxyquire.noPreserveCache();
proxyquire.noCallThru();

const ADMIN = [
  'ocean',
  'marinearea',
  'continent',
  'empire',
  'country',
  'dependency',
  'disputed',
  'macroregion',
  'region',
  'macrocounty',
  'county',
  'localadmin',
  'locality',
  'borough',
  'neighbourhood'
];

const POSTALCODES = [
  'postalcode'
];

const VENUES = [
  'venue'
];

const SQLITE_EXAMPLE = [
  'whosonfirst-data-constituency-us-ct-1481486175.db',
  'whosonfirst-data-latest.db',
  'whosonfirst-data-postalcode-fr-latest.db',
  'whosonfirst-data-postalcode-jp-latest.db'
];

tape('bundlesList tests', (test) => {
  test.test('all bundles', (t) => {

    const config = {
      generate: () => {
        return peliasConfig.generateCustom({
          imports: {
            whosonfirst: {
              datapath: 'foo',
              importVenues: true,
              importPostalcodes: true
            }
          }
        });
      }
    };

    const bundles = proxyquire('../src/bundleList', { 'pelias-config': config });

    const expected = ADMIN.concat(POSTALCODES).concat(VENUES);

    bundles.generateBundleList((err, bundlesList) => {
      expected.every((type) => {
        const found = bundlesList.some((bundle) => {
          return bundle.indexOf(type) !== -1;
        });
        t.assert(found, type + ' bundle(s) missing');
        return found;
      });
      fs.removeSync('foo');
      t.end();
    });
  });

  test.test('region venue bundles', (t) => {
    const config = {
      generate: () => {
        return peliasConfig.generateCustom({
          imports: {
            whosonfirst: {
              datapath: 'foo',
              importVenues: true,
              importPostalcodes: true
            }
          }
        });
      }
    };

    const bundles = proxyquire('../src/bundleList', { 'pelias-config': config });

    bundles.generateBundleList((err, bundlesList) => {
      t.assert(bundlesList.includes('whosonfirst-data-venue-us-ca-latest.tar.bz2'), 'venue bundle for regions are included');
      fs.removeSync('foo');
      t.end();
    });
  });

  test.test('admin only bundles', (t) => {

    const config = {
      generate: () => {
        return peliasConfig.generateCustom({
          imports: {
            whosonfirst: {
              datapath: 'foo'
            }
          }
        });
      }
    };

    const bundles = proxyquire('../src/bundleList', { 'pelias-config': config });

    const expected = ADMIN;
    const unexpected = POSTALCODES.concat(VENUES);

    bundles.generateBundleList((err, bundlesList) => {
      expected.every((type) => {
        const found = bundlesList.some((bundle) => {
          return bundle.indexOf(type) !== -1;
        });
        t.assert(found, type + ' bundle(s) missing');
        return found;
      });

      unexpected.every((type) => {
        const found = bundlesList.some((bundle) => {
          return bundle.indexOf(type) !== -1;
        });
        t.assert(!found, type + ' bundle(s) should not be there');
        return !found;
      });
      fs.removeSync('foo');
      t.end();
    });
  });

  test.test('--admin-only flag', (t) => {

    const config = {
      generate: () => {
        return peliasConfig.generateCustom({
          imports: {
            whosonfirst: {
              datapath: 'foo',
              importVenues: true,
              importPostalcodes: true
            }
          }
        });
      }
    };

    const previousValue = process.argv[2];
    process.argv[2] = '--admin-only';

    const bundles = proxyquire('../src/bundleList', { 'pelias-config': config });

    const expected = ADMIN;
    const unexpected = POSTALCODES.concat(VENUES);

    bundles.generateBundleList((err, bundlesList) => {
      expected.every((type) => {
        const found = bundlesList.some((bundle) => {
          return bundle.indexOf(type) !== -1;
        });
        t.assert(found, type + ' bundle(s) missing');
        return found;
      });

      t.deepEquals(bundlesList, _.sortedUniq(bundlesList), 'no duplicates should exist in the bundle list');

      unexpected.every((type) => {
        const found = bundlesList.some((bundle) => {
          return bundle.indexOf(type) !== -1;
        });
        t.assert(!found, type + ' bundle(s) should not be there');
        return !found;
      });
      fs.removeSync('foo');
      t.end();

      process.argv[2] = previousValue;
    });
  });

  test.test('supports sqlite', (t) => {
    temp.mkdir('supports_sqlite', (err, temp_dir) => {
      const config = {
        generate: () => {
          return peliasConfig.generateCustom({
            imports: {
              whosonfirst: {
                datapath: temp_dir,
                sqlite: true
              }
            }
          });
        }
      };
      SQLITE_EXAMPLE
        .concat(['ignore_me.csv', 'README.md'])
        .forEach(e => fs.createFileSync(path.join(temp_dir, 'sqlite', e), ''));

      const bundles = proxyquire('../src/bundleList', { 'pelias-config': config });

      bundles.generateBundleList((e, bundlesList) => {
        temp.cleanup((err) => {
          t.notOk(err);
          t.notOk(e);
          t.deepEqual(bundlesList, SQLITE_EXAMPLE);
          t.end();
        });
      });
    });

    test.test('Error when no sqlite is present', (t) => {
      temp.mkdir('missing_sqlite', (err, temp_dir) => {
        const config = {
          generate: () => {
            return peliasConfig.generateCustom({
              imports: {
                whosonfirst: {
                  datapath: temp_dir,
                  sqlite: true
                }
              }
            });
          }
        };
        const bundles = proxyquire('../src/bundleList', { 'pelias-config': config });

        bundles.generateBundleList((e, bundlesList) => {
          temp.cleanup((err) => {
            t.notOk(err);
            t.ok(e);
            t.deepEqual(bundlesList, undefined);
            t.end();
          });
        });
      });
    });
  });
  test.end();
});
