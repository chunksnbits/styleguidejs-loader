
function StyleguidejsCache () {
  this._cache = {};
}

StyleguidejsCache.prototype.delete = function (key) {
  delete this._cache[key];
},

StyleguidejsCache.prototype.cachedValue = function (key, data) {
  if (arguments.length === 0) {
    return this._cache;
  }

  if (arguments.length === 1) {
    return this._cache[key];
  }

  this._cache[key] = data;

  return this._cache[key];
};

module.exports = StyleguidejsCache;
