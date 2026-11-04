export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-top px-3 px-lg-4 py-3">
      <div className="hf-page d-flex flex-column flex-md-row align-items-center justify-content-md-between gap-2 small text-secondary text-center text-md-start">
        <span>&copy; {year} HireFlow AI. All rights reserved.</span>
        <span className="d-inline-flex align-items-start gap-1">
          <i className="bi bi-shield-check text-primary" aria-hidden="true" />
          AI scores assist your review. Final hiring decisions stay with you.
        </span>
      </div>
    </footer>
  );
}
