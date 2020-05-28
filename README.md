<p align="center">
  <img height="100" src="https://raw.githubusercontent.com/pelias/design/master/logo/pelias_github/Github_markdown_hero.png">
</p>
<h3 align="center">A modular, open-source search engine for our world.</h3>
<p align="center">Pelias is a geocoder powered completely by open data, available freely to everyone.</p>
<p align="center">
<a href="https://en.wikipedia.org/wiki/MIT_License"><img src="https://img.shields.io/github/license/pelias/api?style=flat&color=orange" /></a>
<a href="https://hub.docker.com/u/pelias"><img src="https://img.shields.io/docker/pulls/pelias/api?style=flat&color=informational" /></a>
<a href="https://gitter.im/pelias/pelias"><img src="https://img.shields.io/gitter/room/pelias/pelias?style=flat&color=yellow" /></a>
</p>
<p align="center">
	<a href="https://github.com/pelias/docker">Local Installation</a> ·
        <a href="https://geocode.earth">Cloud Webservice</a> ·
	<a href="https://github.com/pelias/documentation">Documentation</a> ·
	<a href="https://gitter.im/pelias/pelias">Community Chat</a>
</p>
<details open>
<summary>What is Pelias?</summary>
<br />
Pelias is a search engine for places worldwide, powered by open data. It turns addresses and place names into geographic coordinates, and turns geographic coordinates into places and addresses. With Pelias, you’re able to turn your users’ place searches into actionable geodata and transform your geodata into real places.
<br /><br />
We think open data, open source, and open strategy win over proprietary solutions at any part of the stack and we want to ensure the services we offer are in line with that vision. We believe that an open geocoder improves over the long-term only if the community can incorporate truly representative local knowledge.
</details>

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
