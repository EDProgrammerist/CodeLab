export type Role = 'student' | 'instructor'

export type User = {
  id: string
  name: string
  email: string
  role: Role
  student_number: string | null
  email_verified_at: string | null
}
