import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // const response = await fetch("http://localhost:8080/api/getIsLoggedIn", {
  //   method: "GET",
  //   credentials: "include", // Include credentials (cookies) in the request
  // });
  // if (response.ok) {
  //   const data = await response.json();
  //   console.log(data.logged_in);
  //   if (data.logged_in) {
  //     // User is logged in, allow request to proceed
  //     return NextResponse.next();
  //   } else {
  //     return NextResponse.redirect(new URL("/login", request.url));
  //     // User is not logged in, redirect to login page
  //   }
  // } else {
  //   // Handle fetch error
  //   console.error("Failed to fetch login status");
  //   return NextResponse.error();
  // }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/admin", "/profile"],
};
