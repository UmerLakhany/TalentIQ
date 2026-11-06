"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import InputField from "@/components/Input";
import OtpInput from "@/components/OtpInput";
import { ErrorToaster, SuccessToaster } from "@/components/Toaster";
import { route } from "@/constants/routes";
import { ApiError } from "@/lib/clientApi";
import { resendOtp, verifyEmail } from "@/services/authService";
import { emailRegex } from "@/utils";

const OTP_LENGTH = 6;
/** Seconds before another code can be requested (same as the backend's OTP_RESEND_COOLDOWN). */
const RESEND_COOLDOWN = 60;

type VerifyEmailFormValues = {
  email: string;
  otp: string;
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Email passed from the register / login page (?email=...). If missing, the user types it.
  const emailFromUrl = searchParams.get("email") ?? "";
  // From register a code was just sent; from login (?sent=0) none was, so resend is available at once
  const codeJustSent = Boolean(emailFromUrl) && searchParams.get("sent") !== "0";

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(codeJustSent ? RESEND_COOLDOWN : 0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<VerifyEmailFormValues>({
    defaultValues: { email: emailFromUrl, otp: "" },
  });

  // *For Submit Form
  const submitForm = async (formData: VerifyEmailFormValues) => {
    setLoading(true);
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        otp: formData.otp,
      };

      // A correct code also signs the recruiter in (session cookie set by /api/auth/verify-email)
      const { message, data } = await verifyEmail(payload);
      console.log("Verify email response:", data);

      SuccessToaster(message);

      setTimeout(() => {
        router.replace(route.home);
      }, 200);
    } catch (error: unknown) {
      // Already verified: nothing to do here, sign in instead
      if (error instanceof ApiError && error.status === 409) {
        ErrorToaster(error.message);
        router.replace(route.login);
        return;
      }
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // *For Resend Code
  const resendCode = async () => {
    // The email field must be valid before a new code can be sent
    if (!(await trigger("email"))) return;

    setResending(true);
    try {
      const payload = {
        email: getValues("email").trim().toLowerCase(),
      };

      const { message } = await resendOtp(payload);

      SuccessToaster(message);
      setSecondsLeft(RESEND_COOLDOWN);
    } catch (error: unknown) {
      // Asked too soon: the backend says how long to wait ("Please wait 42 seconds ...")
      if (error instanceof ApiError && error.status === 429) {
        const seconds = Number(/(\d+) seconds?/.exec(error.message)?.[1]);
        if (seconds > 0) setSecondsLeft(seconds);
      }
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="mb-4">
        <span className="hf-empty-icon rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center fs-3 mb-3">
          <i className="bi bi-shield-lock" aria-hidden="true" />
        </span>
        <h1 className="h3 fw-bold text-body-emphasis mb-1">Verify your email</h1>
        {emailFromUrl ? (
          <p className="text-secondary mb-0">
            Enter the {OTP_LENGTH}-digit code we sent to{" "}
            <span className="fw-semibold text-body-emphasis text-break">{emailFromUrl}</span>.
          </p>
        ) : (
          <p className="text-secondary mb-0">
            Enter your email and the {OTP_LENGTH}-digit code we sent you.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(submitForm)} noValidate>
        {/* Email is only editable when it didn't come from the register page */}
        {!emailFromUrl && (
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
        )}

        <div className="mb-3">
          <label className="form-label" style={{ fontWeight: 500 }} id="otp-label">
            Verification code
          </label>
          <Controller
            name="otp"
            control={control}
            rules={{
              required: "Enter the verification code.",
              validate: (value: string) =>
                new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value) || `Enter all ${OTP_LENGTH} digits.`,
            }}
            render={({ field }) => (
              <OtpInput
                value={field.value}
                onChange={field.onChange}
                length={OTP_LENGTH}
                disabled={loading}
                hasError={!!errors.otp}
                describedBy={errors.otp ? "otp-error" : "otp-help"}
              />
            )}
          />
          {errors.otp ? (
            <div id="otp-error" className="invalid-feedback d-block">
              {errors.otp.message}
            </div>
          ) : (
            <small id="otp-help" className="text-muted">
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
            "Verify email"
          )}
        </button>
      </form>

      <p className="small text-secondary text-center mt-4 mb-0">
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

      <div className="text-center mt-3">
        <Link href={route.login} className="d-inline-flex align-items-center gap-2 fw-medium text-decoration-none">
          <i className="bi bi-arrow-left" aria-hidden="true" />
          Back to login
        </Link>
      </div>
    </>
  );
}
