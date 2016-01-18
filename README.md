# api-doc
API documentation middleware for DADI API

## Installation

```
$ npm install httpsnippet --global
$ npm install dadi-apidoc --save
```

make sure your system has ruby and ruby gem `awesome_print`
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
