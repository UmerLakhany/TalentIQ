"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import InputField from "@/components/Input";
import PasswordChecklist from "@/components/PasswordChecklist";
import { ErrorToaster, SuccessToaster } from "@/components/Toaster";
import { route } from "@/constants/routes";
import { ApiError } from "@/lib/clientApi";
import { resetPassword } from "@/services/authService";
import { validatePassword } from "@/utils";

type ChangePasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export default function ChangePasswordPage() {
  const searchParams = useSearchParams();
  // Reset token from the forgot-password step (?token=...)
  const resetToken = searchParams.get("token") ?? "";

  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  // Switches the page to the "password changed" view
  const [changed, setChanged] = useState(false);
  // The backend rejected the token (expired or already used)
  const [tokenRejected, setTokenRejected] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const newPassword = useWatch({ control, name: "newPassword" });

  // *For Submit Form
  const submitForm = async (formData: ChangePasswordFormValues) => {
    setLoading(true);
    try {
      const payload = {
        reset_token: resetToken,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      };

      const { message } = await resetPassword(payload);

      SuccessToaster(message);
      setChanged(true);
    } catch (error: unknown) {
      // The reset token expired (15 minutes) or was already used: ask for a new code
      if (error instanceof ApiError && error.status === 400 && /reset token/i.test(error.message)) {
        setTokenRejected(true);
      }
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const visibilityToggle = (visible: boolean, toggle: () => void, label: string) => (
    <button
      type="button"
      className="btn btn-link p-0 text-secondary lh-1"
      onClick={toggle}
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
    >
      <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
    </button>
  );

  const backToLogin = (
    <Link href={route.login} className="d-inline-flex align-items-center gap-2 fw-medium text-decoration-none">
      <i className="bi bi-arrow-left" aria-hidden="true" />
      Back to login
    </Link>
  );

  // No token in the URL: the page was opened directly instead of after verifying the reset code
  if (!resetToken || tokenRejected) {
    return (
      <div className="text-center">
        <span className="hf-empty-icon rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center fs-3 mb-4">
          <i className="bi bi-shield-exclamation" aria-hidden="true" />
        </span>
        <h1 className="h3 fw-bold text-body-emphasis mb-2">Reset session expired</h1>
        <p className="text-secondary mb-4">
          Your password reset session is invalid or has expired. Request a new reset code to continue.
        </p>

        <Link href={route.forgotPassword} className="btn btn-primary w-100 py-2 fw-semibold mb-3">
          Request a new code
        </Link>

        {backToLogin}
      </div>
    );
  }

  if (changed) {
    return (
      <div className="text-center">
        <span className="hf-empty-icon rounded-circle bg-success-subtle text-success d-inline-flex align-items-center justify-content-center fs-3 mb-4">
          <i className="bi bi-check2-circle" aria-hidden="true" />
        </span>
        <h1 className="h3 fw-bold text-body-emphasis mb-2">Password changed</h1>
        <p className="text-secondary mb-4">
          Your password has been updated. You can now sign in with your new password.
        </p>

        <Link href={route.login} className="btn btn-primary w-100 py-2 fw-semibold">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-body-emphasis mb-1">Set a new password</h1>
        <p className="text-secondary mb-0">Choose a strong password you haven&apos;t used before.</p>
      </div>

      <form onSubmit={handleSubmit(submitForm)} noValidate>
        <InputField
          id="newPassword"
          name="newPassword"
          type={isPasswordVisible ? "text" : "password"}
          label="New password"
          placeholder="Enter a new password"
          register={register}
          errors={errors}
          rules={{
            required: "New password is required.",
            validate: validatePassword,
          }}
          startAdornment={<i className="bi bi-lock text-secondary" aria-hidden="true" />}
          endAdornment={visibilityToggle(isPasswordVisible, () => setPasswordVisible((v) => !v), "new password")}
        />

        <PasswordChecklist password={newPassword} />

        <InputField
          id="confirmPassword"
          name="confirmPassword"
          type={isConfirmVisible ? "text" : "password"}
          label="Confirm new password"
          placeholder="Re-enter the new password"
          register={register}
          errors={errors}
          rules={{
            required: "Please confirm your new password.",
            validate: (value: string, formValues: ChangePasswordFormValues) => value === formValues.newPassword || "Passwords do not match.",
          }}
          startAdornment={<i className="bi bi-lock text-secondary" aria-hidden="true" />}
          endAdornment={visibilityToggle(isConfirmVisible, () => setConfirmVisible((v) => !v), "confirm password")}
        />

        <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold mt-1" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Change password"
          )}
        </button>
      </form>

      <div className="text-center mt-4">{backToLogin}</div>
    </>
  );
}
