/**
 * This is specifically for the builder where the
 * dependencies have been resolved and you just want
 * to access the component.jsons locally.
 */

var fs = require('graceful-fs')
var join = require('path').join
var resolve = require('path').resolve

var Remote = require('../remote')

module.exports = Local

Remote.extend(Local)

function Local(options) {
  if (!(this instanceof Local))
    return new Local(options)

  options = options || {}

  this.out = resolve(process.cwd(), options.root || 'components')

  // in case you want to save to a different folder
  // like /user/name/ref/component.json
  this.folder = options.folder || folderslug

  Remote.call(this, options)
}

Local.prototype.name = 'local'

/**
 * Return the currently downloaded components' semantic versions.
 * Assumes folders are of the form <user>-<repo>-<reference>
 *
 * @param {String} repo
 * @return {Array} references
 * @api public
 */

Local.prototype._getVersions = function* (repo) {
  var prefix = repo.split('/').join('-')
  var folders
  try {
    folders = yield readdir(this.out)
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }
  return folders
    .filter(function (folder) {
      return !folder.indexOf(prefix)
    })
    .map(function (folder) {
      return folder.slice(folder.lastIndexOf('-') + 1)
    })
}

/**
 * Return the existing component.json, if any.
 * @param {String} repo
 * @param {String} reference
 * @return {Object} component.json
 * @api public
 */

Local.prototype._getJSON = function* (repo, ref) {
  var body
  var filename = join(this.out, this.folder(repo, ref), 'component.json')
  try {
    body = yield read(filename)
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }
  try {
    return JSON.parse(body)
  } catch (_err) {
    throw new Error('JSON parsing error with "' + filename + '"')
  }
}

/**
 * NOT RELEVANT
 *
 * @param {String} repo
 * @param {String} ref
 * @return {Array} objects
 * @api public
 */

Local.prototype._getTree = function* (repo, ref) {

}

/**
 * NOT RELEVANT
 *
 * @param {String} repo
 * @param {String} reference
 * @param {Object} object
 * @param {String} filename
 * @return {String} filename
 * @api public
 */

Local.prototype._getFile = function* (repo, ref, obj, filename) {

}

function folderslug(repo, ref) {
  return repo.split('/').join('-') + '-' + ref
}

function readdir(root) {
  return function (done) {
    fs.readdir(root, done)
  }
}

function read(filename) {
  return function (done) {
    fs.readFile(filename, 'utf8', done)
  }
}