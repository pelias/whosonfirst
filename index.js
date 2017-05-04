module.exports = {
  extractFields: require('./src/components/extractFields').create,
  isActiveRecord: require('./src/components/isActiveRecord').create,
  isNotNullIslandRelated: require('./src/components/isNotNullIslandRelated').create,
  loadJSON: require('./src/components/loadJSON').create,
  parseMetaFiles: require('./src/components/parseMetaFiles').create,
  recordHasIdAndProperties: require('./src/components/recordHasIdAndProperties').create,
  recordHasName: require('./src/components/recordHasName').create
};
