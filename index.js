module.exports = {
  extractFields: require('./src/components/extractFields').create,
  isActiveRecord: require('./src/components/isActiveRecord').create,
  isValidId: require('./src/components/isValidId').create,
  loadJSON: require('./src/components/loadJSON').create,
  parseMetaFiles: require('./src/components/parseMetaFiles').create,
  recordHasIdAndProperties: require('./src/components/recordHasIdAndProperties').create,
  recordHasName: require('./src/components/recordHasName').create,
  recordNotVisitingNullIsland: require('./src/components/recordNotVisitingNullIsland').create,
};
