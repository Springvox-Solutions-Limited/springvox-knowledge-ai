import { redirect } from "next/navigation";

// `/get-started` is consolidated into the redesigned `/register` onboarding so
// there is a single, consistent sign-up experience. Existing links/bookmarks
// keep working via this redirect.
export default function GetStartedPage() {
  redirect("/register");
}
