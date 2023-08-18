import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";
import { fetchUser } from "@/lib/actions/user.actions";

import React from 'react'

const Page = async ({ searchParams }: { searchParams: { [key: string]: string | undefined }; }) => {

    const user = await currentUser();
    if (!user) return null;

    const userInfo = await fetchUser(user.id);
    if (!userInfo?.onboarded) redirect("/onboarding");

    return (
        <section>
            <h1 className="head-text mb-10">Activity</h1>
        </section>
    )
}

export default Page