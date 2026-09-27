import { redirect } from "next/navigation";

import { DASHBOARD_PATH } from "@/features/auth/lib/redirect";

/** "/" → dashboard (spec §8). Sem sessão, o proxy leva ao /login antes. */
export default function Home() {
  redirect(DASHBOARD_PATH);
}
