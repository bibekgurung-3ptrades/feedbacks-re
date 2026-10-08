export { moduleProxy as proxy } from "@captify-io/sdk/next";

// Everything passes the gate except the health check, which answers nothing about anyone.
// Under a basePath, the lookahead pattern does not match the module's root, so it is listed too.
export const config = { matcher: ["/", "/((?!api/health$).*)"] };
