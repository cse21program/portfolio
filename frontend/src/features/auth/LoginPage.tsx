import { FeaturePage } from "@/features/shared/FeaturePage";

export function LoginPage() {
  return (
    <FeaturePage
      title="Sign in"
      description="Customer and admin authentication."
    />
  );
}

export function RegisterPage() {
  return (
    <FeaturePage
      title="Create account"
      description="Registration and email verification."
    />
  );
}
