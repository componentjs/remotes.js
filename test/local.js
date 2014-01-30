var co = require('co')
var fs = require('fs')
var path = require('path')

var Remote = require('..').local
var remote = new Remote({
  root: path.join(__dirname, 'components')
})

describe('Local Remote', function () {
  describe('.getVersions()', function () {
    it('should get all versions in descending order', co(function* () {
      var versions = yield* remote.Versions('component/a')
      versions.should.include('1.2.3')
      versions.should.include('v1.0.0')
      versions.should.not.include('master')
    }))

    it('should work with versions that start with v', co(function* () {
      var versions = yield* remote.Versions('component/a')
      versions.should.include('v1.0.0')
    }))

    it('should cache results', co(function* () {
      var versions = yield* remote.Versions('component/a')
      var versions2 = yield* remote.Versions('component/a')
      versions.should.equal(versions2)
    }))
  })

  describe('.getJSON()', function () {
    it('should get the JSON of a tag', co(function* () {
      var json = yield* remote.Json('component/a', '1.2.3')
      json.version.should.equal('1.2.3')
    }))

    it('should get the JSON of a branch', co(function* () {
      var json = yield* remote.Json('component/a', 'master')
      json.name.should.equal('a')
    }))

    it('should cache results', co(function* () {
      var json = yield* remote.Json('component/a', 'master')
      var json2 = yield* remote.Json('component/a', 'master')
      json.should.equal(json2)
    }))
  })
})