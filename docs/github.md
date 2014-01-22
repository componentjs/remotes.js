## GitHub Remote

If you aren't authenticated, you'll hit a 60 requests per hour rate limit with GitHub's API. There are a couple ways to authenticate:

- Set `GITHUB_USERNAME` and `GITHUB_PASSWORD` environmental variables.
- Supply `auth: '<username>:<password>'` to the github remote constructor.
- Supply a `netrc` file as an option: [netrc](https://github.com/CamShaft/netrc).