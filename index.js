module.exports = {
  isActiveRecord: require('./src/components/isActiveRecord').create,
  isNotNullIslandRelated: require('./src/components/isNotNullIslandRelated').create,
  recordHasIdAndProperties: require('./src/components/recordHasIdAndProperties').create,
  recordHasName: require('./src/components/recordHasName').create,
  conformsTo: require('./src/components/conformsTo').create,
  SQLiteStream: require('./src/components/sqliteStream'),
  toJSONStream: require('./src/components/toJSONStream').create
};
