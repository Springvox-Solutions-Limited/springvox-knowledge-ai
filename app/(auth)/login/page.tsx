import AuthForm from '@/src/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0B0C0E] flex items-center justify-center px-4">
      <AuthForm mode="login" />
    </div>
  );
}
