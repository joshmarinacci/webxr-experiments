// Builds the static site into dist/. The web server serves that folder directly; no Node
// server runs in production. pm2 deploy runs this after each checkout (see ecosystem.config.cjs).
//
//   node --experimental-strip-types scripts/build.mts [--skip-install]
//
// Steps:
//   1. Install dependencies for every demo folder (pages load scripts from their own
//      node_modules), unless --skip-install is passed.
//   2. Check out the games that live in their own repos (EXTERNAL_GAMES), which the root
//      index.html links to.
//   3. Assemble the public files into builds/<timestamp>/ and point the dist symlink at it.
//      Swapping a symlink is atomic, so the live site never sees a half-built folder.
//
// Requires Node 22.6+ (built-in TypeScript type stripping), git and npm.

import { execFileSync } from 'node:child_process'
import {
    copyFileSync,
    existsSync,
    linkSync,
    mkdirSync,
    readdirSync,
    realpathSync,
    renameSync,
    rmSync,
    statSync,
    symlinkSync,
} from 'node:fs'
import path from 'node:path'

interface ExternalGame {
    // Folder name in the site, matching the root index.html link.
    name: string
    repo: string
    // Pinned so a deploy always serves the same version.
    commit: string
    // Run npm ci in the checkout; set for games that load from their own node_modules.
    install: boolean
}

const EXTERNAL_GAMES: ExternalGame[] = [
    {
        name: 'whack-an-imp',
        repo: 'https://github.com/joshmarinacci/whack-an-imp.git',
        commit: 'f20ff583ccf4195420406cc05bf8f596f3bedd60', // last commit, 2018
        install: false,
    },
    {
        name: 'jinglesmash-ecs',
        repo: 'https://github.com/joshmarinacci/jinglesmash-ecs.git',
        commit: 'a49ab6a13875d5d4ca970a7b63cc3715405b58e5', // bundled level data (jinglesmash-ecs PR #3)
        install: true,
    },
]
const KEEP_OLD_BUILDS = 1

const root = realpathSync(path.resolve(import.meta.dirname, '..'))
const buildsDir = path.join(root, 'builds')
const distLink = path.join(root, 'dist')

// Top-level entries that are tooling or docs, not part of the site.
const EXCLUDED_AT_ROOT = new Set([
    'builds',
    'dist',
    'node_modules', // express, only used by the local dev server
    'scripts',
    'server.js',
    'ecosystem.config.cjs',
    'package.json',
    'package-lock.json',
    'MAINTENANCE_CHECKLIST.md',
    // copied separately from their own checkouts
    ...EXTERNAL_GAMES.map((game) => game.name),
])

function log(message: string): void {
    console.log(`[build] ${message}`)
}

function run(cmd: string, args: string[], cwd: string): void {
    log(`${path.relative(root, cwd) || '.'}: ${cmd} ${args.join(' ')}`)
    execFileSync(cmd, args, { cwd, stdio: 'inherit' })
}

// Folders with a package.json, up to two levels deep (e.g. voxeltest/test3).
function findPackageDirs(dir: string, depth: number): string[] {
    const found: string[] = []
    if (dir !== root && existsSync(path.join(dir, 'package.json'))) found.push(dir)
    if (depth === 0) return found
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue
        if (entry.name === 'node_modules' || EXCLUDED_AT_ROOT.has(entry.name)) continue
        found.push(...findPackageDirs(path.join(dir, entry.name), depth - 1))
    }
    return found
}

function installPackage(dir: string): void {
    const common = ['--omit=dev', '--no-audit', '--no-fund']
    if (existsSync(path.join(dir, 'package-lock.json'))) {
        run('npm', ['ci', ...common], dir)
    } else {
        // No lock file to install from; don't create one here.
        run('npm', ['install', '--no-package-lock', ...common], dir)
    }
}

function installDependencies(): void {
    for (const dir of findPackageDirs(root, 2)) installPackage(dir)
}

// Under pm2 deploy, root is <path>/source and <path>/shared survives between deploys, so the
// checkouts live there. Run locally, they go in ./<name> (gitignored), which also lets the
// local dev server (npm start) serve them.
function checkoutGame(game: ExternalGame, install: boolean): string {
    const sharedDir = path.resolve(root, '..', 'shared')
    const checkout = existsSync(sharedDir) ? path.join(sharedDir, game.name) : path.join(root, game.name)
    if (!existsSync(path.join(checkout, '.git'))) {
        run('git', ['clone', '--quiet', game.repo, checkout], root)
    }
    run('git', ['fetch', '--quiet', 'origin'], checkout)
    run('git', ['checkout', '--quiet', '--force', game.commit], checkout)
    if (game.install && (install || !existsSync(path.join(checkout, 'node_modules')))) {
        installPackage(checkout)
    }
    return checkout
}

// Recreates src under dest using hard links, so a build doesn't duplicate the ~400 MB of
// node_modules. git and npm replace files rather than editing them in place, so later
// checkouts and installs never change files inside an existing build. Falls back to copying
// when hard links aren't possible (e.g. across filesystems). Dotfiles are skipped, matching
// what server.js serves.
function linkTree(src: string, dest: string, exclude: Set<string> = new Set()): number {
    let files = 0
    mkdirSync(dest, { recursive: true })
    for (const entry of readdirSync(src, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || exclude.has(entry.name)) continue
        const from = path.join(src, entry.name)
        const to = path.join(dest, entry.name)
        const stats = statSync(from) // follows symlinks
        if (stats.isDirectory()) {
            files += linkTree(from, to)
        } else if (stats.isFile()) {
            try {
                linkSync(from, to)
            } catch {
                copyFileSync(from, to)
            }
            files++
        }
    }
    return files
}

function assembleBuild(games: Map<string, string>): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const buildDir = path.join(buildsDir, stamp)
    let files = linkTree(root, buildDir, EXCLUDED_AT_ROOT)
    for (const [name, checkout] of games) files += linkTree(checkout, path.join(buildDir, name))
    log(`assembled ${files} files in ${path.relative(root, buildDir)}`)
    return buildDir
}

function activate(buildDir: string): void {
    const tmpLink = `${distLink}.tmp`
    rmSync(tmpLink, { force: true })
    symlinkSync(path.relative(root, buildDir), tmpLink, 'dir')
    renameSync(tmpLink, distLink) // atomic replace of the old symlink
    log(`dist -> ${path.relative(root, buildDir)}`)

    const old = readdirSync(buildsDir)
        .filter((name) => path.join(buildsDir, name) !== buildDir)
        .sort()
    for (const name of old.slice(0, Math.max(0, old.length - KEEP_OLD_BUILDS))) {
        rmSync(path.join(buildsDir, name), { recursive: true, force: true })
        log(`removed old build ${name}`)
    }
}

const install = !process.argv.includes('--skip-install')
if (install) installDependencies()
const games = new Map(EXTERNAL_GAMES.map((game) => [game.name, checkoutGame(game, install)]))
activate(assembleBuild(games))
log('done')
