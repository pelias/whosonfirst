const config = require( 'pelias-config' ).generate(require('../schema'));

function on_done() {
  console.log('All done!');
}

if (config.imports.whosonfirst.importPlace) {
  require('./download_data_filtered/index').download(on_done);
}
else {
  require('./download_data_all').download(on_done);
}