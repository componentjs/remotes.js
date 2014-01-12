## var remotes = new Remotes()

Returns an new `remotes` instance for resolving multiple remotes.

### remotes.use(remote)

Use a remote. By default, it will check each remote in the order specified. For example:

```js
var Remotes = require('remotes')
var remote = new Remotes()
remote.use(new Remotes.Local) // check local first by default
remote.use(new Remotes.GitHub) // then check github

### var remote = yield* remotes.resolve(remotes, repo, [reference])

Returns the first remote where `repo/reference` has a `component.json`. Example:

```js
var remote = yield* remotes.resolve(['github', 'gitorious'], 'component/emitter', '1.0.0')
// remote will be the `github` remote instance.
```

`remotes` is a list of `Remote` names, not the instances themselves. By default `reference` is `master`.

### var remote = yield* remotes.resolve(repo, [reference])

Same as above, but it will check every remote on `.use()` order.

### event: warning

### event: message