"use client"

import Image from "next/image";
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserValidation } from "@/lib/validations/user";
import { z } from "zod";
import { ChangeEvent, useState } from "react";
import { Textarea } from "../ui/textarea";
import { isBase64Image } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useUploadThing } from '@/lib/uploadthing';
import { updateUser } from "@/lib/actions/user.action";

interface Props {
  user: {
    id: string;
    objectId: string;
    username: string;
    name: string;
    bio: string;
    image: string;
  }
  btnTitle: string
}

const AccountProfile = ({ user, btnTitle }:Props) => {

  const router = useRouter();
  const pathname = usePathname();
  const { startUpload } = useUploadThing("media"); // Del hook personalizado de uploadThing usamos startUpload que permite la subida del archivo



  const [files, setFiles] = useState<File[]>([]);

  const form = useForm({                              // TypeScript-first schema validation
    resolver: zodResolver(UserValidation),
    defaultValues:{
      profile_photo: user?.image || '',
      name: user?.name || '',
      username: user?.username || '',
      bio: user?.bio || '',
    }
  });

  const handleImage = (e:ChangeEvent<HTMLInputElement>, fieldChange: (value:string) => void) => { // Función para establecer estado del file seleccionado
    e.preventDefault();                                                                           // y actualizar el value del campo del formulario
    
    const fileReader = new FileReader();                // Instancia lector de datos de la imagen

    if (e.target.files && e.target.files.length > 0) {  // si el evento contiene datos y alguno a sido seleccionado
      const file = e.target.files[0];                   // almacenamos en file el archivo seleccionado
      setFiles(Array.from(e.target.files));             // y establecemos estado desde el [] de archivos seleccionados

      if (!file.type.includes("image")) return;         // Si el archivo seleccionado no es una imagen return

      fileReader.onload = async (event) => {                          // Cuando se complete la lectura del archivo (CB)
        const imageDataUrl = event.target?.result?.toString() || "";  // Se obtiene la URL de datos de la imagen codificada en base64.
        fieldChange(imageDataUrl);                                    // Se actualiza con ella el valor del campo en el formulario
      };

      fileReader.readAsDataURL(file); // Se inicia la lectura del archivo como una URL de datos, lo que permitirá convertir el archivo en una cadena codificada en base64.
    }
  }

  const onSubmit = async (values: z.infer<typeof UserValidation>) => {

    const blob = values.profile_photo;              // Extrae el valor de profile_photo de values y se lo asigna a blob

    const hasImageChanged = isBase64Image(blob);    // Si es una imagen válida en formato base64 y cumple con los formatos permitidos = true
    if (hasImageChanged) {                          // Si es así
      const imgRes = await startUpload(files);      // Iniciamos la subida del archivo con el hook de uploadthing (valida el usuario=logueado)

      if (imgRes && imgRes[0].fileUrl) {            // Si imgRes tiene un valor y contiene la prop fileUrl
        values.profile_photo = imgRes[0].fileUrl;   // Se actualiza la propiedad profile_phote en el objeto values con imagen cargada
      }
    }

    await updateUser({                              // Actualizamos en bd la info del user con los values del form
      name: values.name,
      path: pathname,
      username: values.username,
      userId: user.id,
      bio: values.bio,
      image: values.profile_photo,
    });

    if (pathname === "/profile/edit") {             // Si se accede a AccountProfile desde /profile/edit despues de actualizar volvemos atras 
      router.back();
    } else {
      router.push("/");                             // Si se accede desde cualquier otro sitio volvemos al home
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="flex flex-col justify-start gap-10"
      >
        <FormField
          control={form.control}
          name="profile_photo"
          render={({ field }) => (
            <FormItem className="flex items-center gap-4">
              <FormLabel className="account-form_image-label">

              { field.value ? (
                <Image 
                src={field.value}
                alt="profile photo"
                width={96}
                height={96}
                priority
                className="rounded-full object-contain"
                />
                ): (
                  <Image
                  src="/assets/profile.svg"
                  alt="profile photo"
                  width={24}
                  height={24}
                  className="object-contain"
                  />
                  )}
              </FormLabel>
              <FormControl className="flex-1 text-base-semibold text-gray-200">
                <Input 
                  type="file"
                  accept="image/*"
                  placeholder="Upload a photo" 
                  className="account-form_image-input"
                  onChange={(e) => handleImage(e, field.onChange)}
                />
              </FormControl>    
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 w-full">
              <FormLabel className="text-base-semibold text-light-2">Name</FormLabel> 
              <FormControl className="flex-1 text-base-semibold text-gray-200">
                <Input
                  type="text"
                  placeholder="Name"
                  className="account-form_input no_focus"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 w-full">
              <FormLabel className="text-base-semibold text-light-2">Username</FormLabel>
              <FormControl className="flex-1 text-base-semibold text-gray-200">
                <Input
                  type="text"
                  placeholder="Username"
                  className="account-form_input no_focus"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 w-full">
              <FormLabel className="text-base-semibold text-light-2">Bio</FormLabel>
              <FormControl className="flex-1 text-base-semibold text-gray-200">
                <Textarea
                  rows={10}
                  placeholder="Bio"
                  className="account-form_input no_focus"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button 
          type="submit"
          className="bg-primary-500"
        >Submit</Button>
      </form>
    </Form>
  )
}

export default AccountProfile