// pm2 deploy config for webxr-experiments. The site is static, so no pm2 app runs; pm2 deploy
// checks out the repo on the server and builds it.
//
//   pm2 deploy ecosystem.config.cjs production setup   # first time: clone repo on the server
//   pm2 deploy ecosystem.config.cjs production         # every deploy after that
//
// A deploy checks out `ref` into <path>/source (reached through <path>/current) and runs
// scripts/build.mts, which installs each demo's node_modules, fetches whack-an-imp, and points
// <path>/current/dist at the new build. Point the web server at <path>/current/dist.
// Override the defaults with the WEBXR_DEPLOY_* variables.

module.exports = {
    apps: [],

    deploy: {
        production: {
            user: process.env.WEBXR_DEPLOY_USER || 'deployman',
            host: [process.env.WEBXR_DEPLOY_HOST || 'josh.earth'],
            key: process.env.WEBXR_DEPLOY_KEY || '../deployman_private.key',
            ref: 'origin/master',
            repo: 'https://github.com/joshmarinacci/webxr-experiments.git',
            path: process.env.WEBXR_DEPLOY_PATH || '/home/deployman/apps/webxr-experiments',
            'post-deploy': 'node --experimental-strip-types scripts/build.mts',
        },
    },
}
