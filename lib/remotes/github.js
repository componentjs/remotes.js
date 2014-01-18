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

GitHub.prototype._getVersions = function* (repo) {
  var uri = 'https://api.github.com/repos/' + repo + '/tags'
  var res = yield* this.request(uri, true)
  if (res.statusCode === 404) return
  if (res.statusCode !== 200) {
    var err = new Error('failed to get ' + repo + '\'s tags')
    err.res = res
    err.remote = 'github'
    throw err
  }

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

GitHub.prototype._getJSON = function* (repo, ref) {
  var uri = 'https://raw.github.com/' + repo + '/' + ref + '/component.json'
  var res = yield* this.request(uri, true)
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

GitHub.prototype._getTree = function* (repo, ref) {
  var uri = 'https://api.github.com/repos/' + repo + '/git/trees/' + ref + '?recursive=1'
  var res = yield* this.request(uri, true)
  if (res.statusCode === 404) return
  if (res.statusCode !== 200) {
    var err = new Error('failed to get ' + repo + '\'s git tree')
    err.res = res
    err.remote = 'github'
    throw err
  }

  return res.body.tree
}

/**
 * @param {String} repo
 * @param {String} reference
 * @param {Object} object
 * @param {String} filename
 * @return {String} filename
 * @api public
 */

GitHub.prototype._getFile = function* (repo, ref, obj, filename) {
  var uri = 'https://raw.github.com/' + repo + '/' + ref + '/' + obj.path
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