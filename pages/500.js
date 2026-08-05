import Head from "next/head";
import StatusPage from "@/components/feedback/StatusPage";

export default function ServerErrorPage() {
  return (
    <>
      <Head><title>Something Went Wrong | IbileMart Store</title></Head>
      <StatusPage
        code="500"
        title="We could not complete that request."
        message="Please try again shortly or continue browsing the store."
      />
    </>
  );
}