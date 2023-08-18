"use server"


import { FilterQuery, SortOrder } from "mongoose";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose"
import { revalidatePath } from "next/cache";

interface Params {
    userId: string;
    username: string;
    name: string;
    bio: string;
    image: string;
    path: string;
}

export async function updateUser({
    userId,
    bio,
    name,
    path,
    username,
    image,
}:Params): Promise<void>{

    connectToDB();

    try {
        await User.findOneAndUpdate(
            {id: userId},                           // Usuario que se actualiza
            {
                username: username.toLowerCase(),   // Datos a actualizar
                name,
                bio,
                image,
                onboarded: true,
            },
            { upsert: true }                        //  Si no se encuentra ningún usuario con el ID proporcionado, se crea uno nuevo
        );
    
        if (path === "/profile/edit") { // Se invalida la cache de la ruta. Los usuarios verán la version más reciente de la página.
            revalidatePath(path);
        }       
    } catch (error: any) {
        throw new Error(`Failed to create/update user: ${error.message}`)
    }

}

export async function fetchUser( userId: string){ // id del clerk

    try {
        connectToDB();
        return await User
                        .findOne({id: userId})
                            // .populate({
                            //     path: 'communities',
                            //     model: Community
                            // })
    } catch (error:any) {
        throw new Error(`Failed to fetch user: ${error.message}`)
    }
}

export async function fetchUserPosts(userId: string) {
    try {
        connectToDB();

        const threads = await User.findOne({ id: userId }).populate({  // Find all threads authored by the user with the given userId
            path: "threads",
            model: Thread,
            populate: [
                // {
                //     path: "community",
                //     model: Community,
                //     select: "name id image _id", // Select the "name" and "_id" fields from the "Community" model
                // },
                {
                    path: "children",
                    model: Thread,
                    populate: {
                        path: "author",
                        model: User,
                        select: "name image id", // Select the "name" and "_id" fields from the "User" model
                    },
                },
            ],
        });
        return threads;
    } catch (error) {
        console.error("Error fetching user threads:", error);
        throw error;
    }
}

// Almost similar to Thead (search + pagination) and Community (search + pagination)
export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc",
}: {
    userId: string;
    searchString?: string;
    pageNumber?: number;
    pageSize?: number;
    sortBy?: SortOrder;
}) {
    try {
        connectToDB();

        const skipAmount = (pageNumber - 1) * pageSize;     // Calculate the number of users to skip based on the page number and page size.
   
        const regex = new RegExp(searchString, "i");        // Create a case-insensitive regular expression for the provided search string.

        const query: FilterQuery<typeof User> = {           // Create an initial query object to filter users.
            id: { $ne: userId },                            // Exclude the current user from the results.
        };

        
        if (searchString.trim() !== "") {                   // Si el término de busqueda tiene contenido
            query.$or = [                                   // añadimos al query el operador $or
                { username: { $regex: regex } },            // para que se busquen coincidencias con username y name en bd User
                { name: { $regex: regex } },
            ];
        }
     
        const sortOptions = { createdAt: sortBy };  // Define the sort options for the fetched users based on createdAt field and provided sort order.

        const usersQuery = User.find(query)         // Configuración final de la consulta a la bd.
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize);

        const totalUsersCount = await User.countDocuments(query);   // Count the total number of users that match the search criteria (without pagination).

        const users = await usersQuery.exec();                      // Ejecuta la consulta.
        
        const isNext = totalUsersCount > skipAmount + users.length; // Check if there are more users beyond the current page.

        return { users, isNext };
        
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
}