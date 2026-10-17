import { Link } from 'react-router';
import { ArrowRight, BookOpen, CalendarDays, Code2, ListChecks, MessageSquare, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import classroomIllustration from '@/assets/landing-classroom.png';
import { ClassroomFeaturePreview, CodeFeaturePreview, FeedbackFeaturePreview } from './feature-previews';
import studentIllustration from '@/assets/landing-student.png';
import instructorIllustration from '@/assets/landing-instructor.png';
import progressIllustration from '@/assets/landing-progress.png';

import cLogo from '@/assets/technology-c.svg';
import csharpLogo from '@/assets/technology-csharp.svg';
import javaLogo from '@/assets/technology-java.svg';
import phpLogo from '@/assets/technology-php.svg';
import mysqlLogo from '@/assets/technology-mysql.svg';
import reactLogo from '@/assets/technology-react.svg';
import laravelLogo from '@/assets/technology-laravel.svg';

const technologies = [
  { name: 'C', logo: cLogo },
  { name: 'C#', logo: csharpLogo },
  { name: 'Java', logo: javaLogo },
  { name: 'PHP', logo: phpLogo },
  { name: 'MySQL', logo: mysqlLogo },
  { name: 'React', logo: reactLogo },
  { name: 'Laravel', logo: laravelLogo },
];

const shortcuts = [
  { icon: BookOpen, title: 'Join your classroom', lines: ['Join your', 'classroom'], href: '/register', color: 'blue' },
  { icon: Code2, title: 'Write your next program', lines: ['Write your next', 'program'], href: '#code-preview', color: 'yellow' },
  { icon: MessageSquare, title: 'Learn from feedback', lines: ['Learn from', 'instructor feedback'], href: '#feedback-preview', color: 'coral' },
  { icon: CalendarDays, title: 'Keep track of activities', lines: ['Keep track of', 'classroom activities'], href: '#classroom-preview', color: 'green' },
  { icon: ShieldCheck, title: 'Create a teaching space', lines: ['Create your own', 'teaching space'], href: '/contact', color: 'violet' },
];

export function LandingSection() {
  return <div className="reference-landing">
    <section className="reference-hero">
      <h1>Where students and<br />instructors <span className="reference-highlight">Code</span> together.</h1>
      <p>Write programs, share your thinking, and learn with feedback built around your classroom.</p>
      <div className="public-actions"><Button asChild><Link to="/register">Create student account</Link></Button><Button variant="secondary" asChild><a href="#how-it-works">Explore the classroom</a></Button></div>
    </section>

    <figure className="reference-preview" id="classroom-preview">
      <img src={classroomIllustration} alt="Students writing programs together while an instructor discusses their work." width={1536} height={1024} fetchPriority="high" />
      <figcaption>A shared space for programming, questions, and feedback.</figcaption>
    </figure>
    <section className="reference-capabilities" aria-label="Programming languages and technologies">
      <p>Languages and technologies for your programming laboratory.</p>
      <div className="technology-brands">{technologies.map(({ name, logo }) => <span className={`technology-brand technology-${name.toLowerCase().replace('#', 'sharp')}`} key={name}><img src={logo} alt="" width={40} height={40} loading="lazy" /><span>{name}</span></span>)}</div>
    </section>

    <section className="reference-features" id="how-it-works">
      <h2>Learning where your classroom works.</h2>
      <div className="reference-feature-grid">
        <article className="reference-feature">
          <header><p>Bring it together</p><h3>Bring every activity into one classroom.</h3><a href="#before-you-begin" aria-label="Learn how to join a classroom"><ArrowRight /></a></header>
          <ClassroomFeaturePreview />
        </article>
        <article className="reference-feature" id="code-preview">
          <header><p>Make room for ideas</p><h3>Write Java. Share your thinking.</h3><a href="#before-you-begin" aria-label="Learn how code submissions work"><ArrowRight /></a></header>
          <CodeFeaturePreview />
        </article>
        <article className="reference-feature reference-feature-wide" id="feedback-preview">
          <header><p>Keep learning</p><h3>Keep learning with instructor feedback.</h3><a href="#for-instructors" aria-label="Explore instructor feedback"><ArrowRight /></a></header>
          <FeedbackFeaturePreview />
        </article>
      </div>
      <p className="reference-shortcuts-label">See what CodeLab can do</p>
      <div className="reference-shortcuts">{shortcuts.map(({ icon: Icon, title, lines, href, color }) => <a key={title} href={href}><span className={`shortcut-icon shortcut-${color}`}><Icon size={22} aria-hidden="true" /></span><strong>{lines[0]}<br />{lines[1]} <ArrowRight size={15} aria-hidden="true" /></strong></a>)}</div>
    </section>

    <section className="reference-stories" id="for-instructors">
      <h2>Built for the people doing the work.</h2>
      <div className="reference-story-grid">
        <article className="reference-story story-coral"><span><BookOpen size={21} /> For students</span><img src={studentIllustration} width={1254} height={1254} alt="" loading="lazy" /><div><h3>A place to find your own answer.</h3><p>Read the brief, write Java, and submit your thinking for instructor review.</p><Link to="/about">Explore the student workflow <ArrowRight size={16} /></Link></div></article>
        <article className="reference-story story-blue"><span><MessageSquare size={21} /> For instructors</span><img src={instructorIllustration} width={1254} height={1254} alt="" loading="lazy" /><div><h3>See the work behind every answer.</h3><p>Keep sections organized and give each student feedback they can build on.</p><Link to="/contact">Ask about instructor access <ArrowRight size={16} /></Link></div></article>
        <article className="reference-story story-amber"><span><ListChecks size={21} /> For every session</span><img src={progressIllustration} width={1254} height={1254} alt="" loading="lazy" /><div><h3>Make a little progress, every day.</h3><p>Follow submitted, pending, and missed activities across each grading period.</p><a href="#before-you-begin">Find out how it works <ArrowRight size={16} /></a></div></article>
      </div>
    </section>

    <section className="reference-faq" id="before-you-begin" aria-label="Before you begin">
      <details><summary>Before you begin</summary><div className="reference-faq-content">
        <details><summary>Can I submit code and run Java now?</summary><p>You can write and submit Java code for instructor review now. Running Java is deferred until an isolated execution service is ready. CodeLab does not automatically grade code.</p></details>
        <details><summary>Are these official course grades?</summary><p>CodeLab shows points awarded by your instructor for each submission. Official course grades remain subject to your school's grading policy.</p></details>
        <details><summary>Is this the college's official production service?</summary><p>This is a project preview for Asticassia School of Technology. School approval, policy review, and hosting are still required before an institutional rollout. Use synthetic data during the preview.</p></details>
        <details><summary>How do I get a classroom invitation?</summary><p>Your instructor supplies the code for your course section. Sign in or create a student account, open Classrooms, then choose Join classroom.</p></details>
      </div></details>
    </section>
    <section className="reference-start"><h2>Get started today.</h2><div className="public-actions"><Button asChild><Link to="/register">Create student account</Link></Button><Button variant="secondary" asChild><Link to="/contact">Contact us</Link></Button></div><p>Join your classroom. Take the next step.</p></section>
  </div>;
}
