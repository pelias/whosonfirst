const tape = require('tape');
const proxyquire = require('proxyquire');
const fs = require('fs-extra');
const _ = require('lodash');
const peliasConfig = require('pelias-config');

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
});
