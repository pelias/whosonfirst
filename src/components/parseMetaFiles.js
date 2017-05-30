const parse = require('csv-stream');
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
  return parse.createStream(options);
};
