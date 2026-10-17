import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, Link, useLocation, useNavigate } from "react-router";
import { BookOpen, Code2, GraduationCap, Table2 } from "lucide-react";
import type { Role } from "@/types/user";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { authError } from "@/services/auth-service";

export function WorkspaceShell({ role }: { role: Role }) {
  const { pathname } = useLocation();
  const session = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    main.current?.focus();
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="workspace">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Code2 size={21} />
          </span>
          CodeLab<span className="brand-dot">.</span>
        </Link>
        <p className="eyebrow px-3 mt-10 mb-3">{role} workspace</p>
        <nav aria-label="Workspace navigation">
          <NavLink to={`/${role}/dashboard`}>Dashboard</NavLink>
          <NavLink to={`/${role}/classrooms`}>
            <BookOpen size={18} />
            Classrooms
          </NavLink>
          {role === "student" ? (
            <NavLink to="/student/progress">
              <GraduationCap size={18} />
              My progress
            </NavLink>
          ) : (
            <NavLink to="/instructor/gradebook">
              <Table2 size={18} />
              Submissions
            </NavLink>
          )}
        </nav>
        <div className="sidebar-note">
          <p className="font-medium">Room to learn.</p>
          <p className="muted text-sm mt-2">
            One program, one new idea at a time.
          </p>
        </div>
      </aside>
      <div className="workspace-body">
        <div className="topbar">
          <span>
            CodeLab /{" "}
            {role === "student" ? "Learning workspace" : "Teaching workspace"}
          </span>
          <div className="flex items-center gap-3">
            <span className="avatar" aria-label={session.data?.name}>
              {session.data?.name.slice(0, 2).toUpperCase()}
            </span>
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  await session.logout();
                  navigate("/login", { replace: true });
                } catch (err) {
                  setError(authError(err));
                  setBusy(false);
                }
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
        <div className="demo-banner">
          <span className="demo-dot" />
          Submit code for instructor review. Points are awarded by instructors; Run Java is deferred.
        </div>
        <main
          id="main-content"
          ref={main}
          tabIndex={-1}
          className="workspace-main"
        >
          {error && <p role="alert">{error}</p>}
          <Outlet />
        </main>
        <footer className="workspace-footer">
          CodeLab / A little progress, every session.
          <span>Deadlines use each classroom's timezone</span>
        </footer>
      </div>
    </div>
  );
}
