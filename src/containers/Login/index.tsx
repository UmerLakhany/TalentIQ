"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import InputField from "@/components/Input";
import { ErrorToaster, SuccessToaster } from "@/components/Toaster";
import { route } from "@/constants/routes";
import { setAuthToken } from "@/lib/auth";
import { emailRegex } from "@/utils";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prevState) => !prevState);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  // *For Submit Form
  const submitForm = async (formData: LoginFormValues) => {
    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        remember_me: rememberMe,
      };

      console.log("Login payload:", payload);

      // Static for now — replace with the token returned by the login API
      setAuthToken("demo-token", rememberMe);

      SuccessToaster("Logged in successfully");

      setTimeout(() => {
        router.replace(route.home);
      }, 200);
    } catch (error: unknown) {
      ErrorToaster(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-body-emphasis mb-1">Welcome back</h1>
        <p className="text-secondary mb-0">Sign in to your recruiter account to continue.</p>
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

        <InputField
          id="password"
          name="password"
          type={isPasswordVisible ? "text" : "password"}
          label="Password"
          placeholder="Enter your password"
          register={register}
          errors={errors}
          rules={{
            required: "Password is required.",
          }}
          startAdornment={<i className="bi bi-lock text-secondary" aria-hidden="true" />}
          endAdornment={
            <button
              type="button"
              className="btn btn-link p-0 text-secondary lh-1"
              onClick={togglePasswordVisibility}
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              <i className={`bi ${isPasswordVisible ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
            </button>
          }
        />

        <div className="d-flex align-items-center justify-content-between gap-2 mb-4">
          <div className="form-check mb-0">
            <input
              id="remember-me"
              type="checkbox"
              className="form-check-input"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="remember-me">
              Remember me
            </label>
          </div>
          <Link href={route.forgotPassword} className="fw-medium text-decoration-none">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="small text-secondary text-center mt-4 mb-0">
        Don&apos;t have an account? Contact your workspace administrator.
      </p>
    </>
  );
}
