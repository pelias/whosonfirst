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
      const readStream = readStreamModule.create({ datapath: temp_dir, sqlite: true, importShapes: true }, ['whosonfirst-data-latest.db'], wofAdminRecords);
      const documentGenerator = peliasDocGenerators.create(hierarchyFinder(wofAdminRecords));
      const dbClientStream = sink.obj(record => {
        recordOrder.push(record.data.source_id);
        dbRecords[record.data.source_id] = record.data;
      });

      importStream(readStream, documentGenerator, dbClientStream, () => {
        t.ok(dbRecords[101772677]);
        t.deepEqual(recordOrder, ['85633147', '1108826387', '85683431', '404227861', '102068587', '404414453', '101772677']);
        t.deepEqual(dbRecords[101772677].shape, {
          coordinates:[[[4.725057,43.993083],[4.724003,43.993288],[4.722264,43.993505],[4.722074,43.993418],[4.721708,43.992028],[4.721318,43.991503],[4.720796,43.991151],[4.720609,43.991154],[4.719958,43.991894],[4.719771,43.991897],[4.719264,43.991634],[4.716917,43.99069],[4.716227,43.990566],[4.715231,43.990591],[4.71399,43.990799],[4.70856,43.992252],[4.707696,43.992545],[4.702638,43.993956],[4.696921,43.995836],[4.695008,43.996505],[4.691377,43.997705],[4.689834,43.998233],[4.688643,43.998035],[4.686647,43.997985],[4.684845,43.998201],[4.683678,43.998399],[4.681814,43.998617],[4.677906,43.999289],[4.67665,43.999426],[4.673878,43.999729],[4.671699,43.999817],[4.670635,43.999707],[4.669055,43.99938],[4.668244,43.999392],[4.665823,43.999762],[4.664979,44.000324],[4.663961,44.00133],[4.663292,44.001889],[4.663111,44.002117],[4.662806,44.002347],[4.662313,44.002534],[4.660767,44.002972],[4.659794,44.003392],[4.658683,44.003813],[4.653872,44.005183],[4.6485,44.006596],[4.643763,44.006685],[4.638028,44.006753],[4.636845,44.006825],[4.636898,44.008229],[4.636934,44.009038],[4.637026,44.011377],[4.63694,44.014025],[4.636841,44.016241],[4.636722,44.016423],[4.636357,44.016752],[4.636111,44.016891],[4.635235,44.01676],[4.634607,44.016644],[4.634132,44.016606],[4.633688,44.016783],[4.633382,44.016977],[4.632738,44.017122],[4.634274,44.017639],[4.635797,44.018111],[4.63688,44.018896],[4.637322,44.019069],[4.638263,44.019271],[4.642354,44.020092],[4.643425,44.020472],[4.643944,44.020735],[4.6452,44.021022],[4.646701,44.02117],[4.649925,44.020933],[4.650806,44.020775],[4.651978,44.020307],[4.656076,44.020083],[4.65726,44.020057],[4.658355,44.019536],[4.659106,44.019182],[4.662836,44.018766],[4.663153,44.01895],[4.663478,44.019395],[4.66418,44.019916],[4.664387,44.020182],[4.665148,44.020612],[4.665652,44.020784],[4.667087,44.020798],[4.667769,44.020653],[4.668745,44.020323],[4.669972,44.01962],[4.670781,44.019563],[4.671107,44.020044],[4.671424,44.020219],[4.671736,44.020214],[4.672179,44.020028],[4.672835,44.019423],[4.673147,44.019419],[4.675376,44.020537],[4.675817,44.02071],[4.676424,44.020116],[4.676649,44.019707],[4.677832,44.019635],[4.678795,44.02016],[4.68065,44.021293],[4.68084,44.02138],[4.681711,44.021313],[4.682622,44.020894],[4.683782,44.020057],[4.684685,44.019359],[4.68539,44.019573],[4.686525,44.019996],[4.688098,44.020467],[4.688746,44.020853],[4.689204,44.021567],[4.690618,44.022571],[4.69156,44.022772],[4.693503,44.023102],[4.697731,44.024315],[4.69905,44.024601],[4.701818,44.024954],[4.710607,44.026392],[4.71098,44.026341],[4.711287,44.026193],[4.716219,44.024648],[4.716464,44.024509],[4.716957,44.024321],[4.717234,44.023552],[4.718892,44.021041],[4.720255,44.01948],[4.723507,44.016485],[4.724713,44.015512],[4.725845,44.014189],[4.726033,44.014222],[4.726603,44.014483],[4.728755,44.015115],[4.730582,44.015708],[4.730831,44.015704],[4.73214,44.014054],[4.734508,44.013962],[4.738156,44.013337],[4.738476,44.013197],[4.741723,44.007186],[4.735342,43.999167],[4.735273,43.998952],[4.735017,43.998731],[4.727735,43.994652],[4.726975,43.994268],[4.726073,43.993697],[4.725187,43.993261],[4.725057,43.993083]]],
          type:"Polygon"
        }, 'correctly imported geometry as shape');
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
