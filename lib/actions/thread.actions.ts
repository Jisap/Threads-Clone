"use server"

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";


interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string,
}

export async function createThread({
    text, 
    author, 
    communityId,
    path
}:Params){

    
    try {
        connectToDB();

        const createdThread = await Thread.create({
            text,
            author,
            community: null
        });

        await User.findByIdAndUpdate(author, {$push: {threads: createdThread._id}}); // Actualización User model

        revalidatePath(path)

    } catch ( error:any ) {
        throw new Error(`Error creating thread: ${error.message}`)
    }

}

export async function fetchPosts( pageNumber = 1, pageSize = 20 ){

    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;  // Calculamos el número de post que hay que pasar

    const postsQuery = Thread.find({ parentId: {$in: [null, undefined]}}) //Buscamos los post que no tengan parents ( top-level threads)
        .sort({ createdAt: 'desc' })                                      // Orden descendiente
        .skip(skipAmount)                                                 // desde donde mostramos los posts
        .limit(pageSize)
        .populate({path: 'author', model: User})                          // populate del autor de cada post
        .populate({                                                       // populate de los children de cada thread      
            path: 'children',
            populate: {                                                   // populate dentro de cada thread children   
                path: 'author',                                           // del campo author  
                model: User,                                              // referenciado al modelo User  
                select: "_id name parentId image"                         // y mostrando su _id, name, parentId y su image
            
        }
    })

    const totalPostCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } })

    const posts = await postsQuery.exec();

    const isNext = totalPostCount > skipAmount + posts.length;

    return { posts, isNext}
}

export async function fetchThreadById( id:string ){
    connectToDB();

    try {
        //TODO: Populate Community
        const thread = await Thread.findById(id)   
            .populate({
                path: 'author',
                model: User,
                select: "_id id name image"
            }) 
            .populate({
                path: 'children',
                populate: [
                    {
                        path: 'author', // Autor del comentario
                        model: User,
                        select: "_id id name parentId image"
                    },
                    {
                        path: 'children',   // [] con los comentarios del autor del anterior comentario
                        model: Thread,
                        populate:{
                            path: 'author',
                            model: User,
                            select: "_id id name parentId image"
                        }
                    }
                ]
            }).exec();

            return thread;

    } catch (error: any) {
        throw new Error(`Error fetching Thread: ${error.message}`)
    }
}