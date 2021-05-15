const tape = require('tape');
const importStream = require('../src/importStream');
const readStreamModule = require('../src/readStream');
const hierarchyFinder = require('../src/hierarchyFinder');
const peliasDocGenerators = require('../src/peliasDocGenerators');
const sink = require('through2-sink');
const temp = require('temp').track();
const generateWOFDB = require('./generateWOFDB');
const path = require('path');

tape('functional', function(test) {
  test.test('SQLite database read with correct hierarchy for Tavel', t => {
    temp.mkdir('tmp_sqlite', (err, temp_dir) => {
      generateWOFDB(path.join(temp_dir, 'sqlite', 'whosonfirst-data-latest.db'), require('./resources/france.json').tavel);
      const wofAdminRecords = {};
      const recordOrder = [];
      const dbRecords = {};
      const readStream = readStreamModule.create({ datapath: temp_dir, sqlite: true }, ['whosonfirst-data-latest.db'], wofAdminRecords);
      const documentGenerator = peliasDocGenerators.create(hierarchyFinder(wofAdminRecords));
      const dbClientStream = sink.obj(record => {
        recordOrder.push(record.data.source_id);
        dbRecords[record.data.source_id] = record.data;
      });

      importStream(readStream, documentGenerator, dbClientStream, () => {
        t.ok(dbRecords[101772677]);
        t.deepEqual(recordOrder, ['85633147', '1108826387', '85683431', '404227861', '102068587', '404414453', '101772677']);
        t.deepEqual(dbRecords[101772677].parent, {
          country: ['France'],
          country_id: ['85633147'],
          country_a: ['FRA'],
          country_source: [null],
          county: ['Roquemaure'],
          county_id: ['102068587'],
          county_a: [null],
          county_source: [null],
          localadmin: ['Tavel'],
          localadmin_id: ['404414453'],
          localadmin_a: [null],
          localadmin_source: [null],
          locality: ['Tavel'],
          locality_id: ['101772677'],
          locality_a: [null],
          locality_source: [null],
          macrocounty: ['Arrondissement of Nimes'],
          macrocounty_id: ['404227861'],
          macrocounty_a: [null],
          macrocounty_source: [null],
          macroregion: ['Occitanie'],
          macroregion_id: ['1108826387'],
          macroregion_a: [null],
          macroregion_source: [null],
          region: ['département des Gard'],
          region_id: ['85683431'],
          region_a: ['GA'],
          region_source: [null]
        }, 'correct parent hierarchy for Tavel');
        temp.cleanupSync();
        t.end();
      });
    });
  });
  test.end();

});
