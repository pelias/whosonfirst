const tape = require('tape');
const proxyquire = require('proxyquire');
const fs = require('fs');
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

const SQLITE_EXAMPLE = [
  'whosonfirst-data-constituency-us-ct-1481486175.db',
  'whosonfirst-data-latest.db',
  'whosonfirst-data-postalcode-fr-latest.db',
  'whosonfirst-data-postalcode-jp-latest.db'
];

tape('bundlesList tests', (test) => {

  test.test('supports sqlite', (t) => {
    temp.mkdir('supports_sqlite', (err, temp_dir) => {
      fs.mkdirSync(path.join(temp_dir, 'sqlite'), { recursive: true });
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
        .forEach(e => fs.writeFileSync(path.join(temp_dir, 'sqlite', e), ''));

      const bundles = proxyquire('../src/bundleList', { 'pelias-config': config });

      bundles.generateBundleList((e, bundlesList) => {
        temp.cleanup((err) => {
          t.notOk(err);
          t.notOk(e);
          t.deepEqual(bundlesList.sort(), SQLITE_EXAMPLE);
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
  test.test('supports sqlite in root wof dir', (t) => {
    temp.mkdir('supports_sqlite', (err, temp_dir) => {
      fs.mkdirSync(temp_dir, { recursive: true });
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
        .forEach(e => fs.writeFileSync(path.join(temp_dir, e), ''));

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
  });
  test.test('sqlite in root dir and sqlite folder', (t) => {
    temp.mkdir('supports_sqlite', (err, temp_dir) => {
      fs.mkdirSync(temp_dir, { recursive: true });
      fs.mkdirSync(path.join(temp_dir, 'sqlite'), { recursive: true });
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
      const halfLength = Math.ceil(SQLITE_EXAMPLE.length / 2);
      SQLITE_EXAMPLE
        .concat(['ignore_me.csv', 'README.md']).slice(0, halfLength)
        .forEach(e => fs.writeFileSync(path.join(temp_dir, e), ''));
        
      SQLITE_EXAMPLE
        .concat(['ignore_me.csv', 'README.md'])
        .slice(halfLength)
        .forEach(e => fs.writeFileSync(path.join(temp_dir,'sqlite', e), ''));

      const bundles = proxyquire('../src/bundleList', { 'pelias-config': config });

      bundles.generateBundleList((e, bundlesList) => {
        temp.cleanup((err) => {
          t.notOk(err);
          t.notOk(e);
          //Due to the split above we need to sort before comparison. Otherwise order is wrong and the test fails
          t.deepEqual(bundlesList.sort(), SQLITE_EXAMPLE);
          t.end();
        });
      });
    });
  });
  test.end();
});
