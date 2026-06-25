import { redirect } from "next/navigation";

export default function IndustryPage({ params }: { params: Promise<{ industry: string }> }) {
  // Redirect to advertisers view as default
  return params.then(({ industry }) => {
    redirect(`/${industry}/advertisers`);
  });
}
