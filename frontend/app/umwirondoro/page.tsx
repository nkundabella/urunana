import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverApiFetch, type AuthMeResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function UmwirondoroIndexPage() {
  const cookieHeader = (await headers()).get("cookie");
  try {
    const me = await serverApiFetch<AuthMeResponse>(
      "/api/v1/auth/me",
      cookieHeader
    );
    if (me.user?.username) {
      redirect(`/umwirondoro/${me.user.username}`);
    }
  } catch {
    // fall through to default showcase profile
  }
  redirect("/umwirondoro/kalisa_m");
}
