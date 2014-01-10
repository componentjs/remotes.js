/**
 * This is the base Remote constructor to inherit from.
 *
 * You do not actually use this constructor;
 * you extend from it with Remote.extend().
 */

var request = require('cogent')
var fs = require('graceful-fs')
var rimraf = require('rimraf')
var archan = require('archan')
var mkdirp = require('mkdirp')
var semver = require('semver')
var co = require('co')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits
var tmpdir = require('os').tmpdir()
var join = require('path').join

module.exports = Remote

inherits(Remote, EventEmitter)

/**
 * Extend a constructor from the currency constructor.
 * Usage:
 *
 *   function GitHub(options) {
 *     if (!(this instanceof GitHub)) return new Github(options)
 *     options = options || {}
 *     Remote.call(this, options)
 *   }
 *
 *   Remote.extend(GitHub)
 *
 * @param {Remote} this
 * @param {Function} Child
 * @return Child
 * @api public
 */

Remote.extend = function (Child) {
  inherits(Child, this);
  Object.keys(this).forEach(function (key) {
    Child[key] = this[key]
  }, this)
  return Child
}

/**
 * @param {Object} options
 * @api public
 */

function Remote(options) {
  options = options || {}

  // how many concurrent connections to open
  // when downloading files from a remote
  this.concurrency = options.concurrency || 5

  // look up cogent options
  this.request = request.extend(options)

  // cache for component versions
  // @api public
  this.versions = Object.create(null)
  // cache for component#version's component.json
  // @api public
  this.components = Object.create(null)
  // cache for component#version's git tree
  // @api public
  this.tree = Object.create(null)
}

/**
 * Caching wrapper around getting component versions.
 * Filter by valid semantic versions and order them descendingly.
 *
 * @param {String} repo
 * @return {Array} references
 * @api public
 */

Remote.prototype.getVersions = function* (repo) {
  repo = repo.toLowerCase()
  if (repo in this.versions) return this.versions[repo]
  var references = yield* this._getVersions(repo)
  return this.versions[repo] = references
    ? references.filter(semver.valid).sort(semver.rcompare)
    : null
}

/**
 * Caching wrapper around getting a component.json.
 *
 * @param {String} repo
 * @param {String} reference
 * @return {Object} component.json
 * @api public
 */

Remote.prototype.getJSON = function* (repo, ref) {
  repo = repo.toLowerCase()
  var slug = repo + '#' + ref
  if (slug in this.components) return this.components[slug]
  var json = yield* this._getJSON(repo, ref)
  if (!json) return this.components[slug] = null
  // fix incorrect component.json versions
  var valid = semver.valid(ref)
  if (valid) json.version = valid
  return this.components[slug] = json
}

/**
 * Caching wrapper around getting a component's tree.
* Should be a list of files with the following properties:
 *
 *   - sha - sha1sum
 *   - path
 *   - size
 *
 * @param {String} repo
 * @param {String} ref
 * @return {Array} objects
 * @api public
 */

Remote.prototype.getTree = function* (repo, ref) {
  repo = repo.toLowerCase()
  var slug = repo + '#' + ref
  if (slug in this.tree) return this.tree[slug]
  var tree = yield* this._getTree(repo, ref)
  return this.tree[slug] = tree || null
}

/**
 * Download all the files of a repo and ref to a folder.
 * Only populates the folder when all the files have successfully downloaded.
 *
 * @param {String} repo
 * @param {String} reference
 * @param {Array} objects
 * @api public
 */

Remote.prototype.getFiles = function* (repo, ref, objs, destination) {
  // temporary folder
  var tmp = join(tmpdir, uid())
  yield function (done) {
    mkdirp(tmp, done)
  }

  // download all the files with concurrency
  var ch = archan()
  ch.concurrency = this.concurrency
  var getFile = co(this.getFile)
  for (var i = 0; i < objs.length; i++) {
    yield* ch.drain()
    getFile.call(this, repo, ref, objs[i], tmp, ch.push())
  }
  yield* ch.flush(false)

  // remove the destination folder if it exists
  yield function (done) {
    rimraf(destination, done)
  }

  // move the temporary folder to the destination folder
  yield function (done) {
    fs.rename(tmp, destination, done)
  }
}

/**
 * Wrapper around getting a file.
 * User enters the destination folder,
 * this wrapper handles the destination,
 * but the implementor only handles the resulting output.
 *
 * @param {String} repo
 * @param {String} reference
 * @param {Object} object
 * @param {String} destination
 * @return {String} filename
 * @api public
 */

Remote.prototype.getFile = function* (repo, ref, obj, destination) {
  var filename = join(destination, obj.path)
  yield function (done) {
    mkdirp(join(filename, '..'), done)
  }

  return yield* this._getFile(repo, ref, obj, filename)
}

/**
 * Simple warning message.
 *
 * @param {String} message
 * @api private
 */

Remote.prototype.warn = function (msg) {
  this.emit('warning', {
    message: msg
  })
}

/**
 * Simple suggestion.
 *
 * @param {String} message
 * @api private
 */

Remote.prototype.suggest = function (msg) {
  this.emit('suggestion', {
    message: msg
  })
}

// for creating a temporary file directory name
function uid() {
  return Math.random().toString(36).slice(2)
}