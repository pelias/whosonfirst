# Pelias Who's on First Data Importer

This repository is part of the [Pelias](https://github.com/pelias/pelias)
project. Pelias is an open-source, open-data geocoder built by
[Mapzen](https://www.mapzen.com/) that also powers [Mapzen Search](https://mapzen.com/projects/search). Our
official user documentation is [here](https://mapzen.com/documentation/search/).

## Overview

pelias-whosonfirst is a tool used for importing [Who's On First data](https://whosonfirst.mapzen.com/) from local files into a Pelias ElasticSearch store.

## Requirements

Node 0.12 or higher is required

## Usage

To install the required node module dependencies and execute the importer, run:

```bash
$> npm install
$> npm start
```

## Types

Currently, the supported types are:

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

Other types may be included in the future.

[This page](https://github.com/whosonfirst/whosonfirst-placetypes) has a description of all the types supported by Who's on First.

## Data

There are multiple ways to download Who's On First data

* The enclosed script `download_data.js` will download the required bundles and place the data into `./wof_data` in the required directory layout.  To install the required node module dependencies and run the download script:

```bash
npm install
npm run download
```

Alternatively, the download can be achieved by performing

```bash
git clone https://github.com/whosonfirst/whosonfirst-data.git
```

Once the data is downloaded, the expected layout is:

```bash
./wof_data/data/<the nested structure of .geojson files>
./wof_data/meta/<all the .csv meta files>
```


## Configuration

The sole Pelias configuration option available is `imports.whosonfirst.datapath`.  It should point to the root of where Who's On First data has been downloaded.
