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

## Xmas sweater beyond r137

- [ ] Optional, and large. The old node-material library is gone from three r138 on. Going
      further means rewriting the sweater material (custom GLSL `FunctionNode`s) in the new node
      system / TSL. Current three needs `WebGPURenderer` (`three/webgpu`, with a WebGL2 fallback)
      for that. It also means porting `josh_common_ecsy` (`CustomMaterialManager`,
      `ThreeObjectManager`, `threesystem`).

## Deployment

- [ ] **Publish script misses the shared library.** `npm run publish` copies `xmassweater` but
      not `josh_common_ecsy`, which the sweater pages import from `../josh_common_ecsy/`.
      Add it to the scp list, or confirm it already exists on the server.
- [ ] **pm2 ecosystem file.** The project guidelines ask for pm2 deployment with an ecosystem
      file. Today it's scp of whole folders, including `node_modules`.
- [ ] **Install before publishing.** Until the deploy changes, run `npm install` in each
      published folder (`boilerplate`, `nonogram`, `xmassweater`'s `josh_common_ecsy`) before
      `npm run publish`.

## Tooling

- [ ] Add ESLint and Prettier.
- [ ] Add a Playwright smoke test that loads every demo page through `server.js` and fails on
      uncaught errors and missing local files. That's the check PR #18 did by hand.
- [ ] Consider moving shared code (`boilerplate`, `josh_common_ecsy`) to TypeScript, per the
      project guidelines.
