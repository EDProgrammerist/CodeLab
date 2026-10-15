import { Link } from 'react-router';
export function NotFoundSection() { return <section className="public-article not-found-page"><p className="eyebrow">Page not found</p><h1>This page isn't here.</h1><p>Check the address or return to the CodeLab home page.</p><Link className="text-link" to="/">Back to home</Link></section>; }
