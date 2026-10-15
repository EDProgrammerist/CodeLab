import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const CLASSROOM = {
  id: "1",
  title: "Programming laboratory",
  course_code: "CC101",
  section_label: "1-A",
  academic_year_start: 2026,
  academic_year_end: 2027,
  semester: "First",
  term_end_date: "2027-06-30",
  timezone: "Asia/Manila",
  status: "active",
  schedules: [
    {
      class_session: "lab",
      day_of_week: 1,
      starts_at: "09:00:00",
      ends_at: "10:00:00",
    },
  ],
};
const ACTIVITY = {
  id: "1",
  classroom_id: "1",
  language_id: "1",
  title: "Sum of two integers",
  instructions: "Read two integers and print their sum.",
  grading_period: "prelim",
  class_session: "lab",
  activity_type: "assignment",
  max_points: "100.00",
  submission_limit: 5,
  deadline_at: "2027-01-01T00:00:00Z",
  timezone: "Asia/Manila",
  status: "published",
  published_at: "2026-10-13T00:00:00Z",
  language: { id: "1", display_name: "Java 21", runtime_version: "21" },
  allocation_status: "assigned",
  grading_policy: "Equal points per test.",
  execution_available: false,
  can_submit: true,
  test_suite_locked_at: "2026-10-13T00:00:00Z",
  tests: [
    {
      position: 1,
      visibility: "public",
      stdin: "2 3",
      expected_stdout: "5",
      explanation: "",
    },
    {
      position: 2,
      visibility: "hidden",
      stdin: "-1 1",
      expected_stdout: "0",
      explanation: "",
    },
  ],
  public_examples: [
    { position: 1, stdin: "2 3", expected_stdout: "5", explanation: "" },
  ],
};
const META = { current_page: 1, last_page: 1, total: 1 };
const EVALUATION = { id: '1', state: 'reviewed', attempt_number: 1, accepted_at: '2026-10-14T00:00:00Z', source_code: 'public class Main {}', student_name: 'Alex Rivera', feedback: { body: 'Explain your loop boundary.', updated_at: '2026-10-14T00:00:00Z' } };
const REPORT = { classroom: CLASSROOM, generated_at: '2026-10-14T00:00:00Z', activities: [{ id: '1', title: ACTIVITY.title, max_points: '100.00', status: 'published' }], rows: [{ membership_id: '1', name: 'Alex Rivera', email: 'alex@example.test', membership_status: 'active', earned: '50.00', possible: '100.00', percentage: 50, provisional: true, cells: [{ activity_id: '1', state: 'completed', score: '50.00', best_submission_id: '1', attempts_used: 1, evaluation_failed: false, in_flight: false, closed: false, last_submission_at: '2026-10-14T00:00:00Z' }] }] };
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/languages", (route) =>
    route.fulfill({ json: { data: [ACTIVITY.language] } }),
  );
  await page.route("**/api/v1/classrooms**", (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/submissions')) return route.fulfill({ json: { data: [EVALUATION], meta: META } });
    if (pathname.endsWith('/submissions/1')) return route.fulfill({ json: { data: EVALUATION } });
    if (pathname.endsWith('/results')) return route.fulfill({ json: { data: new URL(route.request().url()).searchParams.get('grading_period') === 'final' ? { ...REPORT, activities: [], rows: [] } : REPORT } });
    const data = /activities\/1$/.test(pathname)
      ? ACTIVITY
      : pathname.endsWith("/activities")
        ? [ACTIVITY]
        : pathname.endsWith("/classrooms")
          ? [CLASSROOM]
          : CLASSROOM;
    return route.fulfill({
      json: { data, ...(Array.isArray(data) && { meta: META }) },
    });
  });
  await page.route("**/api/v1/*/dashboard", (route) => route.fulfill({ json: { data: { id: "1", name: "Preview Account", email: "preview@example.test", role: new URL(route.request().url()).pathname.includes("instructor") ? "instructor" : "student" } } }));
  await page.route("**/api/v1/me", async (route) => {
    const pathname = new URL(page.url()).pathname;
    if (pathname === "/" || pathname === "/login")
      return route.fulfill({
        status: 401,
        json: { message: "Unauthenticated." },
      });
    return route.fulfill({
      json: {
        data: {
          id: "1",
          name: "Preview Account",
          email: "preview@example.test",
          role: pathname.startsWith("/instructor") ? "instructor" : "student",
          student_number: null,
          email_verified_at: "2026-10-13T00:00:00Z",
        },
      },
    });
  });
});

const ROUTES = [
  "/",
  "/student/dashboard",
  "/instructor/dashboard",
  "/student/classrooms",
  "/student/classrooms/1",
  "/student/activities/sum",
  "/student/classrooms/1/activities/1",
  "/instructor/classrooms/1/activities/new",
  "/instructor/gradebook",
  "/student/progress",
];
for (const width of [360, 768, 1366]) {
  test(`screens are accessible and fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(
        page.locator("h1:visible, h2:visible").first(),
      ).toBeVisible();
      if (route === "/student/classrooms/1/activities/1")
        await expect(page.locator(".monaco-editor").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBeTruthy();
      if (width === 360 && route.endsWith("/classrooms/1")) {
        const title = await page
          .locator(".domain-activity-row h3")
          .first()
          .boundingBox();
        expect(title?.width).toBeGreaterThan(180);
      }
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        audit.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
      await page.screenshot({
        path: `test-results/screens/${width}-${route.replaceAll("/", "-") || "login"}.png`,
        fullPage: true,
      });
    }
  });
}
test("classroom loading, retry, empty state, joining and keyboard focus", async ({
  page,
}) => {
  let state = "error";
  await page.route("**/api/v1/classrooms?*", async (route) => {
    if (state === "error")
      return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    return route.fulfill({
      json: { data: state === "empty" ? [] : [CLASSROOM], meta: META },
    });
  });
  await page.route("**/sanctum/csrf-cookie", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.route("**/api/v1/classroom-joins", (route) =>
    route.fulfill({ status: 201, json: { data: { classroom_id: "1" } } }),
  );
  await page.goto("/student/classrooms");
  await expect(
    page.getByRole("heading", { name: "Your classrooms" }),
  ).toBeVisible();
  await expect(page.locator("main")).toBeFocused();
  await expect(page.getByRole("alert")).toContainText("Could not load");
  state = "empty";
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "Nothing here yet" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Join classroom" }).click();
  await page.getByLabel("Invitation code").fill("SYNTHETIC-CODE");
  await page.getByRole("button", { name: "Join", exact: true }).click();
  await expect(page).toHaveURL(/student\/classrooms\/1$/);
  await page.getByLabel("Grading period").focus();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.activeElement!).outlineStyle,
    ),
  ).not.toBe("none");
});
test('legacy simulated grading page is retired', async ({ page }) => {
 await page.goto('/student/activities/sum');
 await expect(page.getByRole('heading', { name: 'Choose a classroom activity' })).toBeVisible();
 await expect(page.getByRole('button', { name: /Preview graded|Submit for grading/ })).toHaveCount(0);
});
test("instructor draft controls and live gradebook filters", async ({ page }) => {
  await page.goto("/instructor/classrooms/1/activities/new");
  await page.getByRole("button", { name: "Add example" }).click();
  await expect(page.getByRole("group", { name: "Example 3" })).toBeVisible();
  await page.goto("/instructor/classrooms/1/activities/1");
  await expect(
    page.getByRole("heading", { name: "Published brief" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add example" })).toBeDisabled();
  await page.goto("/instructor/gradebook");
  await page.getByRole('combobox', { name: 'Classroom', exact: true }).selectOption('1');
  await expect(page.getByText('1 completed / 0 pending / 0 missed', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Grading period' }).selectOption('final');
  await expect(page.getByText('No published activities match these filters.')).toBeVisible();
});

test('real activity editor stays usable with execution disabled and shows saved feedback', async ({ page }) => {
 await page.setViewportSize({ width: 390, height: 844 });
 await page.goto('/student/classrooms/1/activities/1');
 await expect(page.getByRole('heading', { name: 'Code workspace' })).toBeVisible();
 await page.getByLabel('Use plain text editor').check();
 await page.getByRole('textbox', { name: 'Java source code' }).fill('public class Main { /* my draft */ }');
 await expect(page.getByRole('button', { name: 'Run Java (coming later)', exact: true })).toBeDisabled();
 await expect(page.getByRole('button', { name: 'Submit code' })).toBeEnabled();
 await page.getByRole('button', { name: 'View submission 1' }).click();
 await expect(page.getByText('Explain your loop boundary.')).toBeVisible();
 await expect(page.getByRole('button', { name: 'Save feedback' })).toHaveCount(0);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
 const audit = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect(audit.violations).toEqual([]);
 await page.screenshot({ path: 'test-results/screens/assessment-mobile.png', fullPage: true });
});

test('instructor saves feedback through API and views the report without exports', async ({ page }) => {
 await page.route('**/sanctum/csrf-cookie', route => route.fulfill({ status: 204 }));
 let body = '';
 await page.route('**/submissions/1/feedback', route => { body = route.request().postDataJSON().body; return route.fulfill({ json: { message: 'Feedback saved.' } }); });
 await page.goto('/instructor/classrooms/1/activities/1');
 await page.getByRole('button', { name: 'View submission 1' }).click();
 await page.getByRole('textbox', { name: 'Comments and explanation' }).fill('Use a clearer variable name.');
 await page.getByRole('button', { name: 'Save feedback' }).click();
 await expect(page.getByRole('status').filter({ hasText: 'Feedback saved.' })).toBeVisible();
 expect(body).toBe('Use a clearer variable name.');
 await page.goto('/instructor/gradebook');
 await page.getByRole('combobox', { name: 'Classroom', exact: true }).selectOption('1');
 await expect(page.getByRole('button', { name: /Download CSV|Download Excel/ })).toHaveCount(0);
 await page.setViewportSize({ width: 390, height: 844 });
 const audit = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 expect(audit.violations).toEqual([]);
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
 await page.screenshot({ path: 'test-results/screens/gradebook-mobile.png', fullPage: true });
});

test('submission retries retain the request key and receive immediate confirmation', async ({ page }) => {
 await page.route('**/api/v1/classrooms/1/activities/1', route => route.fulfill({ json: { data: { ...ACTIVITY, execution_available: false, can_run: false, can_submit: true, attempts_used: 0 } } }));
 await page.route('**/sanctum/csrf-cookie', route => route.fulfill({ status: 204 }));
 const keys: string[] = [];
 await page.route('**/api/v1/classrooms/1/activities/1/submissions', route => {
  if (route.request().method() !== 'POST') return route.fallback();
  keys.push(route.request().headers()['idempotency-key']);
  expect(route.request().postDataJSON().source_code).toContain('class Main');
  if (keys.length === 1) return route.abort('failed');
  return route.fulfill({ status: 201, json: { data: { ...EVALUATION, state: 'submitted', feedback: null } } });
 });
 await page.goto('/student/classrooms/1/activities/1');
 await page.getByRole('button', { name: 'Submit code' }).click();
 await expect(page.getByRole('alert')).toContainText('Retry unchanged code');
 await page.getByRole('button', { name: 'Submit code' }).click();
 await expect(page.getByText('Code submitted for instructor review.', { exact: true })).toBeVisible();
 expect(keys).toHaveLength(2); expect(keys[0]).toBeTruthy(); expect(keys[0]).toBe(keys[1]);
});
