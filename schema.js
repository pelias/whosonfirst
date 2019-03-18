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
// * imports.whosonfirst.missingFilesAreFatal (boolean) (default: false)

module.exports = Joi.object().keys({
  imports: Joi.object().keys({
    whosonfirst: Joi.object().keys({
      dataHost: Joi.string(),
      datapath: Joi.string(),
      importPlace: [
        Joi.number().integer(),
        Joi.array().items(Joi.number().integer())
      ],
      importVenues: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      importPostalcodes: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      importConstituencies: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      importIntersections: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      missingFilesAreFatal: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true),
      maxDownloads: Joi.number().integer(),
      sqlite: Joi.boolean().default(false).truthy('yes').falsy('no').insensitive(true)
    }).requiredKeys('datapath').unknown(false)
  }).requiredKeys('whosonfirst').unknown(true)
}).requiredKeys('imports').unknown(true);
