import { Suspense } from "react";
import { RespondPage } from "@/components/respond/RespondPage";

export const metadata = { title: "Meeting response · Global Wings" };

async function Respond({ searchParams }: { searchParams: PageProps<"/respond">["searchParams"] }) {
  const a = (await searchParams).a;
  return <RespondPage initial={a === "reject" ? "reject" : "accept"} />;
}

export default function Page({ searchParams }: PageProps<"/respond">) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page" />}>
      <Respond searchParams={searchParams} />
    </Suspense>
  );
}
