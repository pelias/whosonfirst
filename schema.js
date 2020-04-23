const Joi = require('@hapi/joi');

// Schema Configuration
// required:
// * imports.whosonfirst.datapath (string)
//
// optional:
// * imports.whosonfirst.countryCode (string OR array[string]) (default: [])
// * imports.whosonfirst.importPostalcodes (boolean) (default: false)
// * imports.whosonfirst.importConstituencies (boolean) (default: false)
// * imports.whosonfirst.importIntersections (boolean) (default: false)
// * imports.whosonfirst.importPlace (integer OR array[integer]) (default: none)
// * imports.whosonfirst.sqlite (boolean) (default: true)

module.exports = Joi.object().keys({
  imports: Joi.object().required().keys({
    whosonfirst: Joi.object().required().keys({
      countryCode: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string()).default([])
      ).default([]),
      dataHost: Joi.string(),
      datapath: Joi.string().required(),
      importPlace: [
        Joi.number().integer(),
        Joi.array().items(Joi.number().integer())
      ],
      importPostalcodes: Joi.boolean().default(false).truthy('yes').falsy('no'),
      importConstituencies: Joi.boolean().default(false).truthy('yes').falsy('no'),
      maxDownloads: Joi.number().integer(),
      sqlite: Joi.boolean().default(true).truthy('yes').falsy('no')
    }).unknown(false)
  }).unknown(true)
}).unknown(true);
