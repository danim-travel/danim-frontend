import { GuestGuard } from './_components/GuestGuard'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>
}
