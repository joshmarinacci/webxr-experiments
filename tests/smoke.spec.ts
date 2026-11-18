// Smoke test for the built site: the index page and every page it links to must load
// without uncaught errors, console errors, or missing same-origin files.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

// Playwright runs from the repo root (where playwright.config.ts lives).
const distIndex = path.resolve(process.cwd(), 'dist', 'index.html')

// Requests browsers make on their own; a missing one isn't a broken page.
const IGNORED_PATHS = new Set(['/favicon.ico'])

// How long to let a page run after load, so models, textures, audio and the first frames
// get a chance to request their files and throw.
const SETTLE_MS = 3_000

function readIndexHtml(): string {
    if (!existsSync(distIndex)) {
        throw new Error(`${distIndex} not found. Run \`npm run build\` (or \`npm run test:smoke\`) first.`)
    }
    return readFileSync(distIndex, 'utf8')
}

function localAttrs(html: string, attr: 'href' | 'src'): string[] {
    const values = [...html.matchAll(new RegExp(`\\b${attr}\\s*=\\s*["']([^"'#]+)["']`, 'g'))]
        .map((match) => match[1])
        .filter((value) => !/^(?:[a-z]+:|\/\/)/i.test(value)) // skip http:, mailto:, //host
    return [...new Set(values)]
}

const indexHtml = readIndexHtml()
// Links to pages (not stylesheets), as they appear in the index.
const pageLinks = localAttrs(indexHtml.replace(/<link\b[^>]*>/gi, ''), 'href')
const imageSources = localAttrs(indexHtml, 'src')

interface PageProblems {
    errors: string[]
}

// Records uncaught exceptions, console errors and failed same-origin requests for a page.
function watchPage(page: Page, origin: string): PageProblems {
    const problems: PageProblems = { errors: [] }
    page.on('pageerror', (error) => problems.errors.push(`uncaught: ${error.message}`))
    page.on('console', (message) => {
        // 404s also log "Failed to load resource"; those are reported with their URL below.
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
            problems.errors.push(`console: ${message.text()}`)
        }
    })
    page.on('response', (response) => {
        const url = new URL(response.url())
        if (url.origin === origin && !IGNORED_PATHS.has(url.pathname) && response.status() >= 400) {
            problems.errors.push(`${response.status()} ${url.pathname}`)
        }
    })
    page.on('requestfailed', (request) => {
        const url = new URL(request.url())
        const reason = request.failure()?.errorText ?? ''
        // Media elements abort range requests as a normal part of buffering.
        if (url.origin === origin && reason !== 'net::ERR_ABORTED') {
            problems.errors.push(`failed: ${url.pathname} (${reason})`)
        }
    })
    return problems
}

test('index links and thumbnails all exist', async ({ request }) => {
    expect(pageLinks.length, 'expected the index to link to some pages').toBeGreaterThan(0)
    const missing: string[] = []
    for (const target of [...pageLinks, ...imageSources]) {
        const response = await request.get(`/${target}`)
        if (response.status() !== 200) missing.push(`${response.status()} ${target}`)
    }
    expect(missing).toEqual([])
})

test('index page loads cleanly', async ({ page, baseURL }) => {
    const problems = watchPage(page, new URL(baseURL!).origin)
    await page.goto('/')
    await page.waitForLoadState('load')
    expect(problems.errors).toEqual([])
})

// The games that live in other repos are pulled in by scripts/build.mts. Jingle Smash only
// fetches its level data after you start playing, so check those files directly.
test('external games include their data files', async ({ request }) => {
    for (const file of [
        'whack-an-imp/step7.html',
        'jinglesmash-ecs/index.html',
        'jinglesmash-ecs/levels/tumble_level1.json',
    ]) {
        expect((await request.get(`/${file}`)).status(), file).toBe(200)
    }
})

// Pages that are live but not linked from the index, so the link scan above misses them.
const UNLINKED_PAGES = ['xmassweater/editor.html']

for (const link of [...pageLinks, ...UNLINKED_PAGES]) {
    test(`page loads cleanly: ${link}`, async ({ page, baseURL }) => {
        const problems = watchPage(page, new URL(baseURL!).origin)
        await page.goto(`/${link}`)
        await page.waitForLoadState('load')
        await page.waitForTimeout(SETTLE_MS)
        expect(problems.errors).toEqual([])
    })
}

// The sweater editor keeps the whole design in the URL. Drawing a pixel should update the
// URL, and opening that URL should draw the pixel again once the model has loaded.
test('xmas sweater editor round-trips a design through the share URL', async ({ page, baseURL }) => {
    const problems = watchPage(page, new URL(baseURL!).origin)
    const model = page.waitForResponse((response) => response.url().endsWith('/sweater1.glb'))
    await page.goto('/xmassweater/editor.html')
    expect((await model).status()).toBe(200)

    // The editor canvas is 320px for a 32x32 grid, so each design pixel is 10px wide.
    const canvas = page.locator('#canvas')
    await page.locator('#buttons button').first().click() // black, palette index 0
    await canvas.click({ position: { x: 55, y: 55 } }) // grid cell (5, 5)
    await expect(page).toHaveURL(/[?&]data=data:image\/png/)

    const pixelAt = (x: number, y: number) =>
        page.evaluate(
            ([px, py]) => {
                const element = document.querySelector<HTMLCanvasElement>('#canvas')!
                return [...element.getContext('2d')!.getImageData(px, py, 1, 1).data.slice(0, 3)]
            },
            [x, y],
        )
    expect(await pixelAt(55, 55)).toEqual([16, 16, 16]) // PALETTE[0] is #101010

    await page.reload()
    await page.waitForFunction(() => (window as unknown as { finished?: boolean }).finished === true)
    expect(await pixelAt(55, 55)).toEqual([16, 16, 16])
    expect(await pixelAt(155, 155)).not.toEqual([16, 16, 16]) // untouched cell stays red
    expect(problems.errors).toEqual([])
})
