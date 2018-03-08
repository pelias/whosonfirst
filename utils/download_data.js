const config = require( 'pelias-config' ).generate(require('../schema'));

function on_done() {
  console.log('All done!');
}

if (config.imports.whosonfirst.sqliteDatabases) {
  require('./sqlite_download').download(() => {
    require('./sqlite_extract_data').extract({ unlink: true }, on_done);
  });
}
else if (config.imports.whosonfirst.importPlace) {
  console.error(`
    The whosonfirst API is currently offline (due to the shutdown of mapzen).

    We recommend updating your ~/pelias.json to use the new sqlite extract scripts instead.
    The sqlite databases are the preferred method of sourcing regional extracts going forward.

    Visit: https://dist.whosonfirst.org/sqlite/
    Select the database file(s) you would like to use and add them to your ~/pelias.json
    You may then rerun this script, the databases will be downloaded/updated for you.

    example config section:

    "whosonfirst": {
      "datapath": "/tmp",
      "importVenues": false,
      "importPostalcodes": true,
      "importPlace": "101715829",
      "sqliteDatabases": [
        { "filename": "whosonfirst-data-latest.db" },
        { "filename": "whosonfirst-data-postalcode-us-latest.db" }
      ]
    }

    see: https://github.com/pelias/whosonfirst/pull/324 for more info`
  );
  process.exit(1);
  // require('./download_data_filtered/index').download(on_done);
}
else {
  require('./download_data_all').download(on_done);
}
