import React from "react";
import QRScannerPage from "./client-page";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const page = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return <QRScannerPage />;
};

export default page;
