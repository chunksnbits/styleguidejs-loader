'use strict';

var Styleguidjs = require('styleguidejs');
var cheerio = require('cheerio');
var q = require('bluebird');

var StyleguidejsRenderer = {
  extractDocs: function (source) {
    var renderer = new Styleguidjs();
    renderer.addSource(source);
    return renderer.parseSource();
  },

  render: function (source, options) {

    var deferred = q.defer();
    var renderer = new Styleguidjs();

    renderer.addSource(source);

    renderer.render(options, function (error, template) {
      if (!!error) {
        return deferred.reject(error);
      }

      return deferred.resolve(cheerio.load(template));
    });

    return deferred.promise;
  }
};

module.exports = StyleguidejsRenderer;
