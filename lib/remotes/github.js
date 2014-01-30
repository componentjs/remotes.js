var debug = require('debug')('remotes:github');

var Remote = require('../remote')

var GITHUB_USERNAME = process.env.GITHUB_USERNAME
var GITHUB_PASSWORD = process.env.GITHUB_PASSWORD

module.exports = GitHub

Remote.extend(GitHub)

function GitHub(options) {
  if (!(this instanceof GitHub))
    return new GitHub(options)

  options = options || {}

  // set the github API auth via environment
  // otherwise, use netrc or something.
  if (!options.auth && GITHUB_USERNAME && GITHUB_PASSWORD)
    options.auth = GITHUB_USERNAME + ':' + GITHUB_PASSWORD

  Remote.call(this, options)
}

GitHub.prototype.name = 'github'

/**
 * DOES NOT SOLVE REDIRECTS!
 *
 * @param {String} repo
 * @return {Array} references
 * @api public
 */

GitHub.prototype._versions = function* (repo) {
  var uri = 'https://api.github.com/repos/' + repo + '/tags'
  debug('GET "%s"', uri);
  var res = yield* this.request(uri, true)
  if (res.statusCode === 404) return
  if (res.statusCode === 403) return errorRateLimitExceeded(err);
  if (res.statusCode !== 200) {
    var err = new Error('failed to get ' + repo + '\'s tags')
    err.res = res
    err.remote = 'github'
    throw err
  }
  checkRateLimitRemaining(res);

  return res.body.map(name)
}

function name(x) {
  return x.name
}

/**
 * Get a component and references's component.json.
 *
 * @param {String} repo
 * @param {String} reference
 * @return {Object} component.json
 * @api public
 */

GitHub.prototype._json = function* (repo, ref) {
  var uri = 'https://raw.github.com/' + repo + '/' + ref + '/component.json'
  debug('GET "%s"', uri);
  var res = yield* this.request(uri, true)
  if (!res.body) return malformedJSON(uri, res);
  if (res.statusCode === 404) return
  if (res.statusCode !== 200) {
    var err = new Error('failed to get ' + repo + '\'s component.json')
    err.res = res
    err.remote = 'github'
    throw err
  }

  // to do: sha1sum check

  return res.body
}

/**
 * DOES NOT SOLVE REDIRECTS!
 *
 * @param {String} repo
 * @param {String} ref
 * @return {Array} objects
 * @api public
 */

GitHub.prototype._tree = function* (repo, ref) {
  var uri = 'https://api.github.com/repos/' + repo + '/git/trees/' + ref + '?recursive=1'
  debug('GET "%s"', uri);
  var res = yield* this.request(uri, true)
  if (!res.body) return malformedJSON(uri, res);
  if (res.statusCode === 404) return
  if (res.statusCode === 403) return errorRateLimitExceeded(err);
  if (res.statusCode !== 200) {
    var err = new Error('failed to get ' + repo + '\'s git tree')
    err.res = res
    err.remote = 'github'
    throw err
  }
  checkRateLimitRemaining(res);

  return res.body.tree.filter(isBlob);
}

/**
 * Only return blobs.
 *
 * @param {Object} node
 * @return {Boolean}
 * @api private
 */

function isBlob(x) {
  return x.type === 'blob';
}

/**
 * @param {String} repo
 * @param {String} reference
 * @param {Object} object
 * @param {String} filename
 * @return {String} filename
 * @api public
 */

GitHub.prototype._file = function* (repo, ref, obj, filename) {
  var uri = 'https://raw.github.com/' + repo + '/' + ref + '/' + obj.path
  debug('GET "%s"', uri);
  var res = yield* this.request(uri, filename)
  if (res.statusCode !== 200) {
    var err = new Error('failed to download ' + repo + '\'s file ' + obj.path)
    err.res = res
    err.remote = 'github'
    err.obj = obj
    err.filename = filename
    throw err
  }

  return filename
}

/**
 * Sometimes GitHub returns malformed JSON with 200.
 * I don't know why.
 *
 * @param {Object} response
 * @api private
 */

function malformedJSON(uri, res) {
  var err = new Error('github returned mailformed JSON at URL: ' + uri);
  err.res = res;
  err.text = res.text;
  err.remote = 'github';
  throw err;
}

/**
 * Better error message when rate limit exceeded.
 *
 * @param {Object} response
 * @api private
 */

function errorRateLimitExceeded(res) {
  var err = new Error('Github rate limit exceeded. Supply credentials via auth option. See https://github.com/component/remotes.js/blob/master/docs/github.md for more information.');
  err.res = res;
  err.remote = 'github';
  throw err;
}

/**
 * Warn when rate limit is low.
 *
 * @param {Object} response
 * @api private
 */

function checkRateLimitRemaining(res) {
  var remaining = parseInt(res.headers['x-ratelimit-remaining'], 10);
  if (remaining <= 50) {
    console.warn('github remote: only %d requests remaining.', remaining);
    console.warn('github remote: see https://github.com/component/remotes.js/blob/master/docs/github.md for more information.');
  }
}
