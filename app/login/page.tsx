import AuthForm from '@/src/components/AuthForm';
import { SafePageContainer } from '@/src/components/layout/SafePageContainer';

export default function LoginPage() {
  return (
    <div className="public-page-wrap">
      <SafePageContainer size="narrow">
        <AuthForm mode="login" />
      </SafePageContainer>
    </div>
  );
}
