# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.5.0] (2017-03-30)

### Changed
* [#2](https://github.com/dadi/apidoc/issues/2): replace the protagonist API Blueprint parser with Drafter. Protagonist installation fails on some systems (requires Python 2 and an uptodate compiler). Drafter uses Protagonist if it can be installed, else falls back to a slower JS implementation of the parser.

