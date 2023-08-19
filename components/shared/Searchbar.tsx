"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "../ui/input";

interface Props {
    routeType: string;
}

function Searchbar({ routeType }: Props) {  // Este componente se renderiza en páginas: /search y /communities
    const router = useRouter();
    const [search, setSearch] = useState("");

    // query after 0.3s of no input
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search) {                                 // Si existe una busqueda
                router.push(`/${routeType}?q=` + search); // redirección /página con q=busqueda -> fetchComunities con ella
            } else {
                router.push(`/${routeType}`);             // Sino redirección a /página  y fetch de los users o communities de cada página
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, routeType]);

    return (
        <div className='searchbar'>
            <Image
                src='/assets/search-gray.svg'
                alt='search'
                width={24}
                height={24}
                className='object-contain'
            />
            <Input
                id='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${routeType !== "search" ? "Search communities" : "Search creators"}`}
                className='no-focus searchbar_input'
            />
        </div>
    );
}

export default Searchbar;