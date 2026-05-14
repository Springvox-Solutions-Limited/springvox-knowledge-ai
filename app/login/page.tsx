import AuthForm from '@/src/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="public-page-wrap">
      <AuthForm mode="login" />
    </div>
  );
}
