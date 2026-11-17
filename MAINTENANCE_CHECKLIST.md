# Maintenance checklist

Remaining fixes found during the November 2026 Dependabot cleanup (PR #18). Everything
here was already broken or missing on `master` before that work.

## Dependencies

- [x] **particles: replace the stale lock file.** Regenerated; it now pins three 0.125.2.

## Broken demos

- [x] **Dead CDN imports.** `oceantest/`, `squishinate/` and the `josh_common_ecsy` test pages
      now load three (and its r125 `examples/jsm/nodes`) from `josh_common_ecsy/node_modules`
      and ecsy from the pinned jsDelivr `ecsy@0.2.1`, the same setup as xmassweater. All nine
      pages load without errors.
  - [ ] `josh_common_ecsy/aframe_environment.js` still has ~60 references to a global `THREE`
        that is never defined (leftover A-Frame code, including `THREE.Geometry`). Its test
        page loads, but those code paths would throw if reached. Remove or port them.
  - [ ] `squishinate` loads without errors but only shows a few line segments; check whether
        that's its intended idle state.
- [x] **walls.** Vendored ported boilerplate files into `walls/webxr-boilerplate/`, switched to
      r125's GLTFLoader, load `wall1.gltf` (the page asked for a `.glb` that never existed),
      and dropped the npm `webxr-boilerplate` dependency.
- [x] **hextest/3dgame.** Button positions are now component data (`Button3D.x`) applied when
      the mesh is created, instead of a `setTimeout(100)` race.
- [x] **particles/position_particles.** Fixed the `./PS2` import (missing `.js`).
- [x] **particles/testor.** Two bugs: it passed seconds to `update()` (which takes
      milliseconds) and a hex number as `color` (`spawnParticle` copies a `THREE.Color`, so the
      color became NaN/black). It now shows a particle trail. The local `GPUParticleSystem`
      ignores the original example's randomness/turbulence options, so the trail is thin.
- [x] **Missing assets.** `cat.jpg` references point at `boilerplate/cat.jpg`; the canvas2vr
      music path has its `.mp3` extension; the snow pages use `snowflake.png` instead of the
      never-committed `tex/test1.png`.

## Root index.html links

- [x] **2D / 3D Sim Game cards.** Removed from the index page.
- [x] **Whack an Imp card.** The game lives in
      [joshmarinacci/whack-an-imp](https://github.com/joshmarinacci/whack-an-imp).
      `scripts/build.mts` checks it out and puts it at `dist/whack-an-imp/`, and the card's
      thumbnail now uses the game's `images/screenshot-final.png`.
- [x] **Jingle Smash card.** The game lives in
      [joshmarinacci/jinglesmash-ecs](https://github.com/joshmarinacci/jinglesmash-ecs); the
      build checks it out (pinned), runs `npm ci` in it, and puts it at `dist/jinglesmash-ecs/`.
  - [x] Its levels used to load from `https://vr.josh.earth/360/doc/<id>`, which is gone.
        jinglesmash-ecs PR #3 bundles them in `levels/`, and the build pins that commit.
- [ ] **Other pages still using the vr.josh.earth doc store.** `physics/player.html` (older
      tumble player) could load the same level JSON locally. `physics/editor.html` (level
      editor) and `voxeltest/test3/PersistenceManager.js` (voxel world saves) need a writable
      server, so they stay broken until one exists.
- [ ] **Back up `general-editor/docs/`.** That repo gitignores it, so its 258 documents (360
      editor docs, tumble levels, voxel saves) exist only in `~/portfolio-new/webxr/general-editor`.

Locally, `npm run build` clones the external games into `whack-an-imp/` and `jinglesmash-ecs/`
(gitignored), so `npm start` serves them too.

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
- [x] **First pm2 deploy.** Live at `/projects/webxr-experiments`, with
      `/sites/apps.josh.earth/webxr-experiments` linked to `current/dist`.
- [x] **Retire the scp `publish` script.** Removed from `package.json`.

## Tooling

- [ ] Add ESLint and Prettier.
- [ ] Add a Playwright smoke test that runs `npm run build`, serves `dist/`, loads every demo
      page, and fails on uncaught errors and missing local files.
- [ ] Consider moving shared code (`boilerplate`, `josh_common_ecsy`) to TypeScript, per the
      project guidelines.
