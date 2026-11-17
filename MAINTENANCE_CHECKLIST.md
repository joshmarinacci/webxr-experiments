# Maintenance checklist

Remaining fixes found during the November 2026 Dependabot cleanup (PR #18). Everything
here was already broken or missing on `master` before that work.

## Dependencies

- [ ] **particles: replace the stale lock file.** `particles/package-lock.json` is untracked and
      still pins three 0.96, while `package.json` asks for ^0.125 and 0.125.2 is installed. Run
      `npm install` in `particles/` to regenerate it, then commit it.

## Broken demos

- [ ] **Dead CDN imports.** These files import from `https://threejs.org/...` or
      `https://ecsy.io/...`. Both now fail in the browser (CORS errors and 404s). Point them at
      local or version-pinned copies, the way PR #17 did for xmassweater.
  - [ ] `oceantest/` (7 files): also uses the old `examples/jsm/nodes` library, so keep three ≤ r137.
  - [ ] `squishinate/index.js`: same nodes caveat.
  - [ ] `josh_common_ecsy/particles.js`, `aframe_environment.js` and the other files that still
        import `threejs.org` (xmassweater doesn't use them). `particles.js` also needs
        `addAttribute`/`setDynamic` → `setAttribute`/`setUsage`, and `aframe_environment.js`
        uses `THREE.Geometry`/`Face3`.
- [ ] **walls.** `test1.html` imports `./GLTFLoader` without `.js`, and npm
      `webxr-boilerplate@0.1.6` imports `../three/build/three.module` without `.js` inside
      `node_modules`. The vendored `GLTFLoader.js` also imports `VertexColors`, which r125
      removed. Fix: vendor ported boilerplate files (as in `solarsystem/webxr-boilerplate/`),
      swap in r125's GLTFLoader, and port `renderer.vr`/`gammaOutput` in `test1.html`.
- [ ] **hextest/3dgame.** `game3d.js:98` positions the 3D buttons in a `setTimeout(100)` before
      their meshes exist (`Cannot read properties of null (reading 'position')`).
- [ ] **particles/position_particles.** It imports `./PS2` without `.js`, which gives a 404.
- [ ] **particles/testor.** It renders a black screen with no console errors.
- [ ] **Missing assets.**
  - `cat.jpg`: requested by canvas2vr (`breakout_3d*`, `test2`), `input/oculusgonav` and
    `voxeltest/test3`.
  - `particles/tex/test1.png`: requested by `snow.html` and `snow2.html`.
  - `canvas2vr` requests `BoxCat_Games_-_10_-_Epic_Song` without its `.mp3` extension.

## Root index.html links

The root `index.html` links to three folders that aren't in this repo and never were in its
git history. They were probably deployed separately next to it on the server.

- [ ] **2D / 3D Sim Game cards.** They link to `webxr-simgame/2dgame.html` and `3dgame.html`
      plus `webxr-simgame/images/*_thumb.png`. The same games appear to live in
      `hextest/2dgame.html` and `hextest/3dgame.html`. Repoint the links and add thumbnails,
      since `hextest` has none.
- [x] **Whack an Imp card.** The game lives in
      [joshmarinacci/whack-an-imp](https://github.com/joshmarinacci/whack-an-imp).
      `scripts/build.mts` checks it out and puts it at `dist/whack-an-imp/`, and the card's
      thumbnail now uses the game's `images/screenshot-final.png`. Locally, `npm run build`
      also clones it into `whack-an-imp/` (gitignored), so `npm start` serves it too.
- [ ] **Jingle Smash card.** `jinglesmash-ecs/` is missing; only its thumbnail exists
      (`physics/jinglesmash.thumbnail.png`). Link to where it's hosted now, or remove the card.

## Xmas sweater beyond r137

- [ ] Optional, and large. The old node-material library is gone from three r138 on. Going
      further means rewriting the sweater material (custom GLSL `FunctionNode`s) in the new node
      system / TSL. Current three needs `WebGPURenderer` (`three/webgpu`, with a WebGL2 fallback)
      for that. It also means porting `josh_common_ecsy` (`CustomMaterialManager`,
      `ThreeObjectManager`, `threesystem`).

## Deployment

- [x] **pm2 ecosystem file.** `ecosystem.config.cjs` deploys with `npm run deploy:setup` (first
      time), then `npm run deploy`. No pm2 app runs: the deploy checks out the repo and runs
      `scripts/build.mts`, which builds the static site into `<path>/current/dist`. The same
      build runs locally with `npm run build`.
- [ ] **First pm2 deploy.** Needs, on the server: git, Node 22.6+ and pm2. Confirm the deploy
      path or set `WEBXR_DEPLOY_PATH` (default `/projects/webxr-experiments`). Then
      point the web server for apps.josh.earth/webxr-experiments at
      `<path>/current/dist`. It must follow symlinks: `current` and `dist` are both symlinks.
- [ ] **Keep the separately deployed projects reachable.** The old web root likely also holds
      `jinglesmash-ecs/` and `webxr-simgame/`, which aren't in this repo (see "Root index.html
      links" above). Pointing the site at `dist` hides them unless they're moved or aliased.
- [ ] **Retire the scp `publish` script** once the pm2 deploy is live. It only copies
      `boilerplate`, `nonogram` and `xmassweater`, and it misses `josh_common_ecsy`, which the
      sweater pages import from `../josh_common_ecsy/`.

## Tooling

- [ ] Add ESLint and Prettier.
- [ ] Add a Playwright smoke test that loads every demo page through `server.js` and fails on
      uncaught errors and missing local files. That's the check PR #18 did by hand.
- [ ] Consider moving shared code (`boilerplate`, `josh_common_ecsy`) to TypeScript, per the
      project guidelines.
