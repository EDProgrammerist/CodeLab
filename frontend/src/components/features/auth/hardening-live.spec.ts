import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

test.skip(process.env.CODELAB_LIVE_HARDENING !== '1', 'Requires local MySQL and creates ten synthetic students.');

test('five independent sessions keep identities isolated under concurrent reads', async ({ browser }) => {
  test.setTimeout(120000);
  const prefix = `load-${Date.now()}`;
  const password = 'Synthetic-load-pass-42';
  const fixture = `<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
$hash = Illuminate\\Support\\Facades\\Hash::make('${password}');
$classroom = App\\Models\\Classroom::factory()->create();
$activity = App\\Models\\Activity::factory()->create(['classroom_id' => $classroom->id, 'status' => 'published', 'published_at' => now()]);
$emails = [];
for ($i = 0; $i < 10; $i++) {
    $email = '${prefix}-'.$i.'@example.test';
    $student = App\\Models\\User::factory()->create(['email' => $email, 'password' => $hash]);
    $member = $classroom->memberships()->create(['student_id' => $student->id, 'status' => 'active', 'joined_at' => now()]);
    Illuminate\\Support\\Facades\\DB::table('activity_allocations')->insert(['activity_id' => $activity->id, 'membership_id' => $member->id, 'status' => 'assigned', 'reason' => 'publication', 'decided_at' => now()]);
    $emails[] = $email;
}
echo json_encode(['emails' => $emails, 'classroom' => $classroom->id, 'activity' => $activity->id, 'language' => $activity->language_id]);
`;
  const { emails, classroom, activity, language }: { emails: string[], classroom: number, activity: number, language: number } = JSON.parse(execFileSync('docker', ['compose', '--env-file', '.env', '-f', 'infra/app/compose.yaml', 'exec', '-T', 'app', 'php'], { cwd: resolve('..'), input: fixture, encoding: 'utf8' }));
  const activityUrl = `http://127.0.0.1:5173/api/v1/classrooms/${classroom}/activities/${activity}`;
  const contexts = await Promise.all(emails.slice(0, 5).map(() => browser.newContext()));
  const durations: number[] = [];
  try {
    for (const [index, context] of contexts.entries()) {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5173/login');
      await page.getByLabel('Email', { exact: true }).fill(emails[index]);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(/\/student\/dashboard$/);
    }
    for (let round = 0; round < 10; round++) {
      await Promise.all(contexts.map(async (context, index) => {
        const start = performance.now();
        const response = await context.request.get(round % 2 === 0 ? 'http://127.0.0.1:5173/api/v1/me' : activityUrl, { headers: { Accept: 'application/json', Referer: 'http://127.0.0.1:5173/' } });
        expect(response.status()).toBe(200);
        const data = (await response.json()).data;
        if (round % 2 === 0) expect(data.email).toBe(emails[index]);
        else expect(String(data.id)).toBe(String(activity));
        durations.push(performance.now() - start);
      }));
    }
    durations.sort((a, b) => a - b);
    const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
    console.log(`Local load: 10 synthetic accounts, 5 independent browser sessions, ${durations.length} authenticated reads, p95=${p95.toFixed(1)}ms`);
    expect(p95).toBeLessThan(500);
    const admissions: number[] = [];
    const submissions = await Promise.all(contexts.map(async context => {
      const token = (await context.cookies()).find(cookie => cookie.name === 'XSRF-TOKEN');
      expect(token).toBeDefined();
      const start = performance.now();
      const response = await context.request.post(`${activityUrl}/submissions`, {
        headers: { Accept: 'application/json', Referer: 'http://127.0.0.1:5173/', 'X-XSRF-TOKEN': decodeURIComponent(token!.value), 'Idempotency-Key': randomUUID() },
        data: { language_id: language, source_code: 'public class Main {}' },
      });
      expect(response.status()).toBe(201);
      const data = (await response.json()).data;
      expect(data.state).toBe('submitted');
      expect(data).not.toHaveProperty('score');
      admissions.push(performance.now() - start);
      return data.id;
    }));
    console.log(`Five concurrent submissions: slowest=${Math.max(...admissions).toFixed(1)}ms`);
    expect(Math.max(...admissions)).toBeLessThan(1000);
    execFileSync('docker', ['compose', '--env-file', '.env', '-f', 'infra/app/compose.yaml', 'restart', 'app'], { cwd: resolve('..'), stdio: 'pipe' });
    await expect.poll(async () => {
      try {
        return (await contexts[0].request.get('http://127.0.0.1:8010/up')).status();
      } catch {
        return 0;
      }
    }, { timeout: 30000 }).toBe(200);
    for (const [index, context] of contexts.entries()) {
      const response = await context.request.get('http://127.0.0.1:5173/api/v1/me', { headers: { Accept: 'application/json', Referer: 'http://127.0.0.1:5173/' } });
      expect(response.status()).toBe(200);
      expect((await response.json()).data.email).toBe(emails[index]);
      const saved = await context.request.get(`${activityUrl}/submissions/${submissions[index]}`, { headers: { Accept: 'application/json', Referer: 'http://127.0.0.1:5173/' } });
      expect(saved.status()).toBe(200);
      expect((await saved.json()).data.source_code).toBe('public class Main {}');
    }
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});
