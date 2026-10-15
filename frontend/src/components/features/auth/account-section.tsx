import studyTogether from '@/assets/study-together.png'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Code2 } from 'lucide-react'
import { useSession } from '@/hooks/use-session'
import { authError, authPost } from '@/services/auth-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Mode =
  'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email'
const TITLES: Record<Mode, string> = {
  login: 'Welcome back.',
  register: 'Start your learning journey.',
  'forgot-password': 'Let’s get you back in.',
  'reset-password': 'Choose a new password.',
  'verify-email': 'Check your inbox.',
}

export function AccountSection({ mode }: { mode: Mode }) {
  const session = useSession()
  const client = useQueryClient()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [name, setName] = useState('')
  const [studentNumber, setStudentNumber] = useState('')
  const dashboard = session.data ? `/${session.data.role}/dashboard` : '/login'
  if (session.data && (mode === 'login' || mode === 'register'))
    return (
      <Navigate
        to={session.data.email_verified_at ? dashboard : '/verify-email'}
        replace
      />
    )
  if (
    mode === 'verify-email' &&
    !session.isPending &&
    !session.isError &&
    !session.data
  )
    return <Navigate to="/login" replace />
  async function submit() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const path =
        mode === 'verify-email' ? 'email/verification-notification' : mode
      const payload =
        mode === 'register'
          ? {
              name,
              email,
              password,
              password_confirmation: confirmation,
              student_number: studentNumber || null,
            }
          : mode === 'reset-password'
            ? {
                email,
                token: params.get('token') ?? '',
                password,
                password_confirmation: confirmation,
              }
            : mode === 'login'
              ? { email, password }
              : { email }
      const response = await authPost(path, payload)
      if (mode === 'login' || mode === 'register') {
        client.clear()
        client.setQueryData(['session'], response.data.data)
        navigate(
          response.data.data.email_verified_at
            ? `/${response.data.data.role}/dashboard`
            : '/verify-email',
          { replace: true },
        )
      } else {
        setMessage(response.data.message)
        if (mode === 'reset-password') {
          client.clear()
          client.setQueryData(['session'], null)
          setPassword('')
          setConfirmation('')
        }
      }
    } catch (err) {
      setError(authError(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="login-page" id="main-content">
      <section className="login-story">
        <Link to="/login" className="brand">
          <span className="brand-mark">
            <Code2 size={22} />
          </span>
          CodeLab.
        </Link>
        <div>
          <p className="eyebrow mb-5">Your programming workspace</p>
          <h1>
            Small steps.
            <br />
            <span className="account-highlight">Real understanding.</span>
          </h1>
          <p className="muted mt-6">
            Your classroom, code and feedback. Together in one place.
          </p>
          <img className="account-illustration" src={studyTogether} alt="" />
        </div>
        <p className="muted text-sm">
          Local demonstration · Use synthetic account details.
        </p>
      </section>
      <section className="login-form">
        <p className="eyebrow">CodeLab account</p>
        <h2 className="mt-3">{TITLES[mode]}</h2>
        {mode === 'verify-email' ? (
          <div className="space-y-5 mt-6">
            {params.get('error') === 'invalid-link' && (
              <p role="alert">This verification link is expired, invalid, or belongs to another account. You are signed in as {session.data?.email}. Use the newest email addressed to this account, or sign out below and sign in to the account that received the email.</p>
            )}
            {params.get('error') === 'too-many-requests' && (
              <p role="alert">Too many verification attempts. Wait 60 seconds without retrying, then open the newest verification email for {session.data?.email}.</p>
            )}
            {session.data?.email_verified_at ? (
              <>
                <p>Your email is verified.</p>
                <Button asChild>
                  <Link to={dashboard}>Continue to dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="muted">
                  Open the verification link sent to {session.data?.email}. Sign
                  in with this account before opening the link. For this local
                  demo, mail is available in Mailpit.
                </p>
                <Button
                  disabled={busy || !session.data}
                  onClick={() => void submit()}
                >
                  Resend verification email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void session.refetch()}
                >
                  I’ve verified my email
                </Button>
              </>
            )}
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                try {
                  await session.logout()
                  navigate('/login', { replace: true })
                } catch (err) {
                  setError(authError(err))
                }
              }}
            >
              Sign out
            </Button>
          </div>
        ) : (
          <form
            className="space-y-5 mt-7"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
        {mode === 'register' && (
              <>
                <label className="field-label">
                  Full name
                  <Input
                    required
                    autoComplete="name"
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Student number (optional)
                  <Input
                    maxLength={50}
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                  />
                </label>
              </>
            )}
            <label className="field-label">
              Email
              <Input
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {mode !== 'forgot-password' && (
              <label className="field-label">
                Password
                <Input
                  required
                  type="password"
                  minLength={mode === 'login' ? undefined : 12}
                  maxLength={72}
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            {(mode === 'register' || mode === 'reset-password') && (
              <>
                <label className="field-label">
                  Confirm password
                  <Input
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={72}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                </label>
                <p className="muted text-sm">
                  Use at least 12 characters (maximum 72 bytes). Choose a
                  password you do not use elsewhere.
                </p>
              </>
            )}
            {mode === 'forgot-password' && (
              <p className="muted text-sm">
                We’ll send a link if an eligible account exists. The link
                expires after one hour.
              </p>
            )}
            <Button
              className="w-full"
              disabled={busy || session.isPending}
              type="submit"
            >
              {busy
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign in'
                  : mode === 'register'
                    ? 'Create student account'
                    : mode === 'forgot-password'
                      ? 'Send reset link'
                      : 'Reset password'}
            </Button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-800">
            {error}
          </p>
        )}
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
        {session.isError && (
          <p role="alert" className="text-sm">
            Unable to check your session. You can retry signing in once the API
            is available.
          </p>
        )}
        <nav
          className="flex flex-wrap gap-4 text-sm mt-6"
          aria-label="Account help"
        >
          {mode !== 'login' && (
            <Link className="text-link" to="/login">
              Back to sign in
            </Link>
          )}
          {mode === 'login' && (
            <>
              <Link className="text-link" to="/register">
                Register as a student
              </Link>
              <Link className="text-link" to="/forgot-password">
                Forgot password?
              </Link>
            </>
          )}
        </nav>
        <nav className="flex flex-wrap gap-4 text-sm mt-6" aria-label="Public information">
          <Link className="text-link" to="/">CodeLab home</Link><Link className="text-link" to="/privacy">Privacy Policy</Link><Link className="text-link" to="/terms">Terms of Use</Link><Link className="text-link" to="/contact">Contact</Link>
        </nav>
        {mode === 'register' && (
          <p className="prototype-note mt-5">
            Instructor accounts are created by an authorized operator. Public
            registration creates students only.
          </p>
        )}
      </section>
    </main>
  )
}
