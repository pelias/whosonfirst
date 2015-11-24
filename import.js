var readStream = require('./src/readStream');
var importStream = require('./src/importStream');

var directory = '../../whosonfirst/whosonfirst-data/';

var wofRecords = {};

readStream(directory, wofRecords, function() {
  console.log(Object.keys(wofRecords).length + ' records loaded');

  importStream(wofRecords);
});
