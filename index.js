'use strict';

var StyleguidejsDeferredLoader = require('./lib/styleguidejs-deferred-loader.js');

var instance = new StyleguidejsDeferredLoader();

function StyleguidejsLoader (contents) {
  return instance.applyLoader.call(instance, contents, this);
}

StyleguidejsLoader.emitDeferred = instance.emitDeferred.bind(instance);
StyleguidejsLoader.options = instance.options.bind(instance);

module.exports = StyleguidejsLoader;
