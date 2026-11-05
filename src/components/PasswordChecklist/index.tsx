import type { FC } from "react";
import { PASSWORD_CHECKS } from "@/utils";

interface PasswordChecklistProps {
  password: string;
}

/** Live list of password rules; each turns green once the password satisfies it. */
const PasswordChecklist: FC<PasswordChecklistProps> = ({ password }) => (
  <ul className="list-unstyled small d-flex flex-column gap-1 mt-n1 mb-3" aria-live="polite">
    {PASSWORD_CHECKS.map((check) => {
      const passed = check.test(password);
      return (
        <li key={check.label} className={`d-flex align-items-center gap-2 ${passed ? "text-success" : "text-secondary"}`}>
          <i className={`bi ${passed ? "bi-check-circle-fill" : "bi-circle"}`} aria-hidden="true" />
          <span>
            {check.label}
            <span className="visually-hidden">{passed ? " (done)" : " (not yet)"}</span>
          </span>
        </li>
      );
    })}
  </ul>
);

export default PasswordChecklist;
