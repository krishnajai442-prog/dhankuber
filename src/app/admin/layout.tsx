export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Loading } from "@/components/shared/Loading";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Loading text="Loading admin..." />}>
      {children}
    </Suspense>
  );
}