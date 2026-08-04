'use strict';

// {country, placetype} combinations where the "longname" - a formal name
// including an administrative-unit qualifier, eg. "Kings County" rather than
// just "Kings" - is the idiomatic/expected display form, rather than the
// bare/short preferred name that's correct almost everywhere else.
const QUALIFIER_PREFERRED_ALLOWLIST = [
  { country: 'US', placetype: 'county' },
  { country: 'CA', placetype: 'county' },
  { country: 'FR', placetype: 'county' },
  { country: 'FR', placetype: 'region' },
  { country: 'FR', placetype: 'macroregion' },
  { country: 'FR', placetype: 'macrocounty' }
];

function isQualifierPreferred(properties) {
  const country = properties['iso:country'] || properties['wof:country'];
  const placetype = properties['wof:placetype'];
  return QUALIFIER_PREFERRED_ALLOWLIST.some(entry =>
    entry.country === country && entry.placetype === placetype
  );
}

// the bare/short preferred name, used for most placetypes in most countries.
// note: 'wof:label' has been officially deprecated
// see: https://github.com/whosonfirst-data/whosonfirst-data/issues/1540#issuecomment-481824475
// see: https://github.com/whosonfirst-data/whosonfirst-data/issues/1540
// see: https://github.com/whosonfirst-data/whosonfirst-data/pull/1548
function getShortname(properties) {
  if (properties['wof:label']) {
    return properties['wof:label'];
  }
  return properties['wof:name'];
}

// get an array of language codes officially spoken at this location
function getLanguages(properties) {
  if (!Array.isArray(properties['wof:lang_x_official'])) {
    return [];
  }
  return properties['wof:lang_x_official']
    .filter(l => (typeof l === 'string' && l.length === 3))
    .map(l => l.toLowerCase());
}

// the formal, qualifier-including name - only consulted for the
// country/placetype combinations in QUALIFIER_PREFERRED_ALLOWLIST above.
//
// checks the record's own official language(s) first, falling back to
// English - matching the fact that the API almost always requests English
// by default, but preferring a local-language longname when one is present.
function getLongname(properties) {
  const langs = getLanguages(properties);
  if (!langs.includes('eng')) {
    langs.push('eng');
  }
  for (const lang of langs) {
    const longnameArr = properties[`label:${lang}_x_preferred_longname`];
    if (Array.isArray(longnameArr) && longnameArr.length && longnameArr[0]) {
      return longnameArr[0];
    }
  }
  if (properties['qs:a2_alt']) {
    return properties['qs:a2_alt'];
  }
  return undefined;
}

function getDefaultName(properties) {
  if (isQualifierPreferred(properties)) {
    return getLongname(properties) || getShortname(properties);
  }
  return getShortname(properties);
}

module.exports = getDefaultName;
module.exports.getShortname = getShortname;
module.exports.getLongname = getLongname;
module.exports.isQualifierPreferred = isQualifierPreferred;
