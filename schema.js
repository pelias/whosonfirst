'use strict';

const Joi = require('joi');

// who's on first importer requires just `datapath` and defaults `importVenues` to false
module.exports = Joi.object().keys({
  imports: Joi.object().keys({
    whosonfirst: Joi.object().keys({
      datapath: Joi.string(),
      importVenues: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true)
    }).requiredKeys('datapath').unknown(false)
  }).requiredKeys('whosonfirst')
}).requiredKeys('imports');
