import type { ReactNode } from "react";

const FEATURES = [
  { icon: "bi-cpu", title: "AI CV screening", text: "Every CV scored against your job criteria in seconds." },
  { icon: "bi-bar-chart-line", title: "Ranked shortlists", text: "See the best-matched candidates first, with reasons." },
  { icon: "bi-shield-check", title: "Consistent decisions", text: "Same requirements, applied fairly to every applicant." },
];

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="d-flex align-items-center gap-2">
      <span
        className={`hf-icon-circle rounded-3 d-inline-flex align-items-center justify-content-center ${
          light ? "bg-white text-primary" : "bg-primary text-white"
        }`}
      >
        <i className="bi bi-stars" aria-hidden="true" />
      </span>
      <span className={`fw-bold fs-5 ${light ? "text-white" : "text-body-emphasis"}`}>HireFlow AI</span>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-fluid min-vh-100">
      <div className="row min-vh-100">
        {/* Brand panel — large screens only */}
        <aside className="hf-auth-aside col-lg-6 d-none d-lg-flex flex-column justify-content-between text-white p-5">
          <Brand light />

          <div className="hf-auth-aside-body">
            <h2 className="display-6 fw-bold mb-3">Hire the right people, faster.</h2>
            <p className="text-white-50 fs-6 mb-5">
              Upload CVs, define what matters for the role, and let AI do the first pass of screening.
            </p>

            <ul className="list-unstyled d-flex flex-column gap-4 mb-0">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="d-flex gap-3">
                  <span className="hf-stat-icon rounded-3 bg-white bg-opacity-10 d-inline-flex align-items-center justify-content-center">
                    <i className={`bi ${feature.icon}`} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="fw-semibold">{feature.title}</div>
                    <div className="small text-white-50">{feature.text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="small text-white-50 mb-0">© {new Date().getFullYear()} HireFlow AI. All rights reserved.</p>
        </aside>

        {/* Form panel */}
        <main className="col-12 col-lg-6 bg-white d-flex align-items-center justify-content-center px-3 py-5 p-sm-5">
          <div className="hf-auth-card w-100">
            <div className="d-lg-none mb-4">
              <Brand />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
