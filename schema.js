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
// * imports.whosonfirst.importPlace (string OR array[string]) (default: none)
// * imports.whosonfirst.missingFilesAreFatal (boolean) (default: false)

module.exports = Joi.object().keys({
  imports: Joi.object().required().keys({
    whosonfirst: Joi.object().required().keys({
      dataHost: Joi.string(),
      datapath: Joi.string().required(),
      importPlace: [
        Joi.string(),
        Joi.array().items(Joi.string())
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
