import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { isClerkEnabled } from "@/lib/auth/clerk-config";

export default function SignUpPage() {
  if (!isClerkEnabled()) redirect("/entrar");

  return (
    <div className="page-wrap" style={{ display: "flex", justifyContent: "center", paddingTop: "2rem" }}>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
