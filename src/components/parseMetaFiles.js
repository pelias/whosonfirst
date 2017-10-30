const csv_stream = require('csv-stream');
const EOL = require('os').EOL;

// this CSV parser assumes that:
// - the first line contains column names
// - the delimiter is a comma

const options = {
  escapeChar : '"', // default is an empty string
  enclosedChar : '"', // default is an empty string
  endLine: EOL
};

module.exports.create = function create() {
  const csv_parse_stream = csv_stream.createStream(options);

  // override default encoding which is not set properly for Node.js 8
  // see https://github.com/lbdremy/node-csv-stream/issues/13
  csv_parse_stream._encoding = undefined;

  return csv_parse_stream;
};
