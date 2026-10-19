import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
test.skip(
  process.env.CODELAB_LIVE_CLASSROOMS !== "1",
  "Requires local MySQL/Mailpit and creates synthetic records.",
);
async function mailLink(
  request: APIRequestContext,
  email: string,
  kind: "verify" | "reset",
) {
  let link = "";
  await expect
    .poll(
      async () => {
        const listing = await (
          await request.get(
            `http://127.0.0.1:8025/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
          )
        ).json();
        for (const message of listing.messages ?? []) {
          const detail = await (
            await request.get(
              `http://127.0.0.1:8025/api/v1/message/${message.ID}`,
            )
          ).json();
          const pattern =
            kind === "verify"
              ? /http:\/\/127\.0\.0\.1:5173\/auth\/email\/verify\/[^\s<>"()]+/
              : /http:\/\/127\.0\.0\.1:5173\/reset-password\?[^\s<>"()]+/;
          const match = (detail.Text ?? detail.HTML ?? "").match(pattern);
          if (match) {
            link = match[0].replaceAll("&amp;", "&");
            return true;
          }
        }
        return false;
      },
      { timeout: 15000 },
    )
    .toBeTruthy();
  return link;
}
async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
async function resetFromLink(page: Page, link: string, password: string) {
  await page.goto(link);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page
    .getByRole("button", { name: "Reset password", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Password updated");
}

test("real classroom, invitation, assignment and mobile enrollment", async ({
  page,
  browser,
  request,
}) => {
  test.setTimeout(120000);
  const stamp = Date.now();
  const email = `classroom-instructor-${stamp}@example.test`;
  execFileSync(
    "docker",
    [
      "compose",
      "--env-file",
      ".env",
      "-f",
      "infra/app/compose.yaml",
      "exec",
      "-T",
      "app",
      "php",
      "artisan",
      "codelab:provision-instructor",
      email,
      "--name=Classroom Instructor",
    ],
    { cwd: resolve(".."), stdio: "pipe" },
  );
  await resetFromLink(
    page,
    await mailLink(request, email, "reset"),
    "Classroom-instructor-pass-42",
  );
  await signIn(page, email, "Classroom-instructor-pass-42");
  await expect(page).toHaveURL(/verify-email$/);
  await page.getByRole("button", { name: "Resend verification email" }).click();
  await page.goto(await mailLink(request, email, "verify"));
  await page.goto("/instructor/classrooms");
  await page
    .getByRole("button", { name: "Create classroom", exact: true })
    .click();
  await page.getByLabel("Section", { exact: true }).fill(`Section ${stamp}`);
  await page.getByLabel("Year level").selectOption("First");
  const year = new Date().getFullYear();
  await page.getByLabel("Academic year start").fill(String(year));
  await page.getByLabel("Academic year end").fill(String(year + 1));
  await page
    .getByRole("button", { name: "Save classroom", exact: true })
    .click();
  await page
    .getByRole("link", { name: `Section ${stamp}`, exact: true })
    .click();
  const classUrl = page.url();
  const classroomId = classUrl.split("/").at(-1)!;
  await expect(page.getByRole("heading", { name: "Weekly schedule" })).toHaveCount(0);
  await page
    .getByLabel("Invitation expiry (your device time)")
    .fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  await page.getByRole("button", { name: "Generate new code" }).click();
  await expect(page.getByLabel("New invitation code")).toBeVisible();
  const code = await page.getByLabel("New invitation code").inputValue();
  await page.getByRole("link", { name: "Create activity" }).click();
  await page.getByLabel("Title", { exact: true }).fill("Add two integers");
  await page
    .getByRole("textbox", { name: "Questions", exact: true })
    .fill("Read two integers and print their sum.");
  await page.getByLabel("Work type").selectOption("assignment");
  await page
    .getByLabel("Deadline (your device time)")
    .fill(new Date(Date.now() + 172800000).toISOString().slice(0, 16));
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/classrooms/${classroomId}/activities/[0-9]+$`),
  );
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Questions", exact: true }),
  ).toHaveValue("Read two integers and print their sum.");
  await expect(
    page.getByRole("heading", { name: "Assignment details" }),
  ).toBeVisible();
  const activityId = page.url().split("/").at(-1)!;
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.locator("main").focus();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/phase4-instructor-phone.png",
    fullPage: true,
  });
  const phone = await browser.newContext({
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const student = await phone.newPage();
  const studentEmail = `classroom-student-${stamp}@example.test`;
  await student.goto("/register");
  await student.getByLabel("Full name").fill("Classroom Student");
  await student.getByLabel("Student number").fill(`CLASS-${stamp}`);
  await student.getByLabel("Email", { exact: true }).fill(studentEmail);
  await student
    .getByLabel("Password", { exact: true })
    .fill("Classroom-student-pass-42");
  await student
    .getByLabel("Confirm password")
    .fill("Classroom-student-pass-42");
  await student.getByRole("button", { name: "Create student account" }).click();
  await expect(student).toHaveURL(/verify-email$/);
  await student.goto(await mailLink(request, studentEmail, "verify"));
  await student.goto("/student/classrooms");
  await student.getByRole("button", { name: "Join classroom" }).click();
  await student.getByLabel("Invitation code").fill(code);
  await student.getByRole("button", { name: "Join", exact: true }).click();
  await expect(student).toHaveURL(
    new RegExp(`/student/classrooms/${classroomId}$`),
  );
  await student.getByRole("link", { name: "Add two integers" }).click();
  await expect(
    student.getByText("Assigned to you.", { exact: true }),
  ).toBeVisible();
  await expect(
    student.getByText("Read two integers and print their sum."),
  ).toBeVisible();
  await expect(
    student.getByRole("button", { name: "Submit code", exact: true }),
  ).toBeEnabled();
  const response = await student.request.get(
    `/api/v1/classrooms/${classroomId}/activities/${activityId}`,
    { headers: { Referer: "http://127.0.0.1:5173/" } },
  );
  expect(response.status()).toBe(200);
  expect(await response.text()).not.toContain("PRIVATE_BROWSER");
  expect(
    await student.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(
    (
      await new AxeBuilder({ page: student })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await student.locator("main").focus();
  await student.evaluate(() => scrollTo(0, 0));
  await student.screenshot({
    path: "test-results/phase4-student-phone.png",
    fullPage: true,
  });
  await page.goto(classUrl);
  await expect(
    page.getByRole("heading", { name: "Classroom Student", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove enrollment" }).click();
  await expect(page.getByRole("button", { name: "Reactivate" })).toBeVisible();
  await student.reload();
  await expect(
    student.getByRole("heading", { name: "Activity unavailable" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reactivate" }).click();
  await student.reload();
  await expect(
    student.getByRole("heading", { name: "Add two integers", exact: true }),
  ).toBeVisible();
  await student.locator('.cm-content').fill('public class Main { public static void main(String[] args) {} }');
  await expect(student.getByRole('heading', { name: 'Questions', exact: true })).toBeVisible();
  await student.getByRole('button', { name: 'Submit code', exact: true }).click();
  await expect(student.getByText('Code submitted for instructor review.', { exact: true })).toBeVisible();
  await student.reload();
  await expect(student.getByRole('heading', { name: 'Submission history' })).toHaveCount(0);
  await page.goto(`/instructor/classrooms/${classroomId}`);
  await page.getByRole('link', { name: 'Review answers for Add two integers' }).click();
  await page.getByRole('button', { name: /^View submission / }).click();
  await page.getByLabel('Comments and explanation').fill('Explain your input parsing.');
  await page.getByLabel('Points awarded').fill('85');
  await page.getByRole('button', { name: 'Save feedback' }).click();
  await expect(page.getByText('Feedback saved.', { exact: true })).toBeVisible();
  await student.goto('/student/progress');
  await student.getByRole('combobox', { name: 'Classroom', exact: true }).selectOption(classroomId);
  await expect(student.getByText('1 completed / 0 pending / 0 missed')).toBeVisible();
  await expect(student.getByRole('columnheader', { name: /Score|Possible/ })).toHaveCount(0);
  await page.goto('/instructor/gradebook');
  await page.getByRole('combobox', { name: 'Classroom', exact: true }).selectOption(classroomId);
  await expect(page.getByText('1 completed / 0 pending / 0 missed')).toBeVisible();
  await expect(page.getByRole('button', { name: /Download CSV|Download Excel/ })).toHaveCount(0);
  for (const [profilePage, role] of [[page, 'instructor'], [student, 'student']] as const) {
    await profilePage.goto(`/${role}/profile`);
    await profilePage.getByLabel('Name', { exact: true }).fill(`Updated ${role}`);
    if (role === 'student') await profilePage.getByLabel('Section', { exact: true }).fill('BSIT-2A');
    await profilePage.getByLabel('Profile picture').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
    await profilePage.getByRole('button', { name: 'Save profile' }).click();
    await expect(profilePage.getByText('Profile saved.', { exact: true })).toBeVisible();
    await profilePage.reload();
    await expect(profilePage.getByLabel('Name', { exact: true })).toHaveValue(`Updated ${role}`);
    await expect(profilePage.getByRole('img', { name: 'Your profile', exact: true })).toBeVisible();
    await expect.poll(() => profilePage.getByRole('img', { name: 'Your profile', exact: true }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  }
  await phone.close();
});
