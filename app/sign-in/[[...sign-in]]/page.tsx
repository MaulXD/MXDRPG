import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { isClerkEnabled } from "@/lib/auth/clerk-config";

export default function SignInPage() {
  if (!isClerkEnabled()) redirect("/entrar");

  return (
    <div className="page-wrap" style={{ display: "flex", justifyContent: "center", paddingTop: "2rem" }}>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  );
}
