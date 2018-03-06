'use strict';

// convert wofid integer to array of path components
function wofIdToPath( id ){
  let strId = id.toString();
  let parts = [];
  while( strId.length ){
    let part = strId.substr(0, 3);
    parts.push(part);
    strId = strId.substr(3);
  }
  return parts;
}

module.exports = wofIdToPath;
