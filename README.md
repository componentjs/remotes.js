# Remotes.js [![Build Status](https://travis-ci.org/component/remotes.js.png)](https://travis-ci.org/component/remotes.js)

The goal of this repo is to normalize different remote endpoints for Component into a unified API. Currently, only GitHub is supported.

Example:

```js
var remotes = require('remotes')
var github = new remotes.GitHub({
  auth: 'jonathanong:password'
})

co(function* () {
  var versions = yield* github.getVersions('component/emitter')
  // do stuff with the versions
})
```

## new Remotes()

NOT IMPLEMENTED!

Right now in component, we set `remotes: []`. Ideally, this repo will allow you to create a set of remotes, then query this set. Something like:

```js
var remotes = require('remotes')

var controller = remotes()
controller.use(remotes.github)
controller.use(remotes.bitbucket)

// then actually querying the remotes will check each, one by one
co(function* () {
  var versions = yield* controller.getVersions('component/emitter')
  // do stuff with the versions
})
```

## remotes.Remote

A base Constructor to extend any additional remotes.

## remotes[remote]

Any already constructed remotes. The current remotes are:

- `remotes.github`

## Remote.extend(Child)

Extend a new `Remote` class with the current Remote. Example:

```js
function GitHub(options) {
  options = options || {}
  Remote.call(this, options)

  this.something = 'asdf'
}

Remote.extend(GitHub)

Github.prototype.something = function () {

}

```

## var remote = new remote.Remote([options])

Creates a new remote instance. Some options are:

- `concurrency` <5> - maximum number of concurrent downloads per `.getFiles`

Other options are passed to [cogent](https://github.com/cojs/cogent#var-response--yield-requesturl-options), so this is where you set your `auth`, `proxy`, etc. on a per-remote basis.

## var versions[] = yield* remote.getVersions(repo)

Repo is of the form `<username>/<project>`. This will return all the semantically versioned releases in the repository. This will not normalize versions (i.e. strip leading `v`s). It will return an array of strings in descending versions.

## var json = yield* remote.getJSON(repo, ref)

Returns the `component.json` of a repo's reference.

## var tree = yield* remote.getTree(repo, ref)

Returns the list of files in the repository and reference. Will return a list of objects with properties:

- `path` - file path in the repo
- `sha` - sha1 check sum
- `fize` - file byte length

## var filename = yield* remote.getFile(repo, ref, obj, folder)

Downloads a file `obj` to a destination `folder` from a repository's reference. `obj` should be an object as returned from the `tree`. You can always just do `{path: ''}` if you don't care to download the tree.

Returns the abolute path of the resulting file.

## yield* remote.getFiles(repo, ref, objs, folder)

Downloads all the files in `objs` to the folder.

## License

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.