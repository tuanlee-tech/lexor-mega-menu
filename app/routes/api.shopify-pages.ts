import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const search = (url.searchParams.get("search") || "").trim();

  const res = await admin.graphql(
    `
    query SearchPages($query: String) {
      pages(first: 25, query: $query) {
        nodes {
          id
          title
          handle
        }
      }
    }
  `,
    { variables: { query: search || null } }
  );

  const json = await res.json();
  const pages = (json?.data?.pages?.nodes || []).map(
    (p: { id: string; title: string; handle: string }) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      url: `/pages/${p.handle}`,
    })
  );

  return new Response(JSON.stringify({ pages }), {
    headers: { "Content-Type": "application/json" },
  });
};
