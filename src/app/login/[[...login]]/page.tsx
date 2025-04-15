import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col">
      <div className="flex flex-col justify-center items-center min-h-screen w-full">
        {/* Logo & Tagline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">iBudget</h1>
          <p className="text-grayNeutral mt-2 text-sm">
            Be in control of your money
          </p>
        </div>

        {/* Sign-In Card */}
        <SignIn path="/login" routing="path" />
        
      </div>
    </main>
  );
}