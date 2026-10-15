import { Link } from 'react-router';
import { BookOpen, Building2, ShieldCheck } from 'lucide-react';
export function ContactSection() {
 return <article className="public-article contact-page">
  <header className="contact-intro"><p className="eyebrow">Contact</p><h1>Start with<br />the <span>right person.</span></h1><p className="public-lead">Asticassia School of Technology.</p></header>
  <div className="contact-options">
   <section><BookOpen aria-hidden="true" /><div><h2>Classroom and activity questions</h2><p>Your instructor is your first point of contact for invitation codes, instructions, feedback and grading questions. Use your existing class communication channel and include the classroom and activity title.</p></div></section>
   <section><Building2 aria-hidden="true" /><div><h2>School information</h2><p>No public social-media page or support email has been provided for Asticassia School of Technology. Ask your instructor or the school office for an authorized project contact.</p></div></section>
   <section><ShieldCheck aria-hidden="true" /><div><h2>Privacy, account access, or security</h2><p>Ask the college office for its designated Data Protection Officer or CodeLab administrator and a private reporting channel. The school must confirm these contacts before public launch.</p><p>Keep student numbers, passwords, reset links, private source code and security details out of public comments.</p><Link className="text-link" to="/privacy">Read the draft Privacy Policy</Link></div></section>
  </div><p className="contact-footnote">This page does not submit or store contact messages.</p>
 </article>;
}
