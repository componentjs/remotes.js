var mkdirp = require('mkdirp')
var semver = require('semver')
var join = require('path').join

var Remote = require('./remote')

var GITHUB_USERNAME = process.env.GITHUB_USERNAME
var GITHUB_PASSWORD = process.env.GITHUB_PASSWORD

module.exports = GitHub

function GitHub(options) {
  options = options || {}

  if (!options.auth) {
    if (GITHUB_USERNAME && GITHUB_PASSWORD)
      options.auth = GITHUB_USERNAME + ':' + GITHUB_PASSWORD
    else
      this.emit('warning', {
        type: 'suggestion',
        message: 'you should add your github auth as <username>:<password> to avoid GitHub\'s API rate limit.'
      })
  }

  Remote.call(this, options)
}

Remote.extend(GitHub)

/**
 * Get all git tags that are valid semver versions.
 *
 * DOES NOT SOLVE REDIRECTS!
 */

Remote.prototype.getVersions = function* (repo) {
  repo = repo.toLowerCase()
  if (repo in this.versions)
    return this.versions[repo]

  var uri = 'https://api.github.com/repos/' + repo + '/tags'
  var res = yield* this.request(uri, true)
  if (res.statusCode === 400)
    return this.versions[repo] = null // return nothing on a 404
  if (res.statusCode !== 200) {
    var err = new Error('failed to get ' + repo + '\'s tags')
    err.res = res
    err.remote = 'github'
    throw err
  }

  return this.versions[repo] = res.body
    .map(name)
    .filter(semver.valid)
    .sort(semver.rcompare)
}

/**
 * Get a component and references's component.json.
 */

Remote.prototype.getJSON = function* (repo, ref) {
  repo = repo.toLowerCase()
  var slug = repo + '#' + ref
  if (slug in this.components)
    return this.components[slug]

  var uri = 'https://raw.github.com/' + repo + '/' + ref + '/component.json'
  var res = yield* this.request(uri, true)
  if (res.statusCode === 400)
    return this.components[slug] = null // return nothing on a 404
  if (res.statusCode !== 200) {
    var err = new Error('failed to get ' + repo + '\'s component.json')
    err.res = res
    err.remote = 'github'
    throw err
  }

  // to do: sha1sum check
  return this.components[slug] = res.body
}

/**
 * Get all the files in a component.
 * Should be a list of files with the following properties:
 *
 *   - sha - sha1sum
 *   - path
 *   - size
 *
 * DOES NOT SOLVE REDIRECTS!
 */

Remote.prototype.getTree = function* (repo, ref) {
  repo = repo.toLowerCase()
  var slug = repo + '#' + ref
  if (slug in this.tree)
    return this.tree[slug]

  var uri = 'https://api.github.com/repos/' + repo + '/git/trees/' + ref
  var res = yield* this.request(uri, true)
  if (res.statusCode === 400)
    return this.tree[slug] = null
  if (res.statusCode !== 200) {
    var err = new Error('failed to get ' + repo + '\'s git tree')
    err.res = res
    err.remote = 'github'
    throw err
  }

  return this.tree[slug] = res.body.tree
}

/**
 * Download a single file to a destination folder and do a sha1sum check.
 */

Remote.prototype.getFile = function* (repo, ref, obj, destination) {
  var uri = 'https://raw.github.com/' + repo + '/' + ref + '/' + obj.path
  var filename = join(destination, obj.path)
  yield function (done) {
    mkdirp(join(filename, '..'), done)
  }

  var res = yield* this.request(uri, filename)
  if (res.statusCode !== 200) {
    var err = new Error('failed to download ' + repo + '\'s file ' + obj.path)
    err.res = res
    err.remote = 'github'
    err.destination = destination
    err.obj = obj
    err.filename = filename
    throw err
  }

  // to do: sha1sum check

  return filename
}

function name(x) {
  return x.name
}