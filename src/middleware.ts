import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: ["/site", "/api/uploadthing"],
  
  //   async beforeAuth(auth, req) {},
  async afterAuth(auth, req) {

    /* ========== Get the URL and search parameters from the request  ========== */
    const url = req.nextUrl;
    const searchParams = url.searchParams.toString();
    
    /* ========== Get the hostname (e.g., "sub.example.com") from the request headers  ========== */
    let hostname = req.headers.get("host");
    
    /* ========== Concatenate the URL path with search parameters, if any  ========== */
    const pathWithSearchParams = `${url.pathname}${
      searchParams.length > 0 ? `?${searchParams}` : ""
    }`;
    
    /* ========== Extract the subdomain (if any) by splitting the hostname from the main domain  ========== */
    /* ========== Example: from "sub.example.com", it extracts "sub"  ========== */
    const customSubDomain = hostname
      ?.split(`${process.env.NEXT_PUBLIC_DOMAIN}`)         // Split based on the main domain
      .filter(Boolean)[0];                                 // Filter out any empty strings and grab the first part (the subdomain)

    /* ========== If there's a custom subdomain, rewrite the request URL  ========== */
    if (customSubDomain) {
      return NextResponse.rewrite(
        new URL(`/${customSubDomain}${pathWithSearchParams}`, req.url)
      );
    }

    /* ========== Redirect the user to the agency sign-in page if they're on the sign-in or sign-up pages  ========== */
    if (url.pathname === "/sign-in" || url.pathname === "/sign-up") {
      return NextResponse.redirect(new URL(`/agency/sign-in`, req.url));
    }

    /* ========== Rewrite the request to "/site" for the root route or the site homepage  ========== */
    /* ========== (when accessed on the main domain)  ========== */
    if (
      url.pathname === "/" ||
      (url.pathname === "/site" && url.host === process.env.NEXT_PUBLIC_DOMAIN)
    ) {
      return NextResponse.rewrite(new URL("/site", req.url));
    }

    /* ========== If the route starts with "/agency" or "/subaccounts", rewrite the request  ========== */
    /* ========== with the current path and search parameters  ========== */
    if (
      url.pathname.startsWith("/agency") ||
      url.pathname.startsWith("/subaccount")
    ) {
      return NextResponse.rewrite(new URL(`${pathWithSearchParams}`, req.url));
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
