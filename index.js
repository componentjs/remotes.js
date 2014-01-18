try {
  module.exports = require('./lib/remotes')
} catch (err) {
  module.exports = require('./build/remotes')
}