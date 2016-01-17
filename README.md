# api-doc
API documentation middleware for DADI API

## Installation

```
$ sudo npm install dadi-apidoc --save
```

make sure your system has ruby and ruby gem `awesome_print`
$ gem install awesome_print

## Add documentation configuration to the API

```
"documentation": {
  "enabled": true,
  "title": "Empire Online Content API",
  "markdown": false,
  "themeVariables": "default",
  "themeTemplate": "triple",
  "themeStyle": "default",
  "themeCondenseNav":	true,
  "themeFullWidth": false
}
```

## Add middleware

```js
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


## Documenting custom endpoints

```
/**
* Read in source files from file paths or glob patterns.
*
* @api public
*/
```
