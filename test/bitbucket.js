var co = require('co')
var path = require('path')

var Remote = require('..').bitbucket
var remote = new Remote()

var testComponent = 'netpoetica/component-example';

describe('BitBucket Remote', function () {
  describe('.resolve()', function () {
    it('should resolve itself', co(function* () {
      var bitbucket = yield* remote.resolve(testComponent)
      bitbucket.should.equal(remote)
    }))

    it('should not resolve itself if it is not in the list of remotes', co(function* () {
      var bitbucket = yield* remote.resolve(['local'], testComponent)
      ;(bitbucket == null).should.be.ok
    }))
  })

  describe('.versions()', function () {
    it('should get all versions in descending order', co(function* () {
      var versions = yield* remote.versions(testComponent)
      versions.should.include('0.1.0')
    }))

    it('should work with versions that start with v', co(function* () {
      var versions = yield* remote.versions(testComponent)
      versions.should.include('v0.1.1-beta')
    }))

    it('should cache results', co(function* () {
      var versions = yield* remote.versions(testComponent)
      var versions2 = yield* remote.versions(testComponent)
      versions.should.equal(versions2)
    }))

    it('should not crash on wierd versions', co(function* () {
      var versions = yield* remote.versions(testComponent);
      versions.should.not.include('v0.2.5c');
    }))

    it('should throw if the repository doesn\'t exist', co(function* () {
      var res = yield* remote.versions('netpoetica/component-easterbunny');
      (res == null).should.true;
    }))
  })

  describe('.json()', function () {
    it('should get the JSON of a tag', co(function* () {
      var json = yield* remote.json(testComponent, '0.1.0')
      json.version.should.equal("0.1.0")
    }))

    it('should get the JSON of a branch', co(function* () {
      var json = yield* remote.json(testComponent, 'master')
      json.name.should.equal("component-example")
    }))

    it('should add the .repository property if missing', co(function* () {
      var json = yield* remote.json(testComponent, '0.1.3')
      json.repository.should.equal(testComponent)
    }))

    /* Test in future
    it('should resolve redirects', co(function* () {
      var json = yield* remote.json(testComponent, '0.0.4')
      json.name.should.equal('m3-component-library')
      json.repository.should.equal(testComponent)
    }))
    */

    it('should cache results', co(function* () {
      var json = yield* remote.json(testComponent, 'master')
      var json2 = yield* remote.json(testComponent, 'master')
      json.should.equal(json2)
    }))

    it('should fix incorrect component.json versions', co(function* () {
      var json = yield* remote.json(testComponent, 'v0.1.1-beta')
      json.version.should.equal('0.1.1-beta')
    }))
  })

  /* Bitbucket doesn't support trees
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
  */

  describe('.file()', function () {
    it('should return an array', co(function* () {
      var files = remote.file(testComponent, '0.1.3', 'component.json');
      files.length.should.be.ok;
    }))
  })

  describe('.archive()', function () {
    it('should return an object', co(function* () {
      var archive = remote.archive(testComponent);
      archive.zip.length.should.be.ok;
      archive.tar.length.should.be.ok;
    }))
  })
})