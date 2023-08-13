
import { generateReactHelpers } from "@uploadthing/react/hooks"; // hooks personalizados de uploadthing para react

import type { OurFileRouter } from "@/app/api/uploadthing/core"; // Configuración de rutas de uploadthing

export const { useUploadThing, uploadFiles } = generateReactHelpers < OurFileRouter > (); // exportación de los hooks + configuración