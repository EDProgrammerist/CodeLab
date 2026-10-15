import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
export function EditorSection() {
  return <section className="panel space-y-4"><h1>Choose a classroom activity</h1><p>Open an assigned activity to write Java and submit code for instructor review. Run Java is deferred.</p><Button asChild><Link to="/student/classrooms">Open classrooms</Link></Button></section>;
}
