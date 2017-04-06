# Pelias Who's on First Data Importer

This repository is part of the [Pelias](https://github.com/pelias/pelias)
project. Pelias is an open-source, open-data geocoder built by
[Mapzen](https://www.mapzen.com/) that also powers [Mapzen Search](https://mapzen.com/projects/search). Our
official user documentation is [here](https://mapzen.com/documentation/search/).

## Overview

pelias-whosonfirst is a tool used for importing [Who's On First data](https://whosonfirst.mapzen.com/) from local files into a Pelias ElasticSearch store.

## Requirements

Node.js 4 or higher is required

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
- localadmin
- locality
- macrocounty
- macroregion
- neighbourhood
- region
- postalcodes (optional, see configuration)

Other types may be included in the future.

[This page](https://github.com/whosonfirst/whosonfirst-placetypes) has a description of all the types supported by Who's on First.

## Configuration

This importer is configured using the [`pelias-config`](https://github.com/pelias/config) module. 
The following configuration options are supported by this importer.

| key | required | default | description |
| --- | --- | --- | --- |
| `imports.whosonfirst.datapath` | yes | | full path to where Who's on First data is located (note: the included [downloader script](#downloading-the-data) will automatically place the WOF data here, and is the recommended way to obtain WOF data) |
| `imports.whosonfirst.importPostalcodes` | no | false | set to `true` to include postalcodes in the data download and import process |
| `imports.whosonfirst.importVenues` | no | false | set to `true` to include venues in the data download and import process |

## Downloading the Data

* The enclosed script `download_data.js` will download the required bundles and place the data into the datapath configured in [pelias-config](https://github.com/pelias/config) in the required directory layout.  To install the required node module dependencies and run the download script:

```bash
npm install
npm run download

## or

npm run download -- --admin-only # to only download hierarchy data, without venues or postalcodes
```

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
