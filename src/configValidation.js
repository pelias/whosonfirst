'use strict';

const Joi = require('joi');

// who's on first importer requires just `datapath` and defaults `importVenues` to false
const schema = Joi.object().keys({
  datapath: Joi.string(),
  importVenues: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true)
}).requiredKeys('datapath').unknown(false);

module.exports = {
  validate: function validate(config) {
    Joi.validate(config, schema, (err, value) => {
      if (err) {
        throw new Error(err.details[0].message);
      }
    });
  }

};
