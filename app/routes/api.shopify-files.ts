import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const search = (url.searchParams.get("search") || "").trim();
  const cursor = url.searchParams.get("cursor");

  const query = `
    query GetShopifyImageFiles($first: Int!, $query: String, $after: String) {
      files(first: $first, query: $query, after: $after, sortKey: CREATED_AT, reverse: true) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            alt
            createdAt
            fileStatus
            ... on MediaImage {
              image {
                url
                width
                height
              }
            }
          }
        }
      }
    }
  `;

  let searchQuery = "media_type:IMAGE";
  if (search) {
    searchQuery = `(media_type:IMAGE) AND ${search}`;
  }

  const response = await admin.graphql(query, {
    variables: {
      first: 30,
      query: searchQuery,
      after: cursor || null,
    },
  });

  const data = await response.json();
  return new Response(JSON.stringify(data.data?.files || { edges: [], pageInfo: {} }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Request staged upload target
  const stagedRes = await admin.graphql(
    `
    mutation StagedUpload($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
    {
      variables: {
        input: [
          {
            filename: file.name,
            mimeType: file.type || "image/png",
            httpMethod: "POST",
            resource: "IMAGE",
            fileSize: String(file.size),
          },
        ],
      },
    }
  );

  const stagedJson = await stagedRes.json();
  const target = stagedJson?.data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target) {
    return new Response(
      JSON.stringify({
        error:
          stagedJson?.data?.stagedUploadsCreate?.userErrors?.[0]?.message ||
          "Failed to create staged upload",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Upload file bytes to staged target
  const uploadForm = new FormData();
  for (const param of target.parameters) {
    uploadForm.append(param.name, param.value);
  }
  uploadForm.append("file", file);

  const uploadRes = await fetch(target.url, {
    method: "POST",
    body: uploadForm,
  });

  if (!uploadRes.ok) {
    return new Response(
      JSON.stringify({ error: `Staged upload failed (${uploadRes.status})` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Register file in Shopify Files
  const createRes = await admin.graphql(
    `
    mutation CreateFile($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
          ... on MediaImage {
            image {
              url
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
    {
      variables: {
        files: [
          {
            alt: file.name,
            contentType: "IMAGE",
            originalSource: target.resourceUrl,
          },
        ],
      },
    }
  );

  const createJson = await createRes.json();
  const createdFile = createJson?.data?.fileCreate?.files?.[0];
  if (!createdFile) {
    return new Response(
      JSON.stringify({
        error:
          createJson?.data?.fileCreate?.userErrors?.[0]?.message ||
          "Failed to create Shopify file",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Poll briefly (up to 4s) for CDN URL to be ready
  let finalUrl: string | undefined = createdFile?.image?.url;
  if (!finalUrl && createdFile.id) {
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((r) => setTimeout(r, 800));
      const pollRes = await admin.graphql(
        `
        query PollFile($id: ID!) {
          node(id: $id) {
            ... on MediaImage {
              fileStatus
              image { url }
            }
          }
        }
      `,
        { variables: { id: createdFile.id } }
      );
      const pollJson = await pollRes.json();
      if (pollJson?.data?.node?.image?.url) {
        finalUrl = pollJson.data.node.image.url;
        break;
      }
    }
  }

  return new Response(
    JSON.stringify({
      id: createdFile.id,
      url: finalUrl || target.resourceUrl,
      filename: file.name,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
