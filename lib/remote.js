/**
 * This is the base Remote constructor to inherit from.
 * This may look a little barren to you now,
 * but in the future, we'll probably have more stuff.
 *
 * You do not actually use this constructor;
 * you extend from it with Remote.extend().
 */

var request = require('cogent')
var rimraf = require('rimraf')
var archan = require('archan')
var mkdirp = require('mkdirp')
var fs = require('graceful-fs')
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
 */

Remote.extend = function (Child) {
  inherits(Child, this);
  Object.keys(this).forEach(function (key) {
    Child[key] = this[key]
  }, this)
  return Child
}

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
 * Download all the files of a repo and ref to a folder.
 */

Remote.prototype.getFiles = function* (repo, ref, paths, destination) {
  // temporary folder
  var tmp = join(tmpdir, uid())
  yield function (done) {
    mkdirp(tmp, done)
  }

  var ch = archan({
    concurrency: this.concurrency
  })
  for (var i = 0; i < paths.length; i++) {
    yield* ch.drain()
    co(this.getFile(repo, ref, paths[i], tmp)).call(this, ch.push())
  }
  yield* ch.flush(false)

  // unlink the destination folder and replace
  yield function (done) {
    rimraf(destination, function (err) {
      if (err)
        return done(err)

      fs.rename(tmp, destination, done)
    })
  }
}

function uid() {
  return Math.random().toString(36).slice(2)
}