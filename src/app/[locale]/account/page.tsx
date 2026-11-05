import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/session";
import { ProfileClient } from "@/components/account/ProfileClient";

export const metadata = { title: "Profile", robots: { index: false } };

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(await currentUserId())) redirect(`/${locale}/login?callbackUrl=/${locale}/account`);
  return <ProfileClient />;
}
