"use server"


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