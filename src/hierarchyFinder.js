var _ = require('lodash');

module.exports = {};

var hasName = function(r) {
  return r.name;
};

var isDefined = function(r) {
  return r;
};

/*
  This function builds a hierarchy by starting with the current record and
  walking up by parent_id until a parent can't be found, filtering out those
  w/o name.
*/
module.exports.parent_id_walker = function(wofRecords) {
  return function(wofRecord) {
    // collect all the defined parents, starting with the current record
    var parent;
    var parents = [];
    var parent_id = wofRecord.id;

    while (!_.isUndefined(parent = wofRecords[parent_id])) {
      parents.push(parent);
      parent_id = parent.parent_id;
    }

    // return an array since the hierarchies_walker can return an array
    //  even though the concept doesn't make sense for parent_id's
    return [parents.filter(hasName)];

  };

};

/*
  This function finds all the WOF records associated with a hierarchy

  For example, a record with the hierarchy:
  {
    "continent_id":102191569,
    "country_id":85632717,
    "region_id":85668357
  }

  would return:
  [
    records[102191569],
    records[85632717],
    records[85668357]
  ]

  lastly, filter out any hierarchy elements that are undefined or w/o a name

*/
function resolveHierarchy(wofRecords, hierarchy) {
  return Object.keys(hierarchy).map(function(key) {
    return wofRecords[hierarchy[key]];
  }).filter(isDefined).filter(hasName);
}

module.exports.hierarchies_walker = function(wofRecords) {
  return function(wofRecord) {
    var resolvedHierarchies = [];

    wofRecord.hierarchies.forEach(function(hierarchy) {
      resolvedHierarchies.push(resolveHierarchy(wofRecords, hierarchy));
    });

    return resolvedHierarchies;

  };
};
