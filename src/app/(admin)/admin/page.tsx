import React from "react";
import AdminDashboard from "./_components/AdminDashboard";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  return <AdminDashboard />;
}
