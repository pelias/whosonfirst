'use strict';

const Joi = require('joi');

// Schema Configuration
// required:
// * imports.whosonfirst.datapath (string)
//
// optional:
// * imports.whosonfirst.importVenues (boolean) (default: false)
// * imports.whosonfirst.importPostalcodes (boolean) (default: false)
// * imports.whosonfirst.missingFilesAreFatal (boolean) (default: false)

module.exports = Joi.object().keys({
  imports: Joi.object().keys({
    whosonfirst: Joi.object().keys({
      datapath: Joi.string(),
      importVenues: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      importPostalcodes: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      missingFilesAreFatal: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true)
    }).requiredKeys('datapath').unknown(false)
  }).requiredKeys('whosonfirst').unknown(true)
}).requiredKeys('imports').unknown(true);
