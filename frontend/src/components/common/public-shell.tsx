import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
const TITLES: Record<string, string> = { '/': 'Programming, with room to learn', '/about': 'About', '/contact': 'Contact', '/privacy': 'Privacy Policy', '/terms': 'Terms of Use' };
export function PublicShell() {
 const { pathname } = useLocation(); const main = useRef<HTMLElement>(null);
 useEffect(() => { document.title = `${TITLES[pathname] ?? 'Page not found'} | CodeLab`; main.current?.focus(); window.scrollTo(0, 0); }, [pathname]);
 return <div className="public-site">
  <a className="skip-link" href="#public-content">Skip to content</a>
  <header className="public-header"><Link className="brand" to="/" aria-label="CodeLab home"><span className="brand-mark"><Code2 aria-hidden="true" size={22} /></span>CodeLab</Link>
   <nav aria-label="Public navigation"><a href="/#how-it-works">For students</a><a href="/#for-instructors">For instructors</a><NavLink to="/about">About</NavLink><NavLink to="/contact">Contact</NavLink></nav><div className="public-account-actions"><Button asChild><Link to="/register">Create student account</Link></Button><Link to="/login">Sign in</Link></div>
  </header>
  <main ref={main} id="public-content" tabIndex={-1}><Outlet /></main>
  <footer className="public-footer"><div><Link className="font-semibold" to="/">CodeLab</Link><p className="muted mt-2">A programming laboratory project for Asticassia School of Technology.</p></div><nav aria-label="Public information"><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms of Use</Link></nav></footer>
 </div>;
}
