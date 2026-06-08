"use client";

import { SignUp } from "@clerk/nextjs";
import { clerkSocialOnlyAppearance } from "@/lib/auth/clerk-appearance";

type Props = {
  signInUrl: string;
  forceRedirectUrl: string;
};

export function ClerkSignUpPanel({ signInUrl, forceRedirectUrl }: Props) {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl={signInUrl}
      forceRedirectUrl={forceRedirectUrl}
      appearance={clerkSocialOnlyAppearance}
    />
  );
}
