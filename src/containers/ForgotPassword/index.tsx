"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import InputField from "@/components/Input";
import { ErrorToaster, SuccessToaster } from "@/components/Toaster";
import { route } from "@/constants/routes";
import { emailRegex } from "@/utils";

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  // Email the reset link was sent to — switches the page to the "check your email" view
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: { email: "" },
  });

  // *For Submit Form
  const submitForm = async (formData: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      const payload = {
        email: formData.email,
      };

      console.log("Forgot password payload:", payload);

      SuccessToaster("Password reset link sent");
      setSentTo(formData.email);
    } catch (error: unknown) {
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = (
    <Link href={route.login} className="d-inline-flex align-items-center gap-2 fw-medium text-decoration-none">
      <i className="bi bi-arrow-left" aria-hidden="true" />
      Back to login
    </Link>
  );

  if (sentTo) {
    return (
      <div className="text-center">
        <span className="hf-empty-icon rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center fs-3 mb-4">
          <i className="bi bi-envelope-check" aria-hidden="true" />
        </span>
        <h1 className="h3 fw-bold text-body-emphasis mb-2">Check your email</h1>
        <p className="text-secondary mb-4">
          We&apos;ve sent a password reset link to <span className="fw-semibold text-body-emphasis">{sentTo}</span>.
        </p>

        <Link href={route.login} className="btn btn-primary w-100 py-2 fw-semibold mb-3">
          Back to login
        </Link>

        <p className="small text-secondary mb-0">
          Didn&apos;t receive the email?{" "}
          <button
            type="button"
            className="btn btn-link btn-sm p-0 align-baseline fw-medium text-decoration-none"
            onClick={() => submitForm({ email: sentTo })}
            disabled={loading}
          >
            Resend
          </button>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-body-emphasis mb-1">Forgot password?</h1>
        <p className="text-secondary mb-0">
          Enter the email linked to your account and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(submitForm)} noValidate>
        <InputField
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@company.com"
          register={register}
          errors={errors}
          rules={{
            required: "Email is required.",
            pattern: {
              value: emailRegex,
              message: "Enter a valid email address.",
            },
          }}
          startAdornment={<i className="bi bi-envelope text-secondary" aria-hidden="true" />}
        />

        <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold mt-1" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>

      <div className="text-center mt-4">{backToLogin}</div>
    </>
  );
}
