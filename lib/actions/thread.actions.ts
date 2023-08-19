"use server"

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Community from "../models/community.model";


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

        const communityIdObject = await Community.findOne(
            { id: communityId },
            { _id: 1 }
        );

        const createdThread = await Thread.create({
            text,
            author,
            community: communityIdObject,
        });

        //Update User model
        await User.findByIdAndUpdate(author, {$push: {threads: createdThread._id}}); // Actualización User model

        // Update Community model
        if (communityIdObject) {
            await Community.findByIdAndUpdate(communityIdObject, {
                $push: { threads: createdThread._id },
            });
        }

        revalidatePath(path)

    } catch ( error:any ) {
        throw new Error(`Error creating thread: ${error.message}`)
    }

}

export async function fetchPosts( pageNumber = 1, pageSize = 20 ){

    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;  // Calculamos el número de post que hay que pasar

    const postsQuery = Thread.find({ parentId: {$in: [null, undefined]}}) // Buscamos los post que no tengan parents ( top-level threads)
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
        .populate({
            path: "community",
            model: Community,
        })

    const totalPostCount = await Thread.countDocuments({ parentId: { $in: [null, undefined] } })

    const posts = await postsQuery.exec();

    const isNext = totalPostCount > skipAmount + posts.length;

    return { posts, isNext}
}

export async function fetchThreadById( id:string ){
    connectToDB();

    try {
        
        const thread = await Thread.findById(id)   
            .populate({
                path: 'author',
                model: User,
                select: "_id id name image"
            }) 
            .populate({
                path: "community",
                model: Community,
                select: "_id id name image",
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

export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string
) {
    connectToDB();

    try {
        
        const originalThread = await Thread.findById(threadId);  // Find the original thread by its ID

        if (!originalThread) {
            throw new Error("Thread not found");
        }
    
        const commentThread = new Thread({  // Create the new comment thread
            text: commentText,
            author: userId,
            parentId: threadId, // Set the parentId to the original thread's ID
        });
     
        const savedCommentThread = await commentThread.save();  // Save the comment thread to the database
     
        originalThread.children.push(savedCommentThread._id);   // Add the comment thread's ID to the original thread's children array
       
        await originalThread.save();                            // Save the updated original thread to the database

        revalidatePath(path);
        
    } catch (err) {
        console.error("Error while adding comment:", err);
        throw new Error("Unable to add comment");
    }
}

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
    const childThreads = await Thread.find({ parentId: threadId });

    const descendantThreads = [];
    for (const childThread of childThreads) {
        const descendants = await fetchAllChildThreads(childThread._id);
        descendantThreads.push(childThread, ...descendants);
    }

    return descendantThreads;
}

export async function deleteThread(id: string, path: string): Promise<void> {
    try {
        connectToDB();
        
        const mainThread = await Thread.findById(id).populate("author community");  // Find the thread to be deleted (the main thread)

        if (!mainThread) {
            throw new Error("Thread not found");
        }

        const descendantThreads = await fetchAllChildThreads(id);   // Fetch all child threads and their descendants recursively

        const descendantThreadIds = [                               // Get all descendant thread IDs including the main thread ID and child thread IDs
            id,
            ...descendantThreads.map((thread) => thread._id),
        ];

        // Extract the authorIds and communityIds to update User and Community models respectively
        const uniqueAuthorIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
                mainThread.author?._id?.toString(),
            ].filter((id) => id !== undefined)
        );

        const uniqueCommunityIds = new Set(
            [
                ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
                mainThread.community?._id?.toString(),
            ].filter((id) => id !== undefined)
        );

        await Thread.deleteMany({ _id: { $in: descendantThreadIds } });     // Recursively delete child threads and their descendants

        // Update User model
        await User.updateMany(
            { _id: { $in: Array.from(uniqueAuthorIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
        );

        // Update Community model
        await Community.updateMany(
            { _id: { $in: Array.from(uniqueCommunityIds) } },
            { $pull: { threads: { $in: descendantThreadIds } } }
        );

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Failed to delete thread: ${error.message}`);
    }
}