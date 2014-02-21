var co = require('co')
var path = require('path')

var Remote = require('..').github
var remote = new Remote()

describe('GitHub Remote', function () {
  describe('.resolve()', function () {
    it('should resolve itself', co(function* () {
      var github = yield* remote.resolve('component/emitter')
      github.should.equal(remote)
    }))

    it('should not resolve itself if it is not in the list of remotes', co(function* () {
      var github = yield* remote.resolve(['local'], 'component/emitter')
      ;(github == null).should.be.ok
    }))
  })

  describe('.versions()', function () {
    it('should get all versions in descending order', co(function* () {
      var versions = yield* remote.versions('component/emitter')
      versions.should.include('1.1.1')
    }))

    it('should work with versions that start with v', co(function* () {
      var versions = yield* remote.versions('remy/nodemon')
      versions.should.include('v1.0.7')
    }))

    it('should cache results', co(function* () {
      var versions = yield* remote.versions('component/clickable')
      var versions2 = yield* remote.versions('component/clickable')
      versions.should.equal(versions2)
    }))

    it('should not crash on wierd versions', co(function* () {
      var versions = yield* remote.versions('chjj/marked');
      versions.should.not.include('v0.2.5c');
    }))
  })

  describe('.json()', function () {
    it('should get the JSON of a tag', co(function* () {
      var json = yield* remote.json('component/emitter', '1.1.1')
      json.version.should.equal('1.1.1')
    }))

    it('should get the JSON of a branch', co(function* () {
      var json = yield* remote.json('component/emitter', 'master')
      json.name.should.equal('emitter')
    }))

    it('should add the .repo property if missing', co(function* () {
      var json = yield* remote.json('component/indexof', '0.0.2')
      json.repo.should.equal('component/indexof')
    }))

    it('should resolve redirects', co(function* () {
      var json = yield* remote.json('jonathanong/clickable', '0.0.4')
      json.name.should.equal('clickable')
      json.repo.should.equal('component/clickable')
    }))

    it('should cache results', co(function* () {
      var json = yield* remote.json('component/domify', 'master')
      var json2 = yield* remote.json('component/domify', 'master')
      json.should.equal(json2)
    }))

    it('should fix incorrect component.json versions', co(function* () {
      var json = yield* remote.json('chjj/marked', 'v0.3.0')
      json.version.should.equal('0.3.0')
    }))
  })

  describe('.tree()', function () {
    it('should get the tree of a release', co(function* () {
      var tree = yield* remote.tree('component/emitter', '1.1.1')
      tree.some(function (obj) {
        return obj.path === 'component.json' && obj.sha
      }).should.be.ok
    }))

    it('should cache results', co(function* () {
      var json = yield* remote.tree('component/domify', 'master')
      var json2 = yield* remote.tree('component/domify', 'master')
      json.should.equal(json2)
    }))

    it('should recursively get items', co(function* () {
      var tree = yield* remote.tree('component/emitter', '1.1.1')
      tree.some(function (obj) {
        return obj.path === 'test/emitter.js'
      }).should.be.ok
    }))

    it('should only return blobs', co(function* () {
      var tree = yield* remote.tree('component/emitter', '1.1.1')
      tree.some(function (obj) {
        return obj.type !== 'blob'
      }).should.not.be.ok
    }))
  })

  describe('.file()', function () {
    it('should return an array', co(function* () {
      var files = remote.file('component/emitter', '1.1.1', 'component.json');
      files.length.should.be.ok;
    }))
  })

  describe('.archive()', function () {
    it('should return an object', co(function* () {
      var archive = remote.archive('component/emitter');
      archive.zip.length.should.be.ok;
      archive.tar.length.should.be.ok;
    }))
  })
})