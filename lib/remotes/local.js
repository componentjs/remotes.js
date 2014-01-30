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

Local.prototype.name = 'local';

/**
 * Local resolution is a little different than other remotes.
 * In particular, if no `ref` is set,
 * we check for any version.
 *
 * @param {String} repo
 * @return {this}
 * @api public
 */

Local.prototype.resolve = function* (remotes, repo, ref) {
  if (typeof remotes === 'string') {
    ref = repo;
    repo = remotes;
  } else if (Array.isArray(remotes) && !~remotes.indexOf('local')) {
    // if the current remote is not in this list,
    // then it's obviously not valid.
    return;
  }

  var folders = yield* this.getFolders(repo);
  if (!folders) return;
  if (ref) {
    if (~folders.indexOf(folderslug(repo, ref))) return this;
    return;
  }

  // no ref, just check if any version is downloaded
  return folders.length
    ? this
    : null;
}

/**
 * Get the current components in the folder as a list.
 * Does not remove the `-<version`.
 *
 * @param {String} repo
 * @return {Array} folders
 * @api public
 */

Local.prototype.getFolders = function* (repo) {
  repo = repo.toLowerCase();
  var prefix = repo.split('/').join('-');
  var folders
  try {
    folders = yield readdir(this.out);
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }

  return folders.filter(function (folder) {
    return !folder.indexOf(prefix);
  });
}

/**
 * Return the currently downloaded components' semantic versions.
 * Assumes folders are of the form <user>-<repo>-<reference>
 *
 * @param {String} repo
 * @return {Array} references
 * @api public
 */

Local.prototype._versions = function* (repo) {
  var folders = yield* this.getFolders(repo);
  if (!folders) return;
  return folders.map(toVersion);
}

/**
 * Only return the `-<version>` portion of a folder name.
 *
 * @param {String} folder
 * @return {String} version
 * @api private
 */

function toVersion(folder) {
  return folder.slice(folder.lastIndexOf('-') + 1);
}

/**
 * Return the existing component.json, if any.
 * @param {String} repo
 * @param {String} reference
 * @return {Object} component.json
 * @api public
 */

Local.prototype._json = function* (repo, ref) {
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
 * NOT RELEVANT WITH THIS REMOTE
 */

Local.prototype._trees = function* () {
  /* jshint noyield:true */
}

/**
 * NOT RELEVANT WITH THIS REMOTE
 */

Local.prototype._file = function* () {
  /* jshint noyield:true */
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