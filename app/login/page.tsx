import { LoginForm } from "../../components/LoginForm";

const fallbackErrorMessage =
  "We could not finish signing you in. Request a new magic link and try again.";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    message?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const message = Array.isArray(params.message) ? params.message[0] : params.message;

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center">
        <LoginForm initialMessage={error ? message || fallbackErrorMessage : ""} />
      </div>
    </main>
  );
}
