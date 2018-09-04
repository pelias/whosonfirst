const fs = require('fs');
const path = require('path');

module.exports = (wofRoot) => {
  return {
    create: (placetype) => {
      return fs.createReadStream(path.join(wofRoot, 'meta', `whosonfirst-data-${placetype}-latest.csv`));
    }
  };
};
