import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

test.skip(
  process.env.CODELAB_LIVE_AUTH !== '1',
  'Requires the local Laravel/MySQL/Mailpit stack; creates synthetic accounts.',
)

async function mailLink(
  request: APIRequestContext,
  email: string,
  kind: 'verify' | 'reset',
) {
  let link = ''
  await expect
    .poll(
      async () => {
        const listing = await (
          await request.get(
            `http://127.0.0.1:8025/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
          )
        ).json()
        for (const message of listing.messages ?? []) {
          const detail = await (
            await request.get(
              `http://127.0.0.1:8025/api/v1/message/${message.ID}`,
            )
          ).json()
          const pattern =
            kind === 'verify'
              ? /http:\/\/127\.0\.0\.1:5173\/auth\/email\/verify\/[^\s<>"()]+/
              : /http:\/\/127\.0\.0\.1:5173\/reset-password\?[^\s<>"()]+/
          const match = (detail.Text ?? detail.HTML ?? '').match(pattern)
          if (match) {
            link = match[0].replaceAll('&amp;', '&')
            return true
          }
        }
        return false
      },
      { timeout: 15000 },
    )
    .toBeTruthy()
  return link
}
async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
}
async function resetFromLink(page: Page, link: string, password: string) {
  await page.goto(link)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page
    .getByRole('button', { name: 'Reset password', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('Password updated')
}

test('real student registration, mail verification, recovery, cookie revocation and route protection', async ({
  page,
  context,
  browser,
  request,
}) => {
  const email = `student-${Date.now()}@example.test`
  const password = 'Student-browser-pass-42'
  await page.goto('/instructor/dashboard')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('link', { name: 'Register as a student' }).click()
  await page.getByLabel('Full name').fill('Browser Student')
  await page.getByLabel('Student number').fill(`AUTH-${Date.now()}`)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: 'Create student account' }).click()
  await expect(page).toHaveURL(/\/verify-email$/)
  await expect(
    page.request
      .get('/api/v1/student/dashboard', {
        headers: { Referer: 'http://127.0.0.1:5173/' },
      })
      .then((r) => r.status()),
  ).resolves.toBe(403)
  await page.goto(await mailLink(request, email, 'verify'))
  await page.getByRole('link', { name: 'Continue to dashboard' }).click()
  await expect(
    page.getByRole('heading', { name: 'Welcome, Browser Student.' }),
  ).toBeVisible()
  await page.goto('/instructor/dashboard')
  await expect(page).toHaveURL(/\/student\/dashboard$/)
  expect(
    (
      await page.request.get('/api/v1/instructor/dashboard', {
        headers: { Referer: 'http://127.0.0.1:5173/' },
      })
    ).status(),
  ).toBe(403)
  const cookies = await context.cookies()
  const sessionCookie = cookies.find((c) => c.name.includes('session'))!
  expect(sessionCookie.httpOnly).toBe(true)
  expect(sessionCookie.sameSite).toBe('Lax')
  expect(cookies.find((c) => c.name === 'XSRF-TOKEN')?.httpOnly).toBe(false)
  const stolen = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' })
  await stolen.addCookies(cookies)
  const stalePage = await stolen.newPage()
  await stalePage.goto('/student/dashboard')
  await expect(
    stalePage.getByRole('heading', { name: 'Welcome, Browser Student.' }),
  ).toBeVisible()
  await page.goto('/forgot-password')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByRole('status')).toContainText(
    'If an eligible account exists',
  )
  await resetFromLink(
    page,
    await mailLink(request, email, 'reset'),
    'New-student-password-42',
  )
  await stalePage.reload()
  await expect(stalePage).toHaveURL(/\/login$/)
  await stolen.close()
  await signIn(page, email, 'New-student-password-42')
  await expect(page).toHaveURL(/\/student\/dashboard$/)
  const beforeLogout = await context.cookies()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)
  const replay = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' })
  await replay.addCookies(beforeLogout)
  expect(
    (
      await replay.request.get('/api/v1/me', {
        headers: { Referer: 'http://127.0.0.1:5173/' },
      })
    ).status(),
  ).toBe(401)
  await replay.close()
  expect(
    (
      await page.request.post('/auth/logout', {
        headers: { 'Sec-Fetch-Site': 'same-origin' },
      })
    ).status(),
  ).toBe(419)
})

test('operator-provisioned instructor sets password, verifies email and receives instructor access', async ({
  page,
  request,
}) => {
  const email = `instructor-${Date.now()}@example.test`
  execFileSync(
    'docker',
    [
      'compose',
      '--env-file',
      '.env',
      '-f',
      'infra/app/compose.yaml',
      'exec',
      '-T',
      'app',
      'php',
      'artisan',
      'codelab:provision-instructor',
      email,
      '--name=Browser Instructor',
    ],
    { cwd: resolve('..'), stdio: 'pipe' },
  )
  await resetFromLink(
    page,
    await mailLink(request, email, 'reset'),
    'Instructor-browser-pass-42',
  )
  await signIn(page, email, 'Instructor-browser-pass-42')
  await expect(page).toHaveURL(/\/verify-email$/)
  await page.getByRole('button', { name: 'Resend verification email' }).click()
  await page.goto(await mailLink(request, email, 'verify'))
  await page.getByRole('link', { name: 'Continue to dashboard' }).click()
  await expect(
    page.getByRole('heading', { name: 'Welcome, Browser Instructor.' }),
  ).toBeVisible()
  await page.goto('/student/dashboard')
  await expect(page).toHaveURL(/\/instructor\/dashboard$/)
  expect(
    (
      await page.request.get('/api/v1/student/dashboard', {
        headers: { Referer: 'http://127.0.0.1:5173/' },
      })
    ).status(),
  ).toBe(403)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
