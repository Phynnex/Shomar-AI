export default function BookDemoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16 text-slate-900">
      <h1 className="text-3xl font-semibold">Book a Demo</h1>
      <p className="text-sm text-slate-600">
        Schedule a personalised walkthrough of Shomar’s AI security platform. Provide your preferred times at{' '}
        <a href="mailto:sales@shomarsec.com" className="text-blue-600 hover:underline">sales@shomarsec.com</a> and our
        team will confirm shortly.
      </p>
    </main>
  );
}
