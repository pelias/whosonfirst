const Joi = require('@hapi/joi');

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
  imports: Joi.object().required().keys({
    whosonfirst: Joi.object().required().keys({
      dataHost: Joi.string(),
      datapath: Joi.string().required(),
      isoCountryCodes: [
        Joi.string(),
        Joi.array().items(Joi.string())
      ],
      importPlace: [
        Joi.number().integer(),
        Joi.array().items(Joi.number().integer())
      ],
      importVenues: Joi.boolean().default(false).truthy('yes').falsy('no'),
      importPostalcodes: Joi.boolean().default(false).truthy('yes').falsy('no'),
      importConstituencies: Joi.boolean().default(false).truthy('yes').falsy('no'),
      importIntersections: Joi.boolean().default(false).truthy('yes').falsy('no'),
      missingFilesAreFatal: Joi.boolean().default(false).truthy('yes').falsy('no'),
      maxDownloads: Joi.number().integer(),
      sqlite: Joi.boolean().default(false).truthy('yes').falsy('no')
    }).unknown(false)
  }).unknown(true)
}).unknown(true);
