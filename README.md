#Wikibase Query Service GUI

This repository contains the GUI for the [Wikidata Query Service](https://query.wikidata.org/).

Please see more details about the service in the [User Manual](https://www.mediawiki.org/wiki/Wikidata_query_service/User_Manual).


#Download

Clone git repo, go into created folder and then pull all dependencies via npm package manager.

```bash
$ git clone https://gerrit.wikimedia.org/r/wikidata/query/gui
$ cd gui
$ npm install
```
#Run tests

Run JSHint, JSCS and QUnit tests.

```bash
$ grunt test
```

#Build
Create a build with bundled and minified files.

```bash
$ grunt build
```