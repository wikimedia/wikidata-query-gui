#Wikibase Query Service GUI

This repository contains the GUI for the [Wikidata Query Service](https://query.wikidata.org/).

Please see more details about the service in the [User Manual](https://www.mediawiki.org/wiki/Wikidata_query_service/User_Manual).


#Download & setup

Clone git repo, go into created folder and then pull all dependencies via npm package manager.

```bash
$ git clone https://gerrit.wikimedia.org/r/wikidata/query/gui
$ cd gui
$ npm install
```

Alternative use npm install

```bash
npm i wikidata-query-gui
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


#Deploy
Creates a build and pushes it to the deployment branch via git review

```bash
$ grunt deploy
```


Please make sure you have defined a gitreview username:
```bash
git config --global --add gitreview.username "[username]"
```


#Components
## Editor
This is a code mirror based SPARQL editor with code completion (ctrl+space)
```
var editor = new wikibase.queryService.ui.editor.Editor();
editor.fromTextArea( $( '.editor' )[0] );
```
See examples/editor.html
