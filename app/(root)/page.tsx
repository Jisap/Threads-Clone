//app/page.tsx
import { fetchPosts } from "@/lib/actions/thread.actions";
import { UserButton, currentUser } from "@clerk/nextjs";
import Community from '../../lib/models/community.model';
import ThreadCard from "@/components/cards/ThreadCard";

export default async function Home() {

  
    const result = await fetchPosts(1, 30);
    const user = await currentUser();
    if (!user) return null;
  

  return (
    <>
      <h1 className="head-text text-left">Home</h1>
      {/* <UserButton afterSignOutUrl="/" /> */}
      <section className="mt-9 flex flex-col gap-10">
        {result.posts.length === 0 ? (
          <p className="no-results">No Threads found</p>
        ):(
          <>
            { result.posts.map((post) => (
              <ThreadCard 
                key={post.id}
                currentUserId={user?.id}
                id={post.id}
                parentId={post.parentId} 
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
              />
            ))}
          </>
        )}
      </section>
    </>
  )
}