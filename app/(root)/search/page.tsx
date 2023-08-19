import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";


// import Pagination from "@/components/shared/Pagination";

import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import { UserCard } from "@/components/cards/UserCard";
import Searchbar from "@/components/shared/Searchbar";
import Pagination from "@/components/shared/Pagination";

// Se reciben los searchParams desde el componente Searchbar
const Page = async({ searchParams }: { searchParams: { [key: string]: string | undefined };}) => {
  
    const user = await currentUser();
    if (!user) return null;

    const userInfo = await fetchUser(user.id);
    if (!userInfo?.onboarded) redirect("/onboarding");

    const result = await fetchUsers({                           // Se realiza la petición de busqueda de usuarios a la bd según searchParams 
        userId: user.id,                                        // Sino hay searchParams se devuelven todos los usuarios de bd
        searchString: searchParams.q,
        pageNumber: searchParams?.page ? +searchParams.page : 1,
        pageSize: 25,
    });
  
    return (
        <section>
            <h1 className="head-text mb-10">Search</h1>

            <Searchbar routeType='search' />

            <div className="mt-14 flex flex-col gap-9">
                {result.users.length === 0 ? (
                    <p className='no-result'>No Result</p>
                ):(
                    <>
                        {result.users.map((person) => (
                            <UserCard
                                key={person.id}
                                id={person.id}
                                name={person.name}
                                username={person.username}
                                imgUrl={person.image}
                                personType='User'
                            />
                        ))}
                    </>    
                )}
            </div>

            <Pagination
                path='search'
                pageNumber={searchParams?.page ? +searchParams.page : 1}
                isNext={result.isNext}
            />

        </section>
  )
}

export default Page