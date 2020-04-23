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

It's **strongly recommended** that you set at least the `countryCode` parameter
in `pelias.json` before importing, to reduce the amount of data downloaded.

To install the required Node.js module dependencies, download data for the entire planet (25GB+) and execute the importer, run:


```bash
npm install
npm run download
npm start
```


## Configuration

This importer is configured using the [`pelias-config`](https://github.com/pelias/config) module.
The following configuration options are supported by this importer.

### `imports.whosonfirst.countryCode`

* Required: no (but **recommended**)
* Default: ``

Use `countryCode` to configure which country-specific download files to use, saving significant disk space and bandwidth. Can be set to either a single two digit [ISO 3166-1](https://en.wikipedia.org/wiki/ISO_3166-1) country code, or an array of multiple country codes.

For all valid download options, see the [Geocode Earth Who's on First data downloads](https://geocode.earth/data/whosonfirst).

### `imports.whosonfirst.datapath`

* Required: yes
* Default: ``

Full path to where Who's on First data is located (note: the included [downloader script](#downloading-the-data) will automatically place the WOF data here, and is the recommended way to obtain WOF data)

### `imports.whosonfirst.importPlace`

* Required: no
* Default: ``

Set to a WOF ID or array of IDs to import data only for descendants of those records, rather than the entire planet.

You can use the [Who's on First Spelunker](https://spelunker.whosonfirst.org) or the `source_id` field from any WOF result of a Pelias query to determine these values.

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

## Downloading the Data

The `download` script will download the required SQLite databases into the datapath configured in `imports.whosonfirst.datapath`.

To install the required node module dependencies and run the download script:

```bash
npm install
npm run download

## or

npm run download -- --admin-only # to only download hierarchy data, without postalcodes
```

## Placetypes

This importer supports most of the major [placetypes in the Who's on First project](https://github.com/whosonfirst/whosonfirst-placetypes)

Primarily it supports hierarchy data to represent things like cities, countries, counties, boroughs, etc.

Additionally this importer can bring in postal code data.

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

Other types may be included in the future.

### In Other Projects

This project exposes a collection of Node.js functionality for dealing with Who's on First data and metadata files:

- `isActiveRecord`: rejects records that are superseded, deprecated, or otherwise inactive
- `isNotNullIslandRelated`: rejects [Null Island](https://spelunker.whosonfirst.org/id/1) and other records that intersect it (currently just postal codes at 0/0)
- `recordHasIdAndProperties`: rejects Who's on First records missing id or properties
- `recordHasName`: rejects records without names
- `conformsTo`: filter Who's on First records on a predicate (see lodash's [conformsTo](https://lodash.com/docs/4.17.4#conformsTo) for more information)
- `SQLiteStream`: provides a Node.js Stream of Who's on First records from a SQLite database
- `toJSONStream`: a Node.js stream to convert SQLite records to JSON
