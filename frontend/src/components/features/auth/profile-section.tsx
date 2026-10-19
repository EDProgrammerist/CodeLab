import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/hooks/use-session'
import { saveProfile } from '@/services/profile-service'
import { authError } from '@/services/auth-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeading } from '@/components/ui/page-heading'

export function ProfileSection() {
  const session = useSession()
  const client = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const user = session.data
  if (!user) return <p role="status">Loading profile...</p>
  return <>
    <PageHeading eyebrow={user.role} title="Profile settings" description="Update how you appear in CodeLab." />
    <form className="panel max-w-2xl space-y-5" onSubmit={async event => {
      event.preventDefault()
      const form = event.currentTarget
      const data = new FormData(form)
      const photo = data.get('photo')
      if (photo instanceof File && !photo.size) data.delete('photo')
      setBusy(true); setError(''); setMessage('')
      try {
        const updated = await saveProfile(data)
        client.setQueryData(['session'], updated)
        await client.invalidateQueries({ queryKey: ['domain'] })
        const input = form.elements.namedItem('photo') as HTMLInputElement
        input.value = ''
        setMessage('Profile saved.')
      } catch (err) { setError(authError(err)) }
      finally { setBusy(false) }
    }}>
      {user.photo_url && <img src={user.photo_url} alt="Your profile" className="h-24 w-24 rounded-full object-cover" />}
      <label className="field-label">Name<Input name="name" required maxLength={255} defaultValue={user.name} /></label>
      {user.role === 'student' && <>
        <label className="field-label">Student number / ID<Input name="student_number" required maxLength={50} defaultValue={user.student_number ?? ''} /></label>
        <label className="field-label">Section<Input name="section" maxLength={50} defaultValue={user.section ?? ''} /></label>
        <p className="muted text-sm">Your profile section does not change your classroom enrollment. Join classrooms using your instructor's code.</p>
      </>}
      <label className="field-label">Profile picture<Input name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" /></label>
      <p id="photo-help" className="muted text-sm">JPG, PNG or WebP. Up to 2 MB and 2048 by 2048 pixels.</p>
      <Button disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</Button>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </form>
  </>
}
