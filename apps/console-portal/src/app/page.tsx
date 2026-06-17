import { redirect } from 'next/navigation';

export const runtime = 'edge';

// The admin console has no public landing page — every visit to the root
// is sent straight to the secure admin sign-in. User-portal routes do not
// exist in this app, so the console is unreachable from the user portal.
export default function ConsoleRoot() {
  redirect('/admin/login');
}
