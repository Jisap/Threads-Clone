import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({

    publicRoutes: ['/', '/api/webhook/clerk'], // An array of public routes that don't require authentication.
    
    ignoredRoutes: ['/api/webhook/clerk']      // An array of routes to be ignored by the authentication middleware.
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
