import { TwoFactorVerificationForm } from "@/components/forms/twofactor-verification-form";

const ResetPasswordPage = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <TwoFactorVerificationForm />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
