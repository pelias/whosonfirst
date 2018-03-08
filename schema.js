const Joi = require('joi');

// Schema Configuration
// required:
// * imports.whosonfirst.datapath (string)
//
// optional:
// * imports.whosonfirst.importVenues (boolean) (default: false)
// * imports.whosonfirst.importPostalcodes (boolean) (default: false)
// * imports.whosonfirst.importConstituencies (boolean) (default: false)
// * imports.whosonfirst.importIntersections (boolean) (default: false)
// * imports.whosonfirst.importPlace (integer OR array[integer]) (default: none)
// * imports.whosonfirst.api_key (string) (default: none) DEPRECATED
// * imports.whosonfirst.missingFilesAreFatal (boolean) (default: false)

module.exports = Joi.object().keys({
  imports: Joi.object().keys({
    whosonfirst: Joi.object().keys({
      datapath: Joi.string(),
      importPlace: [
        Joi.number().integer(),
        Joi.array().items(Joi.number().integer())
      ],
      api_key: Joi.string(),
      importVenues: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      importPostalcodes: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      importConstituencies: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      importIntersections: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      missingFilesAreFatal: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true)
    }).requiredKeys('datapath').unknown(false)
  }).requiredKeys('whosonfirst').unknown(true)
}).requiredKeys('imports').unknown(true);
