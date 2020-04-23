>This repository is part of the [Pelias](https://github.com/pelias/pelias)
>project. Pelias is an open-source, open-data geocoder originally sponsored by
>[Mapzen](https://www.mapzen.com/). Our official user documentation is
>[here](https://github.com/pelias/documentation).

# Pelias Who's on First Data Importer

[![Greenkeeper badge](https://badges.greenkeeper.io/pelias/whosonfirst.svg)](https://greenkeeper.io/)

## Overview

pelias-whosonfirst is a tool used for importing data from the [Who's On First](https://whosonfirst.org/) project from local files into a Pelias ElasticSearch store.

## Requirements

Node.js is required.

See [Pelias software requirements](https://github.com/pelias/documentation/blob/master/requirements.md) for required and recommended versions.

## Quickstart Usage

To install the required Node.js module dependencies, download data for the entire planet (20GB+) and execute the importer, run:

```bash
npm install
npm run download
npm start
```

## Configuration

This importer is configured using the [`pelias-config`](https://github.com/pelias/config) module.
The following configuration options are supported by this importer.

### `imports.whosonfirst.datapath`

* Required: yes
* Default: ``

Full path to where Who's on First data is located (note: the included [downloader script](#downloading-the-data) will automatically place the WOF data here, and is the recommended way to obtain WOF data)

### `imports.whosonfirst.countryCode`

* Required: no
* Default: ``

Set sqlite country codes to download. Geocode Earth provides two types of SQLite extracts:
- [combined](https://geocode.earth/data/whosonfirst/combined): databases of the whole planet for `Administrative Boundaries`, `Postal Code` and `Constituencies`
- [single country](https://geocode.earth/data/whosonfirst): per country databases for `Administrative Boundaries`, `Postal Code` and `Constituencies`

### `imports.whosonfirst.importPlace`

* Required: no
* Default: ``

Set to a WOF ID or array of IDs to import data only for descendants of those records, rather than the entire planet.

You can use the [Who's on First Spelunker](https://spelunker.whosonfirst.org) or the `source_id` field from any WOF result of a Pelias query to determine these values.

Specifying a value for `importPlace` will download the full planet SQLite database (27GB). Support for individual country downloads [may be added in the future](https://github.com/pelias/whosonfirst/issues/459)

### `imports.whosonfirst.importPostalcodes`

* Required: no
* Default: `true`

Set to true to enable importing postalcode records. There are over 3 million postal code records.

### `imports.whosonfirst.maxDownloads`

* Required: no
* Default: `4`

The maximum number of files to download simultaneously. Higher values can be faster, but can also cause donwload errors.

### `imports.whosonfirst.dataHost`

* Required: no
* Default: `https://data.geocode.earth/wof/dist`

The location to download Who's on First data from. Changing this can be useful to use custom data, pin data to a specific date, etc.

### `imports.whosonfirst.sqlite`

* Required: no
* Default: `true`

Set to `true` to use Who's on First SQLite databases instead of GeoJSON bundles.

SQLite databases take up less space on disk and can be much more efficient to
download and extract.

This option [is the default](https://github.com/pelias/whosonfirst/issues/460).

## Downloading the Data

The `download` script will download the required bundles/sqlite databases into the datapath configured in `imports.whosonfirst.datapath`.

To install the required node module dependencies and run the download script:

```bash
npm install
npm run download

## or

npm run download -- --admin-only # to only download hierarchy data, without venues or postalcodes
```

**Note:** The download script will always download data for the entire planet. Support for downloading data for specific countries is [a possible future enhancement](https://github.com/pelias/whosonfirst/issues/459).

When using `imports.whosonfirst.importPlace`, a new SQLite database will only be downloaded if new data is available. Otherwise, the existing download will be reused.

**Warning**: Who's on First data is _big_. Just the hierarchy data is tens of GB, and the full dataset is over 100GB on disk.
Additionally, Who's on First uses one file per record. In addition to lots of disk space,
you need lots of free [inodes](https://en.wikipedia.org/wiki/Inode). On
Linux/Mac,  `df -ih` can show you how many free inodes you have.

Expect to use a few million inodes for Who's on First. You probably don't want to store multiple copies of the Who's on First data due to its disk requirements.

## Types

There are two major categories of Who's on First data supported: hierarchy (or admin) data, and venues.

Hierarchy data represents things like cities, countries, counties, boroughs, etc.

Venues represent individual places like the Statue of Liberty, a gas station, etc. Venues are subdivided by country, and sometimes regions within a country.

Currently, the supported hierarchy types are:

- borough
- continent
- country
- county
- dependency
- disputed
- [empire](https://www.youtube.com/watch?v=-bzWSJG93P8)
- localadmin
- locality
- macrocounty
- macrohood
- macroregion
- marinearea
- neighbourhood
- ocean
- region
- postalcodes (optional, see configuration)

Other types may be included in the future.

[The Who's on First documentation](https://github.com/whosonfirst/whosonfirst-placetypes) has a description of all the types supported by Who's on First.


### In Other Projects

This project exposes a number of node streams for dealing with Who's on First data and metadata files:

- `recordHasIdAndProperties`: rejects Who's on First records missing id or properties
- `isActiveRecord`: rejects records that are superseded, deprecated, or otherwise inactive
- `isNotNullIslandRelated`: rejects [Null Island](https://spelunker.whosonfirst.org/id/1) and other records that intersect it (currently just postal codes at 0/0)
- `recordHasName`: rejects records without names
- `conformsTo`: filter Who's on First records on a predicate (see lodash's [conformsTo](https://lodash.com/docs/4.17.4#conformsTo) for more information)
