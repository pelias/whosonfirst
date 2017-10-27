const parse = require('csv-parser');
const EOL = require('os').EOL;

// this CSV parser assumes that:
// - the first line contains column names
// - the delimiter is a comma

const options = {
  //escape: '"',
  //quote: '"',
  //endLine: EOL
};

module.exports.create = function create() {
  return parse(options);
};
