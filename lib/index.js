var aglio = require('aglio');
var fs = require('fs');
var _ = require('underscore');

var Blueprint = require(__dirname + '/blueprint');
var metadata = require(__dirname + '/blueprint').metadata;

module.exports = function() {

}

module.exports.init = function(app, options) {
  this.app = app;

  this.options = {
    themeVariables: "default",  // e.g. slate
    themeTemplate: "default",  // e.g. triple
    themeStyle: "default",
    themeCondenseNav:	true,
    themeFullWidth: false
  };

  if (options) {
    _.extend(this.options, options);
  }

  if (options.documentation) {
    _.extend(this.options, options.documentation);
  }
}

module.exports.run = function(callback) {

  //var introText = fs.readFileSync(__dirname + '/intro.md');

  var doc = "";
  doc += "FORMAT: 1A\n";

  doc += "HOST: http://" + this.options.host + "\n\n";

  if (this.options.title) doc += "# " + this.options.title + "\n";
  if (this.options.description) doc += this.options.description + "\n\n";

  //doc += introText + "\n\n";

  var dataStructures = "# Data Structures\n\n";
  var blueprint;

  _.each(this.app.components, function(route, path, list) {
    if (!route.model) {
      // blueprint = new Blueprint({model:null, path:path, route:route});
      // // Main Model Heading
      // doc += blueprint.groupName();
      // doc += blueprint.endpointMethod();
    }
    else if (route.model && route.model.name) {

      if (route.model.settings.hasOwnProperty('private') && route.model.settings.private === true) {

      }
      else {

        var bluePrintOptions = {
          apiVersion: '1.0',
          model: route.model,
          database: route.model.connection.connectionOptions.database,
          path: path,
          route: null
        };

        if (this.options.feedback) {
          bluePrintOptions.showResponseForDeleteRequest = true;
        }

        blueprint = new Blueprint(bluePrintOptions);

        dataStructures += blueprint.dataStructure();

        // Main Model Heading
        doc += blueprint.groupName();

        doc += blueprint.collection();
        doc += blueprint.collectionList();
        doc += blueprint.post();

        // single resource requests
        doc += blueprint.resource();

        doc += blueprint.get();
        doc += blueprint.update();
        doc += blueprint.delete();
      }
    }
  }, this);

  doc += '\n\n' + dataStructures;
  doc += '\n\n' + blueprint.types();
  doc += '\n\n' + metadata();

  if (this.options.documentation && this.options.documentation.markdown) {

    // var protagonist = require('protagonist');
    // var protagonistOptions = {
    //   generateSourceMap: false,
    //   type: 'ast'
    // };
    // var result = protagonist.parse(doc, protagonistOptions, function(err, result) {
    //   if (err) {
    //     //console.log(err);
    //     return callback(JSON.stringify(err));
    //     //return;
    //   }
    //   return callback(JSON.stringify(result));
    //   //console.log(result);
    // });


    callback(doc);

  }
  else {
    // output the rendered html blueprint
    aglio.render(doc, this.options, function (err, html, warnings) {
      if (err) {
        console.log(err);
        callback(JSON.stringify(err));
      }
      else {
        //if (warnings) console.log(warnings);

        callback(html);
      }
    });
  }
}
