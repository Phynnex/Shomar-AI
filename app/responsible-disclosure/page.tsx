export default function ResponsibleDisclosurePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16 text-slate-900">
      <h1 className="text-3xl font-semibold">Responsible Disclosure</h1>
      <p className="text-sm text-slate-600">
        Security researchers are valued partners. Please send vulnerability reports to{' '}
        <a href="mailto:security@shomarsec.com" className="text-blue-600 hover:underline">security@shomarsec.com</a> and
        encrypt sensitive findings when possible. We&apos;ll share our full policy and PGP details here soon.
      </p>
    </main>
  );
}
