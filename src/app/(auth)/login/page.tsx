import { Suspense } from "react";
import LoginForm from "./_form";

// LoginForm uses useSearchParams() — it must be rendered inside a Suspense
// boundary owned by a server component, not by another client component.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
