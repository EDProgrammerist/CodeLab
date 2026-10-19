import { lazy, Suspense, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { sendEvaluation } from '@/services/assessment-service';
import { authError } from '@/services/auth-service';
import type { Activity } from '@/types/activity';
const JavaEditor = lazy(() => import('./java-editor').then(m => ({ default: m.JavaEditor })));
export function AssessmentWorkspace({ activity }: { activity: Activity }) {
 const base = `/classrooms/${activity.classroom_id}/activities/${activity.id}`;
 const client = useQueryClient();
 const [code, setCode] = useState('public class Main {\n    public static void main(String[] args) {\n        // Write your solution here.\n    }\n}\n');
 const [busy, setBusy] = useState(false); const [error, setError] = useState('');
 const [submitted, setSubmitted] = useState(false);
 const request = useRef<{ fingerprint: string; key: string } | null>(null);
 const pending = useRef(false);
 async function send() {
  if (pending.current) return;
  pending.current = true; setBusy(true); setError('');
  const data = { source_code: code, language_id: activity.language_id };
  const fingerprint = JSON.stringify(data);
  if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() };
  try {
   await sendEvaluation(`${base}/submissions`, data, request.current.key);
   setSubmitted(true); request.current = null;
   await client.invalidateQueries({ queryKey: ['domain'] });
  } catch (err) { setError(authError(err)); } finally { pending.current = false; setBusy(false); }
 }
 return <>
  <section className="panel space-y-4"><h2>Code workspace</h2>
   <p className="muted text-sm">Your draft stays here until you leave or reload this page.</p>
   <div className="overflow-hidden rounded-lg border border-input">
    <div className="flex items-center justify-between border-b border-input bg-stone-50 px-4 py-3 text-sm"><span className="font-medium">Main.java</span><span className="muted">Java</span></div>
    <Suspense fallback={<p className="p-6" role="status">Loading editor...</p>}><JavaEditor value={code} onChange={value => { setCode(value); setSubmitted(false); }} readOnly={busy} /></Suspense>
   </div>
   {activity.submission_unavailable_reason && <p>{activity.submission_unavailable_reason}</p>}
   <div className="flex flex-wrap gap-3"><Button disabled={!activity.can_submit || busy} onClick={() => void send()}>{busy ? 'Submitting...' : 'Submit code'}</Button></div>
   {error && <p role="alert">{error} Retry unchanged code to reuse the same request safely.</p>}
   {submitted && <p role="status">Code submitted for instructor review.</p>}
  </section>
 </>;
}
