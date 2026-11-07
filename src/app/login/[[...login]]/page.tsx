import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-start md:grid md:grid-cols-2 md:justify-stretch">
        <section className="flex flex-col justify-center px-8 pb-4 pt-8 md:px-12 md:py-16">
          <p className="text-2xl font-semibold text-brand">iBudget</p>
          <h1 className="mt-4 max-w-sm text-3xl font-semibold tracking-tight text-ink md:mt-6 md:text-4xl">
            Be in control of your money
          </h1>
          <p className="mt-3 max-w-sm text-sm text-muted md:mt-4">
            Accounts, a monthly plan, and a dashboard — one currency at a time, or all of them converted home.
          </p>
        </section>
        <section className="flex items-center justify-center bg-surface px-4 pb-6 pt-2 md:border-l md:border-line md:py-12">
          <SignIn path="/login" routing="path" />
        </section>
      </div>
    </main>
  );
}
