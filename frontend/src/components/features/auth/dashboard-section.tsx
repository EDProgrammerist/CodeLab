import { BookOpen, MessageSquare } from 'lucide-react';
import studyTogether from '@/assets/study-together.png';
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getDashboard } from "@/services/auth-service";
import { useSession } from "@/hooks/use-session";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";

export function DashboardSection() {
  const session = useSession();
  const role = session.data?.role ?? "student";
  const dashboard = useQuery({
    queryKey: ["dashboard", role],
    queryFn: () => getDashboard(role),
    retry: false,
    enabled: !!session.data,
  });
  if (dashboard.isPending) return <p role="status">Loading your dashboard...</p>;
  if (dashboard.isError)
    return (
      <div className="panel">
        <p role="alert">Dashboard access could not be confirmed.</p>
        <Button onClick={() => void dashboard.refetch()}>Retry</Button>
      </div>
    );
  return (
    <>
      <PageHeading
        eyebrow={`${role} workspace`}
        title={`Welcome, ${dashboard.data.name}.`}
        description="Your classrooms, code and feedback. A little progress, every session."
      />
      <section className="dashboard-welcome"><div className="space-y-4">
        <h2>Your account is ready</h2>
        <p className="muted">
          Open your classrooms to manage enrollment, review schedules and work
          on assigned activities.
        </p>
        <Button variant="outline" asChild>
          <Link to={`/${role}/classrooms`}>Open classrooms</Link>
        </Button>
        <p className="text-sm muted">Signed in as {dashboard.data.email}</p>
      </div><img src={studyTogether} alt="" /></section>
      <div className="dashboard-links"><Link to={`/${role}/classrooms`}><BookOpen aria-hidden="true" /><h2>Your classrooms</h2><p>Find activities, schedules and the people you learn with.</p><span>Open classrooms &rarr;</span></Link><Link to={role === "student" ? "/student/progress" : "/instructor/gradebook"}><MessageSquare aria-hidden="true" /><h2>{role === "student" ? "Your progress" : "Student submissions"}</h2><p>{role === "student" ? "See submitted work and what still needs your attention." : "Review code and help students take their next step."}</p><span>View work &rarr;</span></Link></div>
    </>
  );
}
