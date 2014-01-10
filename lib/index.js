module.exports = Remotes

Remotes.remote =
Remotes.Remote = require('./remote')

Remotes.github =
Remotes.Github =
Remotes.GitHub = require('./github')

Remotes.local =
Remotes.Local = require('./local')

function Remotes(options) {
  if (!(this instanceof Remotes))
    return new Remotes(options)

  options = options || {}

  this.remotes = []
}

Remotes.prototype.use = function (remote) {
  if (!(remote instanceof Remotes.Remote))
    throw new TypeError('You may only use .Remote\'s')

  this.remotes.push(remote)
}