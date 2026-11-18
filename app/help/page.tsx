import { permanentRedirect } from 'next/navigation';

export default function HelpIndexPage() {
  permanentRedirect('/docs');
}
