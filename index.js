module.exports = {
  metadataStream: require('./src/components/metadataStream'),
  isActiveRecord: require('./src/components/isActiveRecord').create,
  isNotNullIslandRelated: require('./src/components/isNotNullIslandRelated').create,
  loadJSON: require('./src/components/loadJSON').create,
  parseMetaFiles: require('./src/components/parseMetaFiles').create,
  recordHasIdAndProperties: require('./src/components/recordHasIdAndProperties').create,
  recordHasName: require('./src/components/recordHasName').create,
  conformsTo: require('./src/components/conformsTo').create,
  sqliteStream: require('./src/components/sqliteStream')
};
