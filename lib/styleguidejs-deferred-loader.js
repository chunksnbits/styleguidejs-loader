'use strict';

var postcss = require('postcss');
var _ = require('lodash');

var Cache = require('./styleguidejs-cache');

  // Set up helpers
var renderer = require('./styleguidejs-renderer');

function StyleguidejsDeferredLoader () {
  console.log('---------- StyleguidejsDeferredLoader: initialize ---------');

  // Create a new cache instance.
  this.documentCache = new Cache();
}

StyleguidejsDeferredLoader.prototype.applyLoader = function (content, loader) {
  console.log('---------- StyleguidejsDeferredLoader: process ---------');

  var self = this;
  var nodes = postcss.parse(content).nodes;

  var comments = this.filterCommentsSource(nodes);
  var docs = renderer.extractDocs(comments.join(''));

  comments.forEach(function (source, index) {
    var cachedValue = self.documentCache.cachedValue(source) || {
      isNew: true,
      data: docs[index],
      source: source,
      contexts: [loader.context]
    };

    cachedValue.isChanged = cachedValue.isNew || cachedValue.source !== source;

    if (cachedValue.contexts.indexOf(loader.context) === -1) {
      cachedValue.isChanged = true;
      cachedValue.contexts.push(loader.context);
    }

    self.documentCache.cachedValue(source, cachedValue);
  });

  _.forEach(this.documentCache.cachedValue(), function (cached) {
    if (cached.contexts.indexOf(loader.context) > -1) {
      cached.isDeleted = !_.find(comments, function (source) {
        return source === cached.source;
      });

      cached.isChanged = cached.isChanged || cached.isDeleted;
    }
  });

  return content;
};

StyleguidejsDeferredLoader.prototype.options = function (options) {
  if (!!options) {
    console.log('---------- StyleguidejsDeferredLoader: options ---------');
    this._options = options;
  }
  return this._options || {};
};

StyleguidejsDeferredLoader.prototype.emitDeferred = function (compiler, settings, done) {
  console.log('---------- StyleguidejsDeferredLoader: emit ---------');

  var docs = _.values(this.documentCache.cachedValue());

  var updatedValues = docs.filter(function (doc) {
    return doc.isChanged;
  });

  // No changes to styleguide: no updated necessary
  if (updatedValues.length === 0) {
    return done();
  }

  var self = this;
  var source = this.extractSource(docs);

  // Styleguide changed: rerender
  return renderer.render(source, settings.options)
    .then(function ($) {
      var html = $.html();

      compiler.assets[settings.dest] = {
        source: function () { return html; },
        size: function () { return html.length; }
      };
    })
    .then(function () {
      docs.forEach(function (doc) {
        doc.isChanged = false;
        doc.isNew = false;
      });

      var deleted = docs.filter(function (doc) {
        return doc.isDeleted;
      });

      deleted.forEach(function (doc) {
        self.documentCache.delete(doc.source);
      });
    })
    .then(function () {
      done();
    })
    .catch(function (error) {
      done(error);
    });
};

StyleguidejsDeferredLoader.prototype.filterCommentsSource = function (nodes) {
  var self = this;

  return nodes.filter(function (node) {
      return node.type === 'comment' && node.text.indexOf('**') === 0;
    })
    .map(function (node) {
      return self.extractSource(node);
    });
};

StyleguidejsDeferredLoader.prototype.extractSource = function (elements) {
  function extract (element) {
    return typeof element.source === 'string' ? element.source : '/*' + (element.text || element) + '*/';
  }

  if (!Array.isArray(elements)) {
    return extract(elements);
  }

  return elements.map(function (element) {
    return extract(element);
  }).join('');
};


module.exports = StyleguidejsDeferredLoader;



//
// Scenarios:
// --------------------
// 1. Initial
// 2. Node(s) changed
// 3. Node(s) new
// 4. Node(s) deleted
// 5. Scaffold changed
//
// function update() {
//   .then(function ($scaffold) {
//     var cached = cachedValue();
//
//     var docs = Object.keys(cached).map(function (key) {
//       return cached[key];
//     });
//
//     var updatedValues = docs.filter(function (doc) {
//       return doc.isChanged;
//     });
//
//     // No changes to styleguide: no updated necessary
//     if (updatedValues.length === 0) {
//       return $scaffold;
//     }
//
//     // Initial render: return initial scaffold
//     if (updatedValues.length === docs.length) {
//       return $scaffold;
//     }
//     // Update data
//     else {
//       return render(extractSource(updatedValues), settings.options)
//         .then(function ($template) {
//           updatedValues.forEach(function (value) {
//             if (!value.id) {
//               throw new Error('no-id-specified');
//             }
//             var $existing = $scaffold('[data-id=' + value.id + ']')
//             if ()
//           });
//         });
//     }
//   })
//   .catch(function (error) {
//     if (error && error.reason === 'no-id-specified') {
//       var source = extractSource(Object.keys(cachedValue()));
//       return render(source, settings.options);
//     }
//
//     return q.reject(error);
//   })
// }
