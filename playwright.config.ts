import { defineConfig } from '@playwright/test'

const PORT = 4173

// Smoke tests run against the built site (dist/), the same files production serves.
// Build it first: `npm run test:smoke` does both.
export default defineConfig({
    testDir: 'tests',
    timeout: 30_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    reporter: [['list']],
    use: {
        baseURL: `http://localhost:${PORT}`,
        // Landscape, so fixed-FOV demos keep their content in view.
        viewport: { width: 1280, height: 720 },
        // Uses the installed Google Chrome; set PLAYWRIGHT_CHANNEL=chromium to use Playwright's
        // own browser instead (after `npx playwright install chromium`).
        channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
        launchOptions: {
            // Software WebGL so three.js renders in headless mode on any machine.
            args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
        },
    },
    webServer: {
        command: 'node server.js',
        env: { SITE_ROOT: 'dist', PORT: String(PORT) },
        url: `http://localhost:${PORT}/`,
        reuseExistingServer: !process.env.CI,
    },
})
