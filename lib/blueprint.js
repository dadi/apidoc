var _ = require('underscore')
var faker = require('faker')
var inflection = require('inflection')
var s = require('underscore.string')

// underscore templating, using Mustache syntax
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
}

var endpointMethodTemplate = '## {{ modelName }} [{{ path }}]\n\n'
endpointMethodTemplate += '{{ docs.description }}\n\n'

var resourceTemplate = '## {{ modelName }} Resource [/{{apiVersion}}/{{database}}/{{ urlName }}/{id}]\n'

var singleResourceMethodTemplate = '### {{ action }} a single {{ modelName }} [{{ method }}]\n'
singleResourceMethodTemplate += '{{ actionResponse }} a single {{ modelName }} matching the specified ID, or returns HTTP 404 if no matching {{ pluralizedName }} were found.\n\n'

var fieldTemplate = ' // {{ type }}{{ required }}'

var modelSchemaFieldTemplate = '>>>"{{ key }}": " {{ example }}"{{ delimiter }} {{ detail }} \n'

var dataStructureFieldTemplate = '  - `{{ key }}`: {{ example }}({{ detail }}) - {{ comment }}.\n'
var dataStructureFieldSettingsTemplate = '{{ type }}{{ required }}'

var modelGroupTemplate = '# Group {{ modelName }}\n {{ description }}\n\n'
var collectionTemplate = '## {{ modelName }} Collection [/{{apiVersion}}/{{database}}/{{ urlName }}/{?filter,fields,count,sort}]\n\n'

var collectionListTemplate = '### GET\n\n'
collectionListTemplate += 'Returns an array of {{ pluralizedName }}.\n\n'

collectionListTemplate += '::: note\n'
collectionListTemplate += 'For more information regarding parameters, please see the following:\n'
collectionListTemplate += '- [fields](https://docs.mongodb.org/manual/tutorial/project-fields-from-query-results/)\n'
collectionListTemplate += '- [sort](https://docs.mongodb.org/manual/reference/method/cursor.sort/#cursor.sort/)\n'
collectionListTemplate += ':::\n\n'

collectionListTemplate += '+ Parameters\n'
collectionListTemplate += '    + filter: `{"name":"string to search for"}` (object, optional) - Specify a query to refine the results.\n'
collectionListTemplate += '    + fields: `{"name":1}` (object, optional) - Specify the fields to return.\n'
collectionListTemplate += '    + count: `20` (number, optional) - Limit the number of results returned.\n'
collectionListTemplate += '    + sort: `{"created_at":-1}` (object, optional) - Specify field(s) and direction to sort results by.\n\n'

collectionListTemplate += '+ Response 200\n'
collectionListTemplate += '     + Attributes\n'
collectionListTemplate += '         - results (array[{{modelName}}FullResult])\n'
collectionListTemplate += '         - metadata (MetaData)\n\n'

var fourohfourTemplate = '+ Response 404\n'
fourohfourTemplate += '    Returned if no {{ pluralizedName }} matched the supplied ID.\n\n'
fourohfourTemplate += '    + Headers\n'
fourohfourTemplate += '        Content-Length: 0\n\n'

var templates = []

templates.field = _.template(fieldTemplate)
templates.collectionList = _.template(collectionListTemplate)
templates.modelSchemaField = _.template(modelSchemaFieldTemplate)
// templates.modelResource        = _.template(modelResourceTemplate)
templates.singleResourceMethod = _.template(singleResourceMethodTemplate)
templates.resource = _.template(resourceTemplate)
templates.collection = _.template(collectionTemplate)
templates.modelGroup = _.template(modelGroupTemplate)
templates.fourohfour = _.template(fourohfourTemplate)
templates.endpointMethod = _.template(endpointMethodTemplate)
templates.dataStructureField = _.template(dataStructureFieldTemplate)
templates.dataStructureFieldSettings = _.template(dataStructureFieldSettingsTemplate)

var Blueprint = function (options) {
  this.apiVersion = options.apiVersion
  this.path = options.path

  if (options.showResponseForDeleteRequest) this.showResponseForDeleteRequest = true

  if (options.model) {
    // this.model = Model(model.name)
    this.model = options.model
    this.database = options.database

    if (this.model.settings.hasOwnProperty('displayName')) {
      this.modelName = this.model.settings.displayName
    } else {
      // set the model name, singularizing it if the collection was provided as pluralized
      this.modelName = inflection.inflect(this.model.name.charAt(0).toUpperCase() + this.model.name.substring(1), 1)
    }

    this.pluralizedName = inflection.inflect(this.modelName, 2)
  } else if (options.route) {
    this.route = options.route
    this.routeConfig = this.route.config ? this.route.config() : {}
    this.modelName = this.path
    this.docs = options.docs

    // console.log(options)
    // console.log(this.docs)

    /*
    [ { subheads: [],
        description: 'Adds two numbers together.',
        param:
         [ '{int} num1 The first number.',
           '{int} num2 The second number.' ],
        returns: [ [Object] ],
        params: [ [Object], [Object] ],
        comment:
         { begin: 1,
           end: 6,
           code: 'var message = {message: \'endpoint created through the API\'};',
           content: 'Adds two numbers together.\n@param {int} num1 The first number.\n@param {int} num2 The second number.\n@returns {int} The sum of the two numbers.\n',
           codeStart: 8 },
        context:
         { begin: 8,
           type: 'declaration',
           name: 'message',
           value: '{message: \'endpoint created through the API\'}',
           string: 'message',
           original: 'var message = {message: \'endpoint created through the API\'};' },
        heading: { level: 2, text: 'message' },
        lead: '',
        name: 'message',
        examples: [] } ]
    */

    if (this.route.docs) {
      console.log(this.route.docs)
    }

  // if (this.route.config) {
  //   var config = this.route.config()
  //   if (config.route) {
  //     this.path = config.route
  //   }
  // }
  }
}

Blueprint.prototype.name = function (returnRealName) {
  if (this.route) {
    if (this.routeConfig && this.routeConfig.displayName) {
      return this.routeConfig.displayName
    } else {
      return this.modelName
    }
  }

  var modelName

  if (this.model) {
    if (returnRealName) return this.model.name
    if (this.model.settings.hasOwnProperty('displayName')) {
      modelName = this.model.settings.displayName
    } else {
      modelName = this.model.name
    }
  }

  return s.titleize(modelName)
}

Blueprint.prototype.singularName = function () {
  return inflection.singularize(this.name())
}

Blueprint.prototype.pluralName = function () {
  return inflection.pluralize(this.name())
}

Blueprint.prototype.description = function () {
  if (this.route && this.routeConfig) {
    if (this.routeConfig.description) {
      return this.routeConfig.description + '\n\n'
    }
  } else if (this.model && this.model.settings.description) {
    return this.model.settings.description + '\n\n'
  } else {
    return '\n'
  }
}

Blueprint.prototype.fieldsForCreate = function (schema) {
  var md = ''
  var fields = {}
  _.each(schema, function (field, key) {
    if (!field.hasOwnProperty('private') || (field.hasOwnProperty('private') && field.private !== true)) {
      fields[key] = field
    }
  })

  fields = sortFields(fields)

  var idx = 0
  // var len = Object.keys(fields).length

  _.each(fields, (value, key) => {
    idx++
    md += templates.dataStructureField({ key: key, example: this.exampleOrEmpty(value), detail: processDataStructureField(value), comment: value.comment || 'x' })
  })

  return md
}

Blueprint.prototype.indent = function (str) {
  var re = new RegExp('^', 'gmi')
  var result = str.replace(re, '    ')
  return result
}

Blueprint.prototype.exampleOrEmpty = function (value) {
  var example = ''
  if (value.example) {
    example = '`' + value.example + '` '
  } else if (value.testDataFormat) {
    example = '`' + faker.fake(value.testDataFormat) + '` '
  }

  return example
}

Blueprint.prototype.errorFields = function (schema, indent) {
  var md = ''
  var fields = {}
  _.each(schema, function (field, key) {
    if (!field.hasOwnProperty('private') || (field.hasOwnProperty('private') && field.private !== true)) {
      fields[key] = field
    }
  })

  fields = sortFields(fields)

  var idx = 0
  // var len = Object.keys(fields).length

  _.each(fields, function (value, key) {
    idx++
    md += (indent ? '    ' : '') + templates.dataStructureField({ key: key, example: this.exampleOrEmpty(value), detail: processDataStructureField(value), comment: value.comment })
  })

  return md
}

Blueprint.prototype.types = function () {
  var md = ''
  md += '## datetime\n\n'
  md += '## mixed (object)\n\n'
  md += '## objectid\n\n'
  md += '## reference\n\n'
  md += '\n\n'
  return md
}

Blueprint.prototype.dataStructure = function () {
  var md = ''
  md += '## ' + this.singularName() + 'Create (object)\n\n'

  if (this.model.schema) {
    this.fields = this.fieldsForCreate(this.model.schema)
    md += this.fields
  }

  md += '\n'

  md += '## ' + this.singularName() + 'Full (object)\n\n'
  md += templates.dataStructureField({ key: '`_id`', example: '`5693a278d5e74efe1342df56` ', detail: 'string', comment: 'The auto-assigned identifier of the document' })
  md += '  - Include ' + this.singularName() + 'Create\n'
  md += templates.dataStructureField({ key: '`apiVersion`', example: '`1.0` ', detail: 'string', comment: 'The version of the API the document was created in' })
  md += templates.dataStructureField({ key: '`createdAt`', example: '`1452807831135` ', detail: 'number', comment: 'A timestamp representing the date and time the document was created' })
  md += templates.dataStructureField({ key: '`createdBy`', example: '`apiClient_10398` ', detail: 'string', comment: 'The clientId of the user who created the document' })

  md += '\n'
  md += '## ' + this.singularName() + 'FullResult (object)\n\n'
  md += '  - Include ' + this.singularName() + 'Full\n\n'
  //

  // - status (enum[string])
  //   - pending - They haven't finished their public profile or whatever.
  //   - active - Good as gold.
  //   - closed - This place doesn't exist.

  // Errors
  md += '## ' + this.singularName() + 'ErrorResult (object)\n\n'
  _.each(this.model.schema, function (value, key, list) {
    if (value.required) {
      md += '  - field: `' + key + '`\n'
      md += '  - message: `' + (value.message === '' ? "can't be blank" : value.message) + '`\n'
    }
  })

  md += '\n'
  return md
}

Blueprint.prototype.endpointGroup = function () {
  var md = ''
  md += '# Group Endpoints\nCustom Endpoints\n\n'
  return md
}

Blueprint.prototype.groupName = function () {
  var md = ''
  md += templates.modelGroup({modelName: this.name(), description: this.description(), path: replaceIdParam(this.path)})
  return md
}

Blueprint.prototype.endpointMethod = function () {
  var docs = this.docs[0] || { lead: '' }
  var md = ''
  md += templates.endpointMethod({modelName: docs.lead || this.name(), docs: docs, path: this.path})

  // console.log(docs)

  if (docs.params && docs.params.length > 0) {
    md += '  + Parameters\n'
    _.each(docs.params, function (param) {
      md += '    + ' + param.name + ' (' + param.type + ') - ' + param.description + '\n'
    })
  }

  md += '\n'

  md += '### GET\n\n'
  md += '+ Request\n\n'

  md += '+ Response 200\n'
  md += '\n\n'
  // md += "  [" + this.name() + "][]\n\n"

  return md
}

Blueprint.prototype.resource = function () {
  var md = ''
  md += templates.resource({apiVersion: this.apiVersion, database: this.database, modelName: this.singularName(), urlName: this.name(true)})
  return md
}

Blueprint.prototype.get = function () {
  var md = '\n'

  md += '+ Parameters\n'
  md += '  + id: `5693a278d5e74efe1342df56` - The unique ID of the ' + this.singularName() + '.\n\n'

  md += '### GET\n\n'

  md += '+ Request (application/json)\n'
  md += '    + Headers\n\n'
  md += '        Authorization: Bearer 4172bbf1-0890-41c7-b0db-477095a288b6\n'
  md += '\n'

  md += '+ Response 200 (application/json)\n'
  md += '    + Attributes\n'
  md += '        - results (array[' + this.singularName() + 'Full])\n'
  md += '        - metadata (MetaData)\n\n'

  md += this.unauthorised()
  md += '\n\n'

  md += templates.fourohfour({pluralizedName: this.pluralName()})
  md += '\n'

  return md
}

Blueprint.prototype.update = function () {
  var md = ''

  md += '### PUT\n\n'

  md += '+ Request (application/json)\n'
  md += '    + Headers\n\n'
  md += '        Authorization: Bearer 4172bbf1-0890-41c7-b0db-477095a288b6\n'
  md += '\n'
  md += '    + Attributes\n'
  if (this.model.schema) {
    md += this.indent(this.fields)
  }

  md += '\n'

  md += '+ Response 200 (application/json)\n'
  md += '    + Attributes\n'
  md += '        - results (array[' + this.singularName() + 'Full])\n\n'

  md += this.unauthorised()
  md += '\n\n'

  md += templates.fourohfour({pluralizedName: this.pluralName()})

  md += '\n'

  return md
}

Blueprint.prototype.delete = function () {
  var md = ''

  md += '### DELETE\n\n'

  if (this.showResponseForDeleteRequest) {
    md += '+ Response 200\n'
    md += '    + Attributes\n'
    md += '        - status: success\n'
    md += '        - message: Document deleted successfully\n'
  } else {
    md += '+ Response 204\n'
  }

  // md += "Returned if a " + this.modelName + " matched the supplied ID and was deleted successfully."
  md += '\n\n'

  md += this.unauthorised()

  md += '\n\n'

  md += templates.fourohfour({pluralizedName: this.pluralName()})

  md += '\n'

  return md
}

Blueprint.prototype.post = function () {
  var md = ''

  // md += "### POST [/" + this.name(true) + "]\n\n"
  md += '### POST\n\n'

  md += '+ Request (application/json)\n'
  md += '    + Headers\n\n'
  md += '        Authorization: Bearer 4172bbf1-0890-41c7-b0db-477095a288b6\n'
  md += '\n'
  md += '    + Attributes\n'
  if (this.model.schema) {
    md += this.indent(this.fields)
  }

  md += '\n'

  md += '+ Response 200 (application/json)\n'
  md += '    + Attributes\n'
  md += '        - results (array[' + this.singularName() + 'FullResult])\n\n'

  // md += "### Create a new " + this.modelName + " [POST]\n\n"
  // md += "Creates a new " + this.modelName + " document in the database.\n\n"
  //
  // md += "The following fields are automatically added to new " + this.modelName + " documents:" + "\n\n"
  // md += "- _id" + "\n"
  // md += "- apiVersion" + "\n"
  // md += "- createdAt" + "\n"
  // md += "- createdBy" + "\n"
  // md += "\n"

  md += '+ Response 400 (application/json)\n\n'
  md += '    If the data fails validation, an HTTP 400 response is returned with an errors collection containing the fields that failed validation.\n\n'
  md += '    + Attributes\n'
  md += '        - success: false\n'
  md += '        - errors (array[' + this.singularName() + 'ErrorResult])\n\n'

  md += this.unauthorised()

  // var one = this.name().indexOf('_') > 0 ? this.name().toLowerCase() : s.slugify(this.name())
  // var two = this.name().indexOf('_') > 0 ? this.name().toLowerCase() : s.slugify(this.name())
  // var modelMethod = one + '-' + two + '-collection-post.html'
  // var embed = '<!-- include(/docs/embeds/' + modelMethod + ') -->\n\n'
  // md += embed

  return md
}

Blueprint.prototype.unauthorised = function () {
  var md = ''
  md += '+ Response 401\n\n'
  md += '    Returned in response to a missing Authorization header, or an invalid or expired token.\n\n'
  md += '    + Headers\n'
  md += '        WWW-Authenticate: Bearer realm="example"\n\n'
  return md
}

Blueprint.prototype.collection = function () {
  if (!this.modelName) return ''
  return templates.collection({ apiVersion: this.apiVersion, database: this.database, modelName: this.name(), pluralizedName: this.pluralName(), urlName: this.name(true) })
}

Blueprint.prototype.collectionList = function () {
  var md = ''
  md += templates.collectionList({ modelName: this.singularName(), pluralizedName: this.pluralName(), lowerCaseName: this.modelName.toLowerCase(), titleizedName: s.titleize(this.modelName) })
  md += this.unauthorised()
  md += '\n\n'
  return md
}

// route id component
var idParam = ':id([a-fA-F0-9]{24})?'

function replaceIdParam (path) {
  return path.replace(idParam, '{id}')
}

// function removeIdParam (path) {
//   return path.replace(idParam, '')
// }

// function processField (value) {
//   return templates['field']({ type: value.type, required: (value.required ? ', required' : '') })
// }

function processDataStructureField (value) {
  return templates.dataStructureFieldSettings({ type: value.type.toLowerCase(), required: (value.required ? ', required' : '') })
}

function sortFields (obj) {
  var sortedObj = {}
  var keys = _.keys(obj)

  keys = _.sortBy(keys, function (key) {
    return key
  })

  _.each(keys, function (key) {
    sortedObj[key] = obj[key]
  })

  return sortedObj
}

// function renderRequestFields (model) {
//   var md = ''
//   md += '+ Request\n\n'
//
//   if (model.schema) {
//     var publicFields = {}
//     var requiredFields = {}
//     var optionalFields = {}
//
//     _.each(model.schema, function (field, key) {
//       if (field.display && field.display.hasOwnProperty('index') && field.display.index === true) {
//         publicFields[key] = field
//       }
//     })
//
//     _.each(publicFields, function (field, key) {
//       if (field.required) {
//         requiredFields[key] = field
//       } else {
//         optionalFields[key] = field
//       }
//     })
//
//     requiredFields = sortFields(requiredFields)
//     optionalFields = sortFields(optionalFields)
//
//     var idx = 0
//     var len = Object.keys(publicFields).length
//
//     md += '>>' + '{\n'
//
//     _.each(requiredFields, function (value, key) {
//       idx++
//       md += templates['modelSchemaField']({ key: key, example: value.example, detail: processField(value), delimiter: (idx < len ? ',' : '') })
//     })
//
//     _.each(optionalFields, function (value, key) {
//       idx++
//       md += templates['modelSchemaField']({ key: key, example: value.example, detail: processField(value), delimiter: (idx < len ? ',' : '') })
//     })
//
//     md += '>>' + '}\n\n'
//   }
//
//   return md
// }

// exports
module.exports = function (model, path, route, docs) {
  if (model) return new Blueprint(model, path, null, null)
  if (route) return new Blueprint(null, path, route, docs)
}

module.exports.Blueprint = Blueprint
module.exports.metadata = function () {
  var md = ''
  md += '## MetaData (object)\n\n'

  md += '  - limit: 20 (number)\n'
  md += '  - page: 1 (number)\n'
  md += '  - offset: 0 (number)\n'
  md += '  - totalCount: 250 (number)\n'
  md += '  - totalPages: 13 (number)\n'
  md += '  - nextPage: 2 (number)\n\n'

  return md
}
