/**
 * This is the base Remote constructor to inherit from.
 *
 * You do not actually use this constructor;
 * you extend from it with Remote.extend().
 */

var co = require('co');
var cp = require('cp');
var chanel = require('chanel')
var request = require('cogent')
var fs = require('graceful-fs')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var semver = require('semver')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits
var tmpdir = require('os').tmpdir()
var relative = require('path').relative
var dirname = require('path').dirname
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
  this.concurrency = options.concurrency || 2

  // look up cogent options
  // automatically retry once so people don't complain
  options.retries = options.retries || 1;
  this.request = request.extend(options)

  // cache for component versions
  // @api public
  this.versions = Object.create(null)

  // cache for component@version's component.json
  // @api public
  this.components = Object.create(null)

  // cache for component@version's git tree
  // @api public
  this.tree = Object.create(null)
}

/**
 * So you don't have to differentiate between a `remotes` instance and a `Remote` instance.
 *
 * @return {this}
 * @api public
 */

Remote.prototype.resolve = function* (remotes, repo, ref) {
  if (typeof remotes === 'string') {
    ref = repo;
    repo = remotes;
  } else if (Array.isArray(remotes) && !~remotes.indexOf(this.name)) {
    // if the current remote is not in this list,
    // then it's obviously not valid.
    return;
  }
  var json = yield* this.Json(repo, ref || 'master');
  if (json) return this;
}

/**
 * Caching wrapper around getting component versions.
 * Filter by valid semantic versions and order them descendingly.
 *
 * @param {String} repo
 * @return {Array} references
 * @api public
 */

Remote.prototype.Versions = function* (repo) {
  repo = repo.toLowerCase()
  var event = 'version:' + repo

  // already resolved or in-flight
  if (repo in this.versions)
    return this.versions[repo] === 'resolving'
      ? (yield this.await(event))
      : this.versions[repo]

  this.versions[repo] = 'resolving'
  var references = yield* this._versions(repo)
  var versions = this.versions[repo] = references
    ? references.filter(semver.valid).sort(semver.rcompare)
    : null
  this.emit(event, versions)
  return versions
}

/**
 * Caching wrapper around getting a component.json.
 *
 * @param {String} repo
 * @param {String} reference
 * @return {Object} component.json
 * @api public
 */

Remote.prototype.Json = function* (repo, ref) {
  repo = repo.toLowerCase()
  var slug = repo + '@' + ref
  var event = 'json:' + slug

  // already resolved or in-flight
  if (slug in this.components)
    return this.components[slug] === 'resolving'
      ? (yield this.await(event))
      : this.components[slug]

  this.components[slug] = 'resolving'
  var json = yield* this._json(repo, ref)
  if (json) {
    var valid = semver.valid(ref)
    if (valid) json.version = valid
    if (!json.repo) json.repo = repo
  } else {
    // i don't like `undefined`s
    json = null
  }
  this.components[slug] = json
  this.emit(event, json)
  return json
}

/**
 * Caching wrapper around getting a component's tree.
 * Should be a list of files with the following properties:
 *
 *   - sha - sha1sum
 *   - path
 *   - size
 *
 * This is pretty slow - avoid using it.
 *
 * @param {String} repo
 * @param {String} ref
 * @return {Array} objects
 * @api public
 */

Remote.prototype.Tree = function* (repo, ref) {
  repo = repo.toLowerCase()
  var slug = repo + '@' + ref
  var event = 'tree:' + slug

  if (slug in this.tree)
    return this.tree[slug] === 'resolving'
      ? (yield this.await(event))
      : this.tree[slug]

  this.tree[slug] = 'resolving'
  var tree = yield* this._tree(repo, ref)
  tree = tree || null
  this.tree[slug] = tree
  this.emit(event, tree)
  return tree
}

/**
 * Download all the files of a repo and ref to a folder.
 * Only populates the folder when all the files have successfully downloaded.
 *
 * Note that for some remotes like the registry,
 * you should overwrite this with a tarball fetch instead.
 *
 * Does not handle in-flight requests - expects you to do it yourself.
 *
 * @param {String} repo
 * @param {String} reference
 * @param {Array} objects
 * @api public
 */

Remote.prototype.Files = function* (repo, ref, objs, destination) {
  // temporary folder to store stuff
  var tmp = join(tmpdir, uid())
  yield mkdirp.bind(null, tmp)

  // download all the files with concurrency
  var ch = chanel()
  ch.concurrency = this.concurrency
  objs.forEach(function (obj) {
    ch.push(co(this.File(repo, ref, obj, tmp)))
  }, this)
  var files = yield* ch.flush()

  // remove the destination folder if it exists
  yield rimraf.bind(null, destination)

  // move the temporary folder to the destination folder
  yield mkdirp.bind(null, dirname(destination))
  // fs.rename does not support renaming between disks or partitions so if the rename fails copy everything
  try {
    yield fs.rename.bind(null, tmp, destination)
  } catch (err) {
    if (err.code != 'EXDEV') throw err;

    yield files.map(function (file) {
      var dest = join(destination, relative(tmp, file));
      return function (done) {
        mkdirp(dirname(dest), function (err) {
          if (err) return done(err);
          cp(file, dest, done);
        })
      }
    })
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

Remote.prototype.File = function* (repo, ref, obj, destination) {
  // so the objects could be the paths or the tree objects
  if (typeof obj === 'string') obj = { path: obj }
  var filename = join(destination, obj.path)
  yield mkdirp.bind(null, dirname(filename))
  return yield* this._file(repo, ref, obj, filename)
}

/**
 * Await an event. Returns the event.
 * This is useful for waiting for inflight requests to finish.
 *
 * @param {String} event type
 * @param {String} event name
 * @api private
 */

Remote.prototype.await = function (type, event) {
  var self = this
  return function (done) {
    self.once(event, function (result) {
      done(null, result)
    })
  }
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
