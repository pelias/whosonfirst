const peliasModel = require('pelias-model');
const blacklistStream = require('pelias-blacklist-stream');

/*
  This function performs the import based on the collection of WOF records
  gathered so far.  The parameters are:

  wof_record_stream: the base stream of WOF records to process
  document_generator: converts a WOF record to a Pelias Document
  destination_pipe: where the Pelias Document instances end up

*/
function fullImport(wof_record_stream, document_generator, destination_pipe, callback) {
  wof_record_stream
    .pipe(document_generator)
    .pipe(blacklistStream())
    .pipe(peliasModel.createDocumentMapperStream())
    .pipe(destination_pipe)
    .on('finish', callback);

}

module.exports = fullImport;
