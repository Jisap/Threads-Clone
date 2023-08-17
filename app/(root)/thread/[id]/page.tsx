import ThreadCard from '@/components/cards/ThreadCard'
import Comment from '@/components/forms/Comment';
import { fetchThreadById } from '@/lib/actions/thread.actions';
import { fetchUser } from '@/lib/actions/user.actions';
import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';


const Page = async ({ params }: { params: {id: string}}) => { // Se recibe el id del thread

  if(!params.id) return null;

  const user = await currentUser(); // Usuario logueado con clerk
  if(!user) return null;

  const userInfo = await fetchUser(user.id); // Info en bd según id de usuario logueado
  if (!userInfo?.onboarded) redirect("/onboarding");  

  const thread = await fetchThreadById(params.id); // Obtenemos la info del thread según id del thread

  return ( 
    <section className='relative'>
        <div>
            <ThreadCard
                id={thread.id}                  // id del thread en bd
                currentUserId={user.id}         // usuario logueado
                parentId={thread.parentId}
                content={thread.text}
                author={thread.author}
                community={thread.community}
                createdAt={thread.createdAt}
                comments={thread.children}
            />
        </div>

        <div className='mt-7'>
            <Comment
                threadId={params.id}
                currentUserImg={userInfo.image}
                currentUserId={JSON.stringify(userInfo._id)} // usuario logueado
            />
        </div>

          <div className='mt-10'>
              {thread.children.map((childItem: any) => (
                  <ThreadCard
                      key={childItem._id}
                      id={childItem._id}
                      currentUserId={user.id}
                      parentId={childItem.parentId}
                      content={childItem.text}
                      author={childItem.author}
                      community={childItem.community}
                      createdAt={childItem.createdAt}
                      comments={childItem.children}
                      isComment
                  />
              ))}
          </div>
    </section>
  )
}

export default Page