var co = require('co')
var path = require('path')
var assert = require('assert')

var Remotes = require('..')
var github = new Remotes.github
var local = new Remotes.local({
  out: __dirname + '/components'
})

describe('Remotes', function () {
  describe('when no remotes satisfy', function () {
    it('should not throw n shit', co(function* () {
      var remotes = new Remotes(['github', 'bitbucket'])
      var remote = yield* remotes.resolve('lkajsdlfjajklsdf/alkjlkjalskdjf')
    }))
  })
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

    describe('when a remote matches', function () {
      it('should return that remote', co(function* () {
        var r = yield* remote.resolve('component/emitter', '1.0.0')
        r.should.equal(github)

        var r = yield* remote.resolve('component/a', '1.2.3')
        r.should.equal(local)
      }))
    })

    describe('when a remote matches and no `remotes` argument is supplied', function () {
      it('should return that remote', co(function* () {
        var r = yield* remote.resolve(null, 'component/emitter', '1.0.0')
        r.should.equal(github)

        var r = yield* remote.resolve(null, 'component/a', '1.2.3')
        r.should.equal(local)
      }))
    })

    // this test fails in combination with the other tests, .only works!
    describe('when no remote matches', function () {
      it('should return null', co(function* () {
        var r = yield* remote.resolve('kljalsdkfjlaksjdflkajsdf')
        assert.ok(!r)

        var r = yield* remote.resolve('kljalsdkfjlaksjdflkajsdf/alksdjfklajsdf')
        assert.ok(!r)
      }))
    })

    describe('when the component is already downloaded', function () {
      describe('when given versions and no remotes', function () {
        it('should resolve versions normally', co(function* () {
          var r = yield* remote.resolve('component/emitter', '1.0.0')
          r.should.equal(github)

          r = yield* remote.resolve('component/a', '1.2.3')
          r.should.equal(local)
        }))

        it('should ignore unlisted remotes', co(function* () {
          var r = yield* remote.resolve(['local'], 'component/emitter', '1.0.0')
          assert(!r)
        }))
      })

      describe('when given no versions and no remotes', function () {
        it('should resolve to local if a version exists', co(function* () {
          var r = yield* remote.resolve('component/a')
          r.should.equal(local)
        }))

        it('should resolve to github if a version does not exist', co(function* () {
          var r = yield* remote.resolve('component/domify')
          r.should.equal(github)
        }))

        it('should ignore unlisted remotes', co(function* () {
          var r = yield* remote.resolve(['local'], 'component/domify')
          assert(!r)
        }))
      })
    })
  })

  describe('options', function () {
    describe('local: true', function () {
      it('should use the local remote', function () {
        var remote = Remotes(['github'], {
          local: true,
        });

        remote.remote.local.should.be.ok;
      })
    })
  })
})
