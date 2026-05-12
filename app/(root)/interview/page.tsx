import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import React from "react";

const page = async () => {
  const user = await getCurrentUser();
  console.log(user);
  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <>
      <h3>Interview generation</h3>
      <Agent userName={user?.name || "User"} userId={user?.id} type="generate" />
    </>
  );
};

export default page;
