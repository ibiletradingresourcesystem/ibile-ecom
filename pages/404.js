import Head from "next/head";
import StatusPage from "@/components/feedback/StatusPage";

export default function NotFoundPage() {
  return (
    <>
      <Head><title>Page Not Found | IbileMart Store</title></Head>
      <StatusPage
        code="404"
        title="This page is not in the aisle."
        message="The page may have moved, or the address may be incorrect."
      />
    </>
  );
}