import { redirect } from "next/navigation";

// The dashboard is not part of this prototype; it shows the shared notice page.
export default function Page() {
  redirect("/menu/dashboard");
}
