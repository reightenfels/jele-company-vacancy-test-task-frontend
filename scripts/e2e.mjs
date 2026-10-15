import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..')

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173/'
const CHROME_PATH = process.env.CHROME_PATH ?? '/usr/bin/google-chrome'
const OUTPUT_DIR = process.env.OUTPUT_DIR ?? resolve(projectRoot, 'artifacts')

const email = `e2e${Date.now()}@example.com`
const password = 'secret123'
const gender = 'male'

const screenshotsDir = resolve(OUTPUT_DIR, 'screenshots')
mkdirSync(screenshotsDir, { recursive: true })

const lines = []
const log = (line) => {
  lines.push(line)
  process.stdout.write(`${line}\n`)
}

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1280,900'],
  defaultViewport: { width: 1280, height: 900 },
})

try {
  const page = await browser.newPage()

  await page.evaluateOnNewDocument(() => {
    window.__consoleLogs = []
    const originalLog = console.log.bind(console)
    console.log = (...args) => {
      window.__consoleLogs.push(
        args
          .map((argument) => {
            try {
              return typeof argument === 'string' ? argument : JSON.stringify(argument)
            } catch {
              return String(argument)
            }
          })
          .join(' '),
      )
      originalLog(...args)
    }
  })

  page.on('pageerror', (error) => log(`[browser:error] ${error.message}`))

  log(`# Navigating to ${FRONTEND_URL}`)
  await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' })
  await page.waitForSelector('#email')

  log(`# Typing credentials for ${email}`)
  await page.type('#email', email)
  await page.type('#password', password)

  const hiddenType = await page.$eval('#password', (element) => element.type)
  await page.click('.field__toggle')
  const shownType = await page.$eval('#password', (element) => element.type)
  await page.click('.field__toggle')
  const hiddenAgainType = await page.$eval('#password', (element) => element.type)
  log(`# Password visibility toggle: ${hiddenType} -> ${shownType} -> ${hiddenAgainType}`)

  await page.select('#gender', gender)
  log(`# Selected gender: ${gender}`)

  await page.screenshot({ path: resolve(screenshotsDir, '01-registration-form.png') })
  log('# Saved screenshots/01-registration-form.png')

  log('# Clicking "Register"')
  await Promise.all([
    page.waitForFunction(() => window.location.pathname === '/profile', { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ])

  await page.waitForFunction(() => document.querySelector('.profile') !== null, { timeout: 20000 })

  const profile = await page.evaluate(() => {
    const data = {}
    document.querySelectorAll('.profile dt').forEach((term) => {
      data[term.textContent.trim()] = term.nextElementSibling?.textContent.trim()
    })

    return data
  })

  await page.screenshot({ path: resolve(screenshotsDir, '02-profile-page.png') })
  log('# Saved screenshots/02-profile-page.png')

  log('# Profile rendered on the page:')
  log(JSON.stringify(profile, null, 2))

  const consoleLogs = await page.evaluate(() => window.__consoleLogs)

  log('')
  log('# Browser console output:')
  consoleLogs.forEach((entry) => log(entry))

  writeFileSync(resolve(OUTPUT_DIR, 'console.log'), `${lines.join('\n')}\n`)

  log('')
  log(`# Artifacts written to ${OUTPUT_DIR}`)
} finally {
  await browser.close()
}
