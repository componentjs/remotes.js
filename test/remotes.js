var co = require('co')
var assert = require('assert')

var Remotes = require('..')
var github = new Remotes.GitHub
var local = new Remotes.Local

describe('Remotes', function () {
  describe('when given an array of remotes', function () {
    it('should initiate those remote instances', function () {
      var remote = Remotes(['local', 'github'])
      assert.ok(remote.remote.local)
      assert.ok(remote.remote.github)
    })

    describe('when one remote is not valid', function () {
      it('should throw', function () {
        assert.throws(function () {
          var remote = Remotes(['klajsdf'])
        })
      })
    })
  })

  describe('when using no remotes', function () {
    var remote = Remotes()

    it('should throw on resolve', co(function* () {
      try {
        yield* remote.resolve('component/emitter')
        throw new Error('boom')
      } catch (err) {
        err.message.should.equal('no remotes')
      }
    }))
  })

  describe('when using one remote', function () {
    var remote = Remotes()
    remote.use(github)

    describe('when the remote matches', function () {
      it('should return nothing', co(function* () {
        var r = yield* remote.resolve('component/emitter', '1.0.0')
        r.should.equal(github)
      }))
    })

    describe('when the remote does not match', function () {
      it('should return null', co(function* () {
        r = yield* remote.resolve('kljalsdkfjlaksjdflkajsdf')
        assert.ok(!r)
      }))
    })
  })

  describe('when using multiple remotes', function () {
    var remote = Remotes()
    remote.use(local)
    remote.use(github)

    describe('when remote matches', function () {
      it('should return that remote', co(function* () {
        var r = yield* remote.resolve('component/emitter', '1.0.0')
        r.should.equal(github)
      }))
    })

    describe('when no remote matches', function () {
      it('should return null', co(function* () {
        r = yield* remote.resolve('kljalsdkfjlaksjdflkajsdf')
        assert.ok(!r)
      }))
    })
  })
})
