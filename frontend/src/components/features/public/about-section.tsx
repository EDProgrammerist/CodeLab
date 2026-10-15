import { Link } from 'react-router';
import { BookOpen, Code2, MessageSquare } from 'lucide-react';
import studyTogether from '@/assets/study-together.png';
export function AboutSection() {
 return <article className="public-article about-page">
  <header className="information-hero"><div><p className="eyebrow">About CodeLab</p><h1>Built around<br />the <span>learning</span><br />process.</h1><p className="public-lead">A programming laboratory project for Asticassia School of Technology.</p></div><img src={studyTogether} alt="Illustration of two students working on code and notes together." /></header>
  <section className="about-purpose"><h2>One workspace.<br />Two perspectives.</h2><div><p>Students need a clear brief, a place to write code, and feedback they can return to. Instructors need private classrooms, consistent activity settings, and a way to see individual progress.</p><p>CodeLab brings these tasks into one workspace, with room to work through a problem and learn from the result.</p></div></section>
  <div className="information-cards"><section><BookOpen aria-hidden="true" /><h2>Made for your laboratory</h2><p>Each classroom represents a course, section, and term. Activities follow academic years, semesters, grading periods and OC or LAB sessions.</p></section><section><Code2 aria-hidden="true" /><h2>From brief to submitted code</h2><p>Join through an invitation code, read the activity, write Java, and submit your work for instructor review.</p></section><section><MessageSquare aria-hidden="true" /><h2>Feedback you can return to</h2><p>Read instructor explanations and follow completed, pending and missed work. Scores stay in instructors' class records.</p></section></div>
  <section className="project-status"><h2>A project under review</h2><p>Run Java remains deferred. This preview uses synthetic data and does not establish institutional endorsement. The school must confirm ownership, policies, access and support before a real rollout.</p><Link className="text-link" to="/contact">Questions about the project or classroom access?</Link></section>
 </article>;
}
