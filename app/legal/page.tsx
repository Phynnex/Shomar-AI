export default function LegalPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16 text-slate-900">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="text-sm text-slate-600">
        Our legal team is preparing updated terms covering service usage, support, and data protection. The final
        agreement will be published here shortly. For contractual needs, email{' '}
        <a href="mailto:legal@shomarsec.com" className="text-blue-600 hover:underline">legal@shomarsec.com</a>.
      </p>
    </main>
  );
}
