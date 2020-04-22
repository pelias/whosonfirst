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

const SQLITE_EXAMPLE = [
  'whosonfirst-data-constituency-us-ct-1481486175.db',
  'whosonfirst-data-latest.db',
  'whosonfirst-data-postalcode-fr-latest.db',
  'whosonfirst-data-postalcode-jp-latest.db'
];

tape('bundlesList tests', (test) => {

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
