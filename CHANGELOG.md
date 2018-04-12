# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.5.2] (2018-04-12)

### Changed
* [#12](https://github.com/dadi/apidoc/issues/12): add datetime field type to the API blueprint output, to fix errors when attempting to render documentation for collection schemas with fields of type "DateTime".



## [1.5.0] (2017-03-30)

### Changed
* [#2](https://github.com/dadi/apidoc/issues/2): replace the protagonist API Blueprint parser with Drafter. Protagonist installation fails on some systems (requires Python 2 and an uptodate compiler). Drafter uses Protagonist if it can be installed, else falls back to a slower JS implementation of the parser.

