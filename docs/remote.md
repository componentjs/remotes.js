## new remotes.Remote([options])

A base Constructor to extend any additional remotes. Like node's stream API, you implement remotes by setting `._METHOD`s.

`options`:

- `concurrency` <5> - maximum number of concurrent downloads per `.getFiles`

Other options are passed to [cogent](https://github.com/cojs/cogent#var-response--yield-requesturl-options), so this is where you set your `auth`, `proxy`, etc. on a per-remote basis.

To inherit fromt his Remote, use `Remote.extend(Child)`.

### remote.name

Name of the remote. Should be all lowercased, ex. `github`.

### remote.warn(message)

### remote.suggest(message)

### yield* remote.resolve()

Same as `remotes.resolve()` so users don't have to distinguish between a single remote and a `Remotes` instance.

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

## yield* remote.getFiles(repo, ref, tree, folder)

Downloads all the files in `tree` to the folder.

### remote._getVersions

### remote._getJSON

### remote._getTree

### remote._getFile

### event: warning

### event: message