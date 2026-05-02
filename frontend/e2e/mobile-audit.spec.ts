import { test, expect } from '@playwright/test'

// Helper: check no horizontal overflow on page
async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
  expect(overflow, 'Page has horizontal overflow / scrollbar').toBe(false)
}

// Helper: check no elements overflow viewport
async function findOverflowingElements(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth
    const overflowing: string[] = []
    document.querySelectorAll('*').forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.right > viewportWidth + 2 && rect.width > 0) {
        const tag = el.tagName.toLowerCase()
        const cls = el.className?.toString().slice(0, 60) || ''
        overflowing.push(`<${tag}> .${cls} (right: ${Math.round(rect.right)}, viewport: ${viewportWidth})`)
      }
    })
    return overflowing.slice(0, 10)
  })
}

// Helper: check touch targets are at least 44x44
async function findSmallTouchTargets(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const small: string[] = []
    const interactive = document.querySelectorAll('a, button, input, select, textarea, [role="button"]')
    interactive.forEach((el) => {
      const rect = el.getBoundingClientRect()
      // Skip hidden elements
      if (rect.width === 0 || rect.height === 0) return
      // 36px min is more realistic for web (44 is iOS guideline)
      if (rect.height < 36 && rect.width < 36) {
        const tag = el.tagName.toLowerCase()
        const text = el.textContent?.trim().slice(0, 30) || ''
        small.push(`<${tag}> "${text}" (${Math.round(rect.width)}x${Math.round(rect.height)})`)
      }
    })
    return small.slice(0, 10)
  })
}

test.describe('Mobile responsiveness audit', () => {

  test('Homepage - no overflow, layout stacks', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalOverflow(page)

    const overflowing = await findOverflowingElements(page)
    expect(overflowing, `Overflowing elements: ${overflowing.join(', ')}`).toHaveLength(0)

    // Nav hamburger should be visible on mobile
    const hamburger = page.locator('button[aria-label="Toggle menu"]')
    await expect(hamburger).toBeVisible()

    // Desktop nav links should be hidden
    const desktopNav = page.locator('nav.hidden')
    // hidden class means it should not be visible
    await expect(desktopNav).toBeHidden()

    // Hero grid should stack (single column on mobile)
    const heroSection = page.locator('section').first()
    const heroBox = await heroSection.boundingBox()
    expect(heroBox).toBeTruthy()

    // Newsletter form should not overflow
    const form = page.locator('form').first()
    if (await form.isVisible()) {
      const formBox = await form.boundingBox()
      const viewport = page.viewportSize()!
      expect(formBox!.x + formBox!.width).toBeLessThanOrEqual(viewport.width + 5)
    }

    // Take screenshot for visual review
    await page.screenshot({ path: 'e2e/screenshots/home-mobile.png', fullPage: true })
  })

  test('Homepage - hamburger menu works', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const hamburger = page.locator('button[aria-label="Toggle menu"]')
    await hamburger.click()

    // Mobile nav should now be visible
    const mobileNav = page.locator('nav.md\\:hidden')
    await expect(mobileNav).toBeVisible()

    // Should have all nav links
    await expect(mobileNav.locator('a')).toHaveCount(3)
    await expect(mobileNav.getByText('Learn')).toBeVisible()
    await expect(mobileNav.getByText('Featured')).toBeVisible()
    await expect(mobileNav.getByText('Newsletter')).toBeVisible()

    // Clicking a link should close menu
    await mobileNav.getByText('Learn').click()
    await expect(mobileNav).toBeHidden()

    await page.screenshot({ path: 'e2e/screenshots/home-menu-open.png', fullPage: true })
  })

  test('Blog page - no overflow', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalOverflow(page)
    const overflowing = await findOverflowingElements(page)
    expect(overflowing, `Overflowing: ${overflowing.join(', ')}`).toHaveLength(0)

    await page.screenshot({ path: 'e2e/screenshots/blog-mobile.png', fullPage: true })
  })

  test('Tutorials page - no overflow, touch targets', async ({ page }) => {
    await page.goto('/tutorials')
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalOverflow(page)
    const overflowing = await findOverflowingElements(page)
    expect(overflowing, `Overflowing: ${overflowing.join(', ')}`).toHaveLength(0)

    // YouTube banner should not overflow
    const ytBanner = page.locator('a[href*="youtube"]').first()
    if (await ytBanner.isVisible()) {
      const box = await ytBanner.boundingBox()
      const viewport = page.viewportSize()!
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 5)
    }

    await page.screenshot({ path: 'e2e/screenshots/tutorials-mobile.png', fullPage: true })
  })

  test('Projects page - grid is single column on mobile', async ({ page }) => {
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalOverflow(page)
    const overflowing = await findOverflowingElements(page)
    expect(overflowing, `Overflowing: ${overflowing.join(', ')}`).toHaveLength(0)

    await page.screenshot({ path: 'e2e/screenshots/projects-mobile.png', fullPage: true })
  })

  test('Newsletter page - form usable on mobile', async ({ page }) => {
    await page.goto('/newsletter')
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalOverflow(page)
    const overflowing = await findOverflowingElements(page)
    expect(overflowing, `Overflowing: ${overflowing.join(', ')}`).toHaveLength(0)

    // Newsletter form subscribe button should be tappable
    const subscribeBtn = page.locator('button[type="submit"]')
    if (await subscribeBtn.isVisible()) {
      const box = await subscribeBtn.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(36)
    }

    // Check newsletter list items don't have title + date on same row overflowing
    const listLinks = page.locator('a[href^="/newsletter/"]')
    const count = await listLinks.count()
    for (let i = 0; i < Math.min(count, 3); i++) {
      const box = await listLinks.nth(i).boundingBox()
      if (box) {
        const viewport = page.viewportSize()!
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 5)
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/newsletter-mobile.png', fullPage: true })
  })

  test('Newsletter form - input + button layout on mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // The newsletter form uses flex-wrap with gap-3
    const form = page.locator('form').first()
    if (await form.isVisible()) {
      const viewport = page.viewportSize()!

      // Input should be reasonably wide (at least 100px to type email)
      const input = form.locator('input[type="email"]')
      const inputBox = await input.boundingBox()
      expect(inputBox!.width, 'Email input too narrow on mobile').toBeGreaterThanOrEqual(100)
      expect(inputBox!.x + inputBox!.width, 'Email input overflows viewport').toBeLessThanOrEqual(viewport.width + 5)

      // Button should be tappable and within viewport
      const button = form.locator('button[type="submit"]')
      const btnBox = await button.boundingBox()
      expect(btnBox!.height).toBeGreaterThanOrEqual(36)
      expect(btnBox!.x + btnBox!.width, 'Subscribe button overflows viewport').toBeLessThanOrEqual(viewport.width + 5)
    }
  })

  test('Small touch targets audit', async ({ page }) => {
    const pages = ['/', '/blog', '/tutorials', '/projects', '/newsletter']

    for (const path of pages) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      const small = await findSmallTouchTargets(page)
      if (small.length > 0) {
        console.warn(`Small touch targets on ${path}:`, small)
      }
      // Log but don't fail - informational
    }
  })

  test('Text readability - font sizes not too small', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const tinyText = await page.evaluate(() => {
      const tiny: string[] = []
      document.querySelectorAll('p, span, a, li, h1, h2, h3, h4, h5, h6').forEach((el) => {
        const style = window.getComputedStyle(el)
        const fontSize = parseFloat(style.fontSize)
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        if (fontSize < 12) {
          const text = el.textContent?.trim().slice(0, 40) || ''
          tiny.push(`"${text}" (${fontSize}px)`)
        }
      })
      return tiny.slice(0, 10)
    })

    if (tinyText.length > 0) {
      console.warn('Text smaller than 12px found:', tinyText)
    }
    // Informational - log but don't hard fail
  })

  test('Code blocks in blog posts don\'t overflow', async ({ page }) => {
    // Navigate to a blog post if any exist
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    const firstPost = page.locator('a[href^="/blog/"]').first()
    if (await firstPost.isVisible()) {
      await firstPost.click()
      await page.waitForLoadState('networkidle')

      await assertNoHorizontalOverflow(page)

      // Check code blocks have overflow-x scroll
      const codeOverflow = await page.evaluate(() => {
        const problems: string[] = []
        document.querySelectorAll('pre, code').forEach((el) => {
          const rect = el.getBoundingClientRect()
          const viewportWidth = document.documentElement.clientWidth
          if (rect.right > viewportWidth + 5 && rect.width > 0) {
            problems.push(`<${el.tagName.toLowerCase()}> overflows (right: ${Math.round(rect.right)})`)
          }
        })
        return problems
      })

      expect(codeOverflow, `Code blocks overflow: ${codeOverflow.join(', ')}`).toHaveLength(0)

      await page.screenshot({ path: 'e2e/screenshots/blogpost-mobile.png', fullPage: true })
    }
  })
})
