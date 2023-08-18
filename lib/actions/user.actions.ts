"use server"


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