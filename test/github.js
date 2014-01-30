var co = require('co')
var fs = require('fs')
var tmpdir = require('os').tmpdir()
var path = require('path')
var rimraf = require('rimraf')

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
  describe('.getVersions()', function () {
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
  })

  describe('.getJSON()', function () {
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

  describe('.getTree()', function () {
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

  describe('.getFile()', function () {
    it('should get a file', co(function* () {
      yield* remote.file('component/domify', '1.2.0', {
        path: 'History.md'
      }, tmpdir)
      fs.statSync(path.join(tmpdir, 'History.md'))
      fs.unlinkSync(path.join(tmpdir, 'History.md'))
    }))
  })

  describe('.getFiles()', function () {
    it('should get a list of files', co(function* () {
      var dest = path.join(tmpdir, 'lkasjdf')
      try {
        fs.mkdirSync(dest)
      } catch (err) {}
      yield* remote.files('component/domify', '1.2.0', [{
        path: 'History.md'
      }, {
        path: "Readme.md"
      }], dest)
      fs.statSync(dest)
      fs.statSync(path.join(dest, 'History.md'))
      fs.statSync(path.join(dest, 'Readme.md'))
      rimraf.sync(dest)
    }))
  })
})