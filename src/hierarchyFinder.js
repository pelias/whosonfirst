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

/*
 This function returns all the resolved hierarchies for a wofRecord.  Each
 wofRecord can have multiple hierarchies, so resolve them by looking up the
 referenced wofRecord in the big collection of parentRecords.
*/
module.exports = (parentRecords) => {
  return (wofRecord) => {
    return wofRecord.hierarchies.map(hierarchy => {
      return Object.values(hierarchy)
        .map(parentId => parentRecords[parentId])
        .filter(Boolean)
        .filter(r => r.name);
    });
  };
};
