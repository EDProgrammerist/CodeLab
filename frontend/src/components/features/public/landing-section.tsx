import { Link } from 'react-router';
import { BookOpen, MessageSquare, ListChecks, Sparkles, Check, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import classroomPreview from '@/assets/classroom-preview.png';
import editorPreview from '@/assets/editor-preview.png';
import studyTogether from '@/assets/study-together.png';
import learningCharacters from '@/assets/learning-characters.png';
export function LandingSection() {
 return <>
  <section className="public-hero">
   <img className="hero-characters" src={learningCharacters} alt="" aria-hidden="true" />
   <h1>Where students and<br />instructors <span className="hero-highlight">Code</span> together.</h1>
   <p className="public-lead">Write programs, share your thinking, and learn with feedback built around your classroom.</p>
   <div className="public-actions"><Button asChild><Link to="/register">Create student account</Link></Button><Button variant="secondary" asChild><a href="#how-it-works">Explore the classroom</a></Button></div>
  </section>
  <div className="preview-stage">
   <span className="preview-decoration decoration-book" aria-hidden="true"><BookOpen /><Check className="decoration-check" /></span>
   <span className="preview-decoration decoration-list" aria-hidden="true"><ListChecks /><Sparkles className="decoration-spark" /></span>
   <span className="preview-decoration decoration-code" aria-hidden="true"><Code2 /></span>
   <span className="preview-decoration decoration-message" aria-hidden="true"><MessageSquare /></span>
   <figure className="public-preview"><img src={classroomPreview} alt="CodeLab classroom showing programming activities organized by grading period and LAB session. The pictured records are fictional examples." width={1366} height={974} fetchPriority="high" /><figcaption>Inside a CodeLab classroom. Illustrative records, not student data.</figcaption></figure>
  </div>
  <section className="public-section learning-features" id="how-it-works">
   <header className="section-intro"><h2>Everything you need.<br />Room to <span>figure it out.</span></h2><p>The brief, the code, and the conversation. Together in one classroom.</p></header>
   <div className="learning-grid">
    <article className="learning-card learning-editor"><div className="learning-card-copy"><Code2 aria-hidden="true" className="feature-symbol" /><h3>Make space for<br />your next idea.</h3><p>Read the brief. Write Java in the browser editor. Submit your work when you are ready for instructor review.</p><a className="text-link" href="#before-you-begin">How submissions work</a></div><figure><img src={editorPreview} alt="CodeLab Java workspace with instructions, editor and submission controls, using fictional example records." loading="lazy" /><figcaption>Actual interface with example records. Run Java is deferred.</figcaption></figure></article>
    <article className="learning-card learning-classroom"><BookOpen aria-hidden="true" className="feature-symbol" /><h3>A place for every<br />classroom.</h3><p>Keep activities, examples, deadlines, and OC or LAB schedules together. Join with your instructor's invitation code.</p><img src={classroomPreview} alt="Example classroom with its weekly schedule and activity list." loading="lazy" /></article>
    <article className="learning-card learning-feedback"><MessageSquare aria-hidden="true" className="feature-symbol" /><h3>Good feedback.<br />New understanding.</h3><p>Return to your submitted code and your instructor's explanations. See what you have completed and what comes next.</p><img src={studyTogether} alt="" loading="lazy" /></article>
   </div>
  </section>
  <section className="public-teaching" id="for-instructors"><div><p className="eyebrow">For instructors</p><h2>Less organizing.<br />More teaching.</h2><p>Private classrooms, clear activity settings, and submitted work in one place. Give each student feedback they can build on.</p><Button variant="secondary" asChild><Link to="/contact">Ask about instructor access</Link></Button></div><div className="teaching-notes"><div><BookOpen aria-hidden="true" /><h3>Keep your sections together</h3><p>Organize each course, section and term with its own roster and schedule.</p></div><div><MessageSquare aria-hidden="true" /><h3>See the work behind the answer</h3><p>Review code and leave comments. Keep scores in your own class record.</p></div><div><ListChecks aria-hidden="true" /><h3>Know what needs attention</h3><p>Follow completed, pending and missed activities by grading period.</p></div></div></section>
  <section className="public-section public-questions" id="before-you-begin"><div className="questions-intro"><BookOpen aria-hidden="true" /><p>Getting started</p></div><h2>Before you begin</h2><details><summary>Can I submit code and run Java now?</summary><p>You can write and submit Java code for instructor review now. Running Java is deferred until an isolated execution service is ready. CodeLab does not automatically grade code.</p></details><details><summary>Are these official course grades?</summary><p>No. CodeLab tracks submissions and feedback without scores. Your instructor records grades separately in their class record.</p></details><details><summary>Is this the college's official production service?</summary><p>This is a project preview for Asticassia School of Technology. School approval, policy review, and hosting are still required before an institutional rollout. Use synthetic data during the preview.</p></details><details><summary>How do I get a classroom invitation?</summary><p>Your instructor supplies the code for your course section. Sign in or create a student account, open Classrooms, then choose Join classroom.</p></details></section>
 </>;
}
