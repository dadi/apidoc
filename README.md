# api-doc

API documentation middleware for DADI API.

## Installation

```
$ npm install httpsnippet --global
$ npm install dadi-apidoc --save
```

make sure your system has ruby and ruby gem `awesome_print`.

```
$ gem install awesome_print
```

## Add documentation configuration to the API

```
"documentation": {
  "title": "<Project Name> Content API",
  "description": "This is the _Content API_ for [Example](http://www.example.com).",
  "markdown": false,
  "themeVariables": "default",
  "themeTemplate": "triple",
  "themeStyle": "default",
  "themeCondenseNav":	true,
  "themeFullWidth": false,
  "path": "/docs",
  "generateCodeSnippets": true
}
```

## Add middleware

```js
var server = require('dadi-api');
var config = require('dadi-api').Config;
var log = require('dadi-api').Log;

var apiDocs = require('dadi-apidoc');

server.start(function() {
  log.get().info('API Started');
});

// add documentation route
server.app.use('/api/:version/docs', function (req, res, next) {

  var options = {
    host: config.get('server.host'),
    feedback: config.get('feedback'),
    documentation: config.get('documentation')
  };

  apiDocs.init(app, options);

  apiDocs.run(function(result) {
    if (options.documentation && options.documentation.markdown) {
      res.setHeader('Content-Type', 'text/plain');
    }
    else {
      res.setHeader('Content-Type', 'text/html');
    }

    res.setHeader('Content-Length', Buffer.byteLength(result));
    res.statusCode = 200;
    res.end(result);
  });
});
```

## TODO

### Documenting custom endpoints

```
/**
* Read in source files from file paths or glob patterns.
*
* @api public
*/
```

## Licence

DADI is a data centric development and delivery stack, built specifically in support of the principles of API first and COPE.

Copyright notice<br />
(C) 2016 DADI+ Limited <support@dadi.tech><br />
All rights reserved

This product is part of DADI.<br />
DADI is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as
published by the Free Software Foundation; either version 2 of
the License, or (at your option) any later version ("the GPL").
**If you wish to use DADI outside the scope of the GPL, please
contact us at info@dadi.co for details of alternative licence
arrangements.**

**This product may be distributed alongside other components
available under different licences (which may not be GPL). See
those components themselves, or the documentation accompanying
them, to determine what licences are applicable.**

DADI is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

The GNU General Public License (GPL) is available at
http://www.gnu.org/copyleft/gpl.html.<br />
A copy can be found in the file GPL distributed with
these files.

This copyright notice MUST APPEAR in all copies of the product!
