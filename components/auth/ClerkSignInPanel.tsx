"use client";

import { SignIn } from "@clerk/nextjs";
import { clerkSocialOnlyAppearance } from "@/lib/auth/clerk-appearance";

type Props = {
  signUpUrl: string;
  forceRedirectUrl: string;
};

export function ClerkSignInPanel({ signUpUrl, forceRedirectUrl }: Props) {
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl={signUpUrl}
      forceRedirectUrl={forceRedirectUrl}
      appearance={clerkSocialOnlyAppearance}
    />
  );
}
