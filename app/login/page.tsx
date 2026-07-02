import { LoginForm } from "../../components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center">
        <LoginForm />
      </div>
    </main>
  );
}
