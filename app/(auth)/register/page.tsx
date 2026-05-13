import AuthForm from '@/src/components/AuthForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_25%),linear-gradient(180deg,#e9f6fb_0%,#f3f7fb_100%)] px-4">
      <AuthForm mode="register" />
    </div>
  );
}
