var _ = require('underscore')
var aglio = require('aglio')
var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var drafter = require('drafter')

var Blueprint = require(path.join(__dirname, '/blueprint'))
var metadata = require(path.join(__dirname, '/blueprint')).metadata
var apiBlueprintFilename = 'apiBlueprint.md'
var apiBlueprintSchemaFilename = 'apiBlueprint.json'

module.exports = function () {}

module.exports.init = function (server, config) {
  this.server = server
  this.app = server.app

  // add documentation route
  // the :version parameter allows this route to
  // respond to URLs such as /api/1.0/docs and /api/v2/docs
  this.app.use('/api/:version/docs', (req, res, next) => {
    // get options from the config file
    var options = {
      host: config.get('server.host'),
      feedback: config.get('feedback'),
      documentation: config.get('apidoc')
    }

    this.prepare(options)

    this.run((result) => {
      if (options.documentation && options.documentation.markdown) {
        res.setHeader('Content-Type', 'text/plain')
      } else {
        res.setHeader('Content-Type', 'text/html')
      }

      res.setHeader('Content-Length', Buffer.byteLength(result))
      res.statusCode = 200
      res.end(result)
    })
  })
}

module.exports.prepare = function (options) {
  this.options = {
    themeVariables: 'default', // e.g. slate
    themeTemplate: 'default', // e.g. triple
    themeStyle: 'default',
    themeCondenseNav: true,
    themeFullWidth: false
  }

  if (options) {
    _.extend(this.options, options)
  }

  if (options.documentation) {
    _.extend(this.options, options.documentation)
  }
}

module.exports.run = function (callback) {
  var introText = ''

  if (this.options.templatePath) {
    try {
      introText = fs.readFileSync(path.resolve(this.options.templatePath + '/intro.md'))
    } catch (err) {
      console.log(err)
    }
  }

  if (introText === '') {
    introText = fs.readFileSync(path.join(__dirname, '/../templates/intro.md'))
  }

  var doc = ''
  doc += 'FORMAT: 1A\n'

  doc += 'HOST: http://' + this.options.host + '\n\n'

  if (this.options.title) doc += '# ' + this.options.title + '\n'
  if (this.options.description) doc += this.options.description + '\n\n'

  doc += introText + '\n\n'

  var endpoints = []
  var dataStructures = '# Data Structures\n\n'
  var blueprint

  _.each(this.server.components, (route, path, list) => {
    if (!route.model && this.server.docs) {
      var docs = this.server.docs[path]
      blueprint = new Blueprint({model: null, path: path, route: route, docs: docs})
      endpoints.push(blueprint)
    } else if (route.model && route.model.name) {
      if (route.model.settings.hasOwnProperty('private') && route.model.settings.private === true) {
        // ignore
      } else {
        var bluePrintOptions = {
          apiVersion: '1.0',
          model: route.model,
          // database: route.model.connection.connectionOptions.database,
          database: path.split('/')[2],
          path: path,
          route: null
        }

        if (this.options.feedback) {
          bluePrintOptions.showResponseForDeleteRequest = true
        }

        blueprint = new Blueprint(bluePrintOptions)

        dataStructures += blueprint.dataStructure()

        // Main Model Heading
        doc += blueprint.groupName()

        doc += blueprint.collection()
        doc += blueprint.collectionList()
        doc += blueprint.post()

        // single resource requests
        doc += blueprint.resource()

        doc += blueprint.get()
        doc += blueprint.update()
        doc += blueprint.delete()
      }
    }
  })

  // output endpoints
  doc += blueprint.endpointGroup()

  _.each(endpoints, (endpointBlueprint) => {
    doc += endpointBlueprint.endpointMethod()
  })

  doc += '\n\n' + dataStructures
  doc += '\n\n' + blueprint.types()
  doc += '\n\n' + metadata()

  var self = this
  var apiBlueprintfilePath = path.resolve(self.options.documentation.path + '/' + apiBlueprintFilename)
  var schemaFilePath = path.resolve(self.options.documentation.path + '/' + apiBlueprintSchemaFilename)

  // if doc path is set, save the raw markdown
  if (this.options.documentation && this.options.documentation.path) {
    mkdirp(path.resolve(self.options.documentation.path), {}, (err, made) => {
      if (err) console.log(err)

      fs.writeFile(apiBlueprintfilePath, doc, (err) => {
        if (err) console.log(err)

        // generate code snippets
        if (self.options.documentation.generateCodeSnippets) {
          var parseOptions = { generateSourceMap: false, type: 'ast' }
          drafter.parse(doc, parseOptions, (err, result) => {
            if (err) {
              console.log(err)
              return callback(JSON.stringify(err))
            }

            fs.writeFile(schemaFilePath, JSON.stringify(result, null, 2), (err) => {
              if (err) console.log(err)

              // execute ruby script
              // var sys = require('sys')
              var exec = require('child_process').exec
              function puts (error, stdout, stderr) { if (error) console.log(error); console.log(stderr) }
              var scriptPath = path.resolve(path.join(__dirname, '/../scripts/apib2httpsnippets.rb'))
              exec('ruby ' + scriptPath + ' ' + schemaFilePath + ' ' + self.options.host, puts)
            })
          })
        }
      })
    })
  }

  if (this.options.documentation && this.options.documentation.markdown) {
    callback(doc)
  } else {
    // output the rendered html blueprint
    aglio.render(doc, this.options, (err, html, warnings) => {
      if (err) {
        console.log(err)
        callback(JSON.stringify(err))
      } else {
        // if (warnings) console.log(warnings)

        // replace "generated by" text
        html = html.replace('<a href="https://github.com/danielgtaylor/aglio" class="aglio">aglio</a>', '<a href="https://github.com/dadi/apidoc" class="aglio">DADI API Doc</a>')
        callback(html)
      }
    })
  }
}
