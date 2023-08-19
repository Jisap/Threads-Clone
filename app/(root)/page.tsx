//app/page.tsx
import { fetchPosts } from "@/lib/actions/thread.actions";
import { UserButton, currentUser } from "@clerk/nextjs";

import ThreadCard from "@/components/cards/ThreadCard";
import { fetchUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import Pagination from "@/components/shared/Pagination";

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | undefined }}) {
  
  const user = await currentUser();
  if (!user) return null;
  
  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const result = await fetchPosts( searchParams.page ? +searchParams.page : 1, 30 ); // Threads

  return (
    <>
      <h1 className="head-text text-left">Home</h1>
   
      <section className="mt-9 flex flex-col gap-10">
        {result.posts.length === 0 ? (
          <p className="no-results">No Threads found</p>
        ):(
          <>
            { result.posts.map((post) => (
              <ThreadCard 
                key={post._id} // id del thread
                currentUserId={user?.id}
                id={post._id}
                parentId={post.parentId} 
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children} // Los children de cada thread son los comentarios que tiene cada thread
              />
            ))}
          </>
        )}
      </section>

      <Pagination
        path='/'
        pageNumber={searchParams?.page ? +searchParams.page : 1}
        isNext={result.isNext}
      />
    </>
  )
}