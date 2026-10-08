import type { Metadata } from "next";
import SignInForm from "../_components/SignInForm";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <SignInForm />;
}
