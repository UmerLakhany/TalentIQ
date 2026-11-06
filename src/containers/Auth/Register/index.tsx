"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import InputField from "@/components/Input";
import PasswordChecklist from "@/components/PasswordChecklist";
import { ErrorToaster, SuccessToaster } from "@/components/Toaster";
import { route } from "@/constants/routes";
import { registerUser } from "@/services/authService";
import { emailRegex, validatePassword } from "@/utils";

type RegisterFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const password = useWatch({ control, name: "password" });

  // *For Submit Form
  const submitForm = async (formData: RegisterFormValues) => {
    setLoading(true);
    try {
      const payload = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const { message, data } = await registerUser(payload);
      console.log("Register response:", data);

      SuccessToaster(message);

      setTimeout(() => {
        router.push(`${route.verifyEmail}?email=${encodeURIComponent(data.email)}`);
      }, 200);
    } catch (error: unknown) {
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

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 fw-bold text-body-emphasis mb-1">Create your account</h1>
        <p className="text-secondary mb-0">Start screening CVs with AI in a few minutes.</p>
      </div>

      <form onSubmit={handleSubmit(submitForm)} noValidate>
        <InputField
          id="fullName"
          name="fullName"
          type="text"
          label="Full name"
          placeholder="Jane Recruiter"
          register={register}
          errors={errors}
          rules={{
            required: "Full name is required.",
            validate: (value: string) => value.trim().length >= 2 || "Full name must be at least 2 characters.",
            maxLength: { value: 100, message: "Full name must be at most 100 characters." },
          }}
          startAdornment={<i className="bi bi-person text-secondary" aria-hidden="true" />}
        />

        <InputField
          id="email"
          name="email"
          type="email"
          label="Work email"
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
          placeholder="Create a password"
          register={register}
          errors={errors}
          rules={{
            required: "Password is required.",
            validate: validatePassword,
          }}
          startAdornment={<i className="bi bi-lock text-secondary" aria-hidden="true" />}
          endAdornment={visibilityToggle(isPasswordVisible, () => setPasswordVisible((v) => !v), "password")}
        />

        <PasswordChecklist password={password} />

        <InputField
          id="confirmPassword"
          name="confirmPassword"
          type={isConfirmVisible ? "text" : "password"}
          label="Confirm password"
          placeholder="Re-enter your password"
          register={register}
          errors={errors}
          rules={{
            required: "Please confirm your password.",
            validate: (value: string, formValues: RegisterFormValues) => value === formValues.password || "Passwords do not match.",
          }}
          startAdornment={<i className="bi bi-lock text-secondary" aria-hidden="true" />}
          endAdornment={visibilityToggle(isConfirmVisible, () => setConfirmVisible((v) => !v), "confirm password")}
        />

        <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold mt-1" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="small text-secondary text-center mt-4 mb-0">
        Already have an account?{" "}
        <Link href={route.login} className="fw-medium text-decoration-none">
          Sign in
        </Link>
      </p>
    </>
  );
}
