var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits

module.exports = Remotes

inherits(Remotes, EventEmitter)

Remotes.remote =
Remotes.Remote = require('./remote')

// name of the remotes
Remotes.remotes = []

Remotes.local =
Remotes.Local = require('./remotes/local')
Remotes.remotes.push('local')

Remotes.github =
Remotes.Github =
Remotes.GitHub = require('./remotes/github')
Remotes.remotes.push('github')

function Remotes(options) {
  if (!(this instanceof Remotes))
    return new Remotes(options)

  options = options || {}

  // list of remotes
  this.remotes = []
  // look up remotes by `remote.name`
  this.remote = Object.create(null)
}

/**
 * Use a remote. At least one is required.
 * Must inherit from `Remote`.
 *
 * @param {Object} remote
 * @api public
 */

Remotes.prototype.use = function (remote) {
  if (!(remote instanceof Remotes.Remote))
    throw new TypeError('You may only use .Remote\'s')

  this.remotes.push(remote)
  this.remote[remote.name] = remote

  var self = this
  // proxy messages
  remote.on('warning', function (msg) {
    self.emit('warning', msg)
  })
  remote.on('suggestion', function (msg) {
    self.emit('suggestion', msg)
  })
}

/**
 * Resolve a component from [remotes].
 * Internally, this will just look up the `component.json`.
 * Returns the remote instance if there's a match, otherwise null.
 * If there's only one remote, then it'll just return that remote.
 *
 * @param {Array} remotes
 * @param {String} component name
 * @param {String} component reference
 * @return {Object} remote
 * @api public
 */

Remotes.prototype.resolve = function* (remotes, name, reference) {
  var length = this.remotes.length
  if (!length) throw new Error('no remotes')

  // resolve(name, [reference])
  if (typeof remotes === 'string') {
    reference = name
    name = remotes
    remotes = this.remotes.map(toName)
  }

  // checks master by default.
  // i wouldn't suggest you actually use a reference for now
  // since it would fail if the tags have leading `v`s
  reference = reference || 'master'

  // map to remote instances
  remotes = remotes.map(function (name) {
    return this.remote[name]
  }, this)

  // loop through
  for (var i = 0; i < remotes.length; i++)
    if (yield* remotes[i].getJSON(name, reference))
      return remotes[i]
}

function toName(x) {
  return x.name
}