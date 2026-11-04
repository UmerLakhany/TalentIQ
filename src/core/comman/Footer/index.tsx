import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-top px-3 px-lg-4 py-3">
      <div className="hf-page d-flex flex-column flex-xl-row flex-wrap align-items-center justify-content-xl-between row-gap-2 column-gap-4 small text-secondary text-center text-xl-start">
        <span>
          &copy; {year} HireFlow AI. All rights reserved.
          <span className="ms-2 badge rounded-pill bg-body-secondary text-secondary fw-normal">v1.0.0</span>
        </span>

        <span className="d-inline-flex align-items-start gap-1">
          <i className="bi bi-shield-check text-primary" aria-hidden="true" />
          AI scores assist your review. Final hiring decisions stay with you.
        </span>

        <nav className="d-flex gap-3" aria-label="Footer">
          <Link href="/help" className="link-secondary text-decoration-none">
            Help &amp; Support
          </Link>
          <Link href="/settings" className="link-secondary text-decoration-none">
            Settings
          </Link>
        </nav>
      </div>
    </footer>
  );
}
