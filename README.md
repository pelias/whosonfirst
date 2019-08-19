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

## Configuration

This importer is configured using the [`pelias-config`](https://github.com/pelias/config) module.
The following configuration options are supported by this importer.

### `imports.whosonfirst.datapath`

* Required: yes
* Default: ``

Full path to where Who's on First data is located (note: the included [downloader script](#downloading-the-data) will automatically place the WOF data here, and is the recommended way to obtain WOF data)

### `imports.whosonfirst.importPlace`

* Required: no
* Default: ``

Set to a WOF ID or array of IDs to import data only for descendants of those records, rather than the entire planet.

You can use the [Who's on First Spelunker](https://spelunker.whosonfirst.org) or the `source_id` field from any WOF result of a Pelias query to determine these values.

Specifying a value for `importPlace` will download the full planet SQLite database (27GB). Support for individual country downloads [may be added in the future](https://github.com/pelias/whosonfirst/issues/459)

### `imports.whosonfirst.importVenues`

* Required: no
* Default: `false`

Set to true to enable importing venue records. There are over 15 million venues so this option will add substantial download and disk usage requirements.

It is currently [not recommended to import venues](https://github.com/pelias/whosonfirst/issues/94).


### `imports.whosonfirst.importPostalcodes`

* Required: no
* Default: `false`

Set to true to enable importing postalcode records. There are over 3 million postal code records.

Setting this option to `true` is well tested and [may become the default in the future](https://github.com/pelias/config/issues/61).

### `imports.whosonfirst.missingFilesAreFatal`

* Required: no
* Default: `false`

Set to `true` for missing files from [Who's on First bundles](https://dist.whosonfirst.org/bundles/) to stop the import process.

This flag is useful if you consider it vital that all Who's on First data is successfully imported, and can be helpful to guard against incomplete downloads or other types of failure.

### `imports.whosonfirst.maxDownloads`

* Required: no
* Default: `4`

The maximum number of files to download simultaneously. Higher values can be faster, but can also cause donwload errors.

### `imports.whosonfirst.dataHost`

* Required: no
* Default: `https://dist.whosonfirst.org/`

The location to download Who's on First data from. Changing this can be useful to use custom data, pin data to a specific date, etc.

### `imports.whosonfirst.sqlite`

* Required: no
* Default: `false`

Set to `true` to use Who's on First SQLite databases instead of GeoJSON bundles.

SQLite databases take up less space on disk and can be much more efficient to
download and extract.

This option may [become the default in the near future](https://github.com/pelias/whosonfirst/issues/460).

However, both the Who's on First processes to generate
these files and the Pelias code to use them is new and not yet considered
production ready.

## Downloading the Data

* The `download` script will download the required bundles/sqlite databases and place the data into the datapath configured in [pelias-config](https://github.com/pelias/config) in the required directory layout.
To install the required node module dependencies and run the download script:

```bash
npm install
npm run download

## or

npm run download -- --admin-only # to only download hierarchy data, without venues or postalcodes
```

When running an instance intended to provide coverage for an area smaller than the entire world,
it is recommended that the `importPlace` config parameter is used to limit the data download to records
that are parents or descendants of the specified place. See the configuration details in the above section of this document.
We currently only support a single ID at a time. If multiple places need to be downloaded, the script can be executed multiple times;
one for each desired place.

**Warning**: Who's on First data is _big_. Just the hierarchy data is tens of GB, and the full dataset is over 100GB on disk.
Additionally, Who's on First uses one file per record. In addition to lots of disk space,
you need lots of free [inodes](https://en.wikipedia.org/wiki/Inode). On
Linux/Mac,  `df -ih` can show you how many free inodes you have.

Expect to use a few million inodes for Who's on First. You probably don't want to store multiple copies of the Who's on First data due to its disk requirements.

## Usage

To install the required node module dependencies and execute the importer, run:

```bash
$> npm install
$> npm start
```

### In Other Projects

This project exposes a number of node streams for dealing with Who's on First data and metadata files:

- `metadataStream`: streams rows from a Who's on First metadata file
- `parseMetaFiles`: CSV parse stream configured for metadata file contents
- `loadJSON`: parallel stream that asynchronously loads GeoJSON files
- `recordHasIdAndProperties`: rejects Who's on First records missing id or properties
- `isActiveRecord`: rejects records that are superseded, deprecated, or otherwise inactive
- `isNotNullIslandRelated`: rejects [Null Island](https://spelunker.whosonfirst.org/id/1) and other records that intersect it (currently just postal codes at 0/0)
- `recordHasName`: rejects records without names
- `conformsTo`: filter Who's on First records on a predicate (see lodash's [conformsTo](https://lodash.com/docs/4.17.4#conformsTo) for more information)
