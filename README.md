# Remotes.js [![Build Status](https://travis-ci.org/component/remotes.js.png)](https://travis-ci.org/component/remotes.js)

The goal of this repo is to normalize different remote endpoints for Component into a unified API. You can also create your own remote endpoints this way instead of shoehorning different APIs into a JSON file. This also handles versions and git trees, which is a little more complicated than just github raw.

Example:

```js
var Remotes = require('remotes')
var remotes = Remotes()
remotes.use(new Remotes.GitHub({
  auth: 'jonathanong:password'
}))
remotes.use(new Remotes.Local())

co(function* () {
  var remote = yield* remotes.resolve('component/emitter')
  var versions = yield* remote.getVersions('component/emitter')
  // do stuff with the versions
})
```

A shortcut for the above is:

```js
var remotes = require('remotes')([
  'github',
  'local'
], {
  netrc: ''
})
```

Where `netrc` points to a `netrc` file. See [netrc](https://github.com/CamShaft/netrc).

## new Remotes()

See the docs on [remotes](https://github.com/component/remotes.js/blob/master/docs/remotes.md).

## Remotes.Remote

See the docs on [remote](https://github.com/component/remotes.js/blob/master/docs/remote.md).

## Remotes[remote]

Any already constructed remotes. The current remotes are:

- `remotes.github`
- `remotes.local` - use downloaded components

The list of names can be found at `Remotes.remotes`. These are also aliased with their title-cased versions.

## Remotes.extend(Child)

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

See the [github remote](https://github.com/component/remotes.js/tree/master/lib/remotes/github.js) as an implementation example.

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