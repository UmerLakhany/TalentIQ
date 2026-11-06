"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import InputField from "@/components/Input";
import OtpInput from "@/components/OtpInput";
import { ErrorToaster, SuccessToaster } from "@/components/Toaster";
import { route } from "@/constants/routes";
import { ApiError } from "@/lib/clientApi";
import { forgotPassword, verifyResetOtp } from "@/services/authService";
import { emailRegex } from "@/utils";

/**
 * Forgot password, matching the backend flow:
 *   1. Email  -> POST /api/auth/forgot-password  { email }        (emails a 6-digit code)
 *   2. Code   -> POST /api/auth/verify-reset-otp { email, otp }   (returns a one-time reset_token)
 *   3. Change password page (?token=reset_token) -> POST /api/auth/reset-password
 */

const OTP_LENGTH = 6;
/** Seconds before another code can be requested (same as the backend's OTP_RESEND_COOLDOWN). */
const RESEND_COOLDOWN = 60;

type EmailFormValues = {
  email: string;
};

type CodeFormValues = {
  otp: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  // Email the code was sent to — switches the page to the "enter code" step
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const emailForm = useForm<EmailFormValues>({
    defaultValues: { email: "" },
  });

  const codeForm = useForm<CodeFormValues>({
    defaultValues: { otp: "" },
  });

  // *For Step 1: send the reset code
  const sendCode = async (email: string) => {
    const payload = {
      email: email.trim().toLowerCase(),
    };

    try {
      // The backend gives the same answer whether or not the email is registered
      const { message } = await forgotPassword(payload);
      SuccessToaster(message);
      setSentTo(payload.email);
      setSecondsLeft(RESEND_COOLDOWN);
    } catch (error: unknown) {
      // A code was already sent less than a minute ago: go to the code step and show the wait time
      if (error instanceof ApiError && error.status === 429) {
        ErrorToaster(error.message);
        setSentTo(payload.email);
        const seconds = Number(/(\d+) seconds?/.exec(error.message)?.[1]);
        setSecondsLeft(seconds > 0 ? seconds : RESEND_COOLDOWN);
        return;
      }
      throw error;
    }
  };

  const submitEmail = async (formData: EmailFormValues) => {
    setLoading(true);
    try {
      await sendCode(formData.email);
    } catch (error: unknown) {
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // *For Resend Code
  const resendCode = async () => {
    if (!sentTo) return;
    setResending(true);
    try {
      await sendCode(sentTo);
      codeForm.reset({ otp: "" });
    } catch (error: unknown) {
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setResending(false);
    }
  };

  // *For Step 2: verify the code, then continue to the change password page
  const submitCode = async (formData: CodeFormValues) => {
    setLoading(true);
    try {
      const payload = {
        email: sentTo!,
        otp: formData.otp,
      };

      // Returns a single-use reset token, valid for 15 minutes
      const { message, data } = await verifyResetOtp(payload);

      SuccessToaster(message);

      setTimeout(() => {
        router.push(`${route.changePassword}?token=${encodeURIComponent(data.reset_token)}`);
      }, 200);
    } catch (error: unknown) {
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // *For "Use a different email"
  const changeEmail = () => {
    setSentTo(null);
    setSecondsLeft(0);
    codeForm.reset({ otp: "" });
  };

  const backToLogin = (
    <Link href={route.login} className="d-inline-flex align-items-center gap-2 fw-medium text-decoration-none">
      <i className="bi bi-arrow-left" aria-hidden="true" />
      Back to login
    </Link>
  );

  /* ---------- Step 2: enter the code ---------- */
  if (sentTo) {
    const otpError = codeForm.formState.errors.otp;

    return (
      <>
        <div className="mb-4">
          <span className="hf-empty-icon rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center fs-3 mb-3">
            <i className="bi bi-envelope-check" aria-hidden="true" />
          </span>
          <h1 className="h3 fw-bold text-body-emphasis mb-1">Check your email</h1>
          <p className="text-secondary mb-0">
            If an account exists for <span className="fw-semibold text-body-emphasis text-break">{sentTo}</span>, we&apos;ve
            sent a {OTP_LENGTH}-digit code to reset your password.
          </p>
        </div>

        <form onSubmit={codeForm.handleSubmit(submitCode)} noValidate>
          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 500 }}>
              Reset code
            </label>
            <Controller
              name="otp"
              control={codeForm.control}
              rules={{
                required: "Enter the reset code.",
                validate: (value: string) =>
                  new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value) || `Enter all ${OTP_LENGTH} digits.`,
              }}
              render={({ field }) => (
                <OtpInput
                  value={field.value}
                  onChange={field.onChange}
                  length={OTP_LENGTH}
                  disabled={loading}
                  hasError={!!otpError}
                  describedBy={otpError ? "reset-otp-error" : "reset-otp-help"}
                />
              )}
            />
            {otpError ? (
              <div id="reset-otp-error" className="invalid-feedback d-block">
                {otpError.message}
              </div>
            ) : (
              <small id="reset-otp-help" className="text-muted">
                The code expires in 10 minutes.
              </small>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold mt-1" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Verifying…
              </>
            ) : (
              "Verify code"
            )}
          </button>
        </form>

        <p className="small text-secondary text-center mt-4 mb-2">
          Didn&apos;t receive the code?{" "}
          {secondsLeft > 0 ? (
            <span>
              Resend in <span className="fw-semibold text-body-emphasis">{secondsLeft}s</span>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-link btn-sm p-0 align-baseline fw-medium text-decoration-none"
              onClick={resendCode}
              disabled={resending}
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          )}
        </p>
        <p className="small text-center mb-0">
          <button
            type="button"
            className="btn btn-link btn-sm p-0 align-baseline fw-medium text-decoration-none"
            onClick={changeEmail}
          >
            Use a different email
          </button>
        </p>

        <div className="text-center mt-4">{backToLogin}</div>
      </>
    );
  }

  /* ---------- Step 1: enter the email ---------- */
  return (
    <>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-body-emphasis mb-1">Forgot password?</h1>
        <p className="text-secondary mb-0">
          Enter the email linked to your account and we&apos;ll send you a code to reset your password.
        </p>
      </div>

      <form onSubmit={emailForm.handleSubmit(submitEmail)} noValidate>
        <InputField
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@company.com"
          register={emailForm.register}
          errors={emailForm.formState.errors}
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
            "Send reset code"
          )}
        </button>
      </form>

      <div className="text-center mt-4">{backToLogin}</div>
    </>
  );
}
