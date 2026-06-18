"use client";

import "./oauth-buttons.css";

type Props = {
  redirect?: string;
  providers: ("google" | "discord")[];
};

export function OAuthSignInButtons({ redirect = "", providers }: Props) {
  if (providers.length === 0) return null;

  const q = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";

  return (
    <div className="oauth-buttons">
      <p className="oauth-buttons__eyebrow">Ou entre com</p>
      <div className="oauth-buttons__row">
        {providers.includes("google") ? (
          <a className="btn btn-secondary oauth-buttons__btn" href={`/api/auth/oauth/google${q}`}>
            Google
          </a>
        ) : null}
        {providers.includes("discord") ? (
          <a className="btn btn-secondary oauth-buttons__btn" href={`/api/auth/oauth/discord${q}`}>
            Discord
          </a>
        ) : null}
      </div>
    </div>
  );
}
