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
      // ensure a self-reference exists for the record's own place_type,
      // overriding whatever id (if any) wof:hierarchy has for it. WOF
      // records are occasionally left pointing at a stale/deprecated
      // predecessor id for their own layer (eg. a record renamed/merged
      // without its own wof:hierarchy being regenerated) - since deprecated
      // records are excluded from parentRecords, that stale id would
      // otherwise silently resolve to nothing and drop the layer entirely.
      // See pelias-spatial's equivalent fix in map/hierarchies.js.
      const withSelf = wofRecord.place_type ?
        { ...hierarchy, [`${wofRecord.place_type}_id`]: wofRecord.id } :
        hierarchy;

      return Object.values(withSelf)
        .map(parentId => parentRecords[parentId])
        .filter(Boolean)
        .filter(r => r.name);
    });
  };
};
