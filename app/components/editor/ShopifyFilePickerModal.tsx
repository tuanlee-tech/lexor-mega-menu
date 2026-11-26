import { useCallback, useEffect, useState } from "react";
import {
  BlockStack,
  Button,
  DropZone,
  InlineStack,
  Modal,
  Spinner,
  Text,
  TextField,
} from "@shopify/polaris";
import { useI18n } from "../../lib/i18n";

interface ShopifyFileNode {
  id: string;
  alt?: string;
  image?: {
    url: string;
    width: number;
    height: number;
  };
}

interface ShopifyFilePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (file: { url: string; filename?: string }) => void;
}

export function ShopifyFilePickerModal({
  open,
  onClose,
  onSelect,
}: ShopifyFilePickerModalProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<ShopifyFileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchFiles = useCallback(async (queryText: string, cursor?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (queryText.trim()) params.set("search", queryText.trim());
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/shopify-files?${params.toString()}`);
      const json = await res.json();
      const edges = (json.edges || []) as { node: ShopifyFileNode }[];
      const nodes = edges.map((e) => e.node).filter((n) => n.image?.url);
      setFiles((prev) => (cursor ? [...prev, ...nodes] : nodes));
      setHasNextPage(Boolean(json.pageInfo?.hasNextPage));
      setEndCursor(json.pageInfo?.endCursor || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Shopify Files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchFiles("");
    }
  }, [open, fetchFiles]);

  const handleDrop = useCallback(
    async (_dropFiles: File[], acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setUploading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/shopify-files", {
          method: "POST",
          body: fd,
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Upload failed");
        }
        onSelect({ url: json.url, filename: json.filename });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onSelect, onClose]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("filePickerTitle")}
      size="large"
      secondaryActions={[{ content: t("close"), onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <DropZone
            allowMultiple={false}
            accept="image/*"
            type="image"
            onDrop={handleDrop}
            disabled={uploading}
          >
            {uploading ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <Spinner size="small" />
                <Text as="p" variant="bodySm">
                  {t("filePickerUploading")}
                </Text>
              </div>
            ) : (
              <DropZone.FileUpload actionHint={t("filePickerDropHint")} />
            )}
          </DropZone>

          {error && (
            <Text as="p" tone="critical" variant="bodySm">
              {error}
            </Text>
          )}

          <InlineStack gap="200" blockAlign="end">
            <div style={{ flex: 1 }}>
              <TextField
                label={t("search")}
                labelHidden
                placeholder={t("filePickerSearchPlaceholder")}
                value={search}
                onChange={setSearch}
                autoComplete="off"
              />
            </div>
            <Button onClick={() => fetchFiles(search, null)} loading={loading}>
              {t("search")}
            </Button>
          </InlineStack>

          {loading && files.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <Spinner />
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                gap: "12px",
                maxHeight: "340px",
                overflowY: "auto",
                padding: "4px",
              }}
            >
              {files.map((file) => {
                const imgUrl = file.image?.url || "";
                const basename = imgUrl.split("?")[0].split("/").pop() || "";
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => {
                      onSelect({ url: imgUrl, filename: basename });
                      onClose();
                    }}
                    style={{
                      border: "1px solid #E1E3E5",
                      borderRadius: "8px",
                      padding: "6px",
                      background: "#FFF",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <img
                      src={`${imgUrl}${imgUrl.includes("?") ? "&" : "?"}width=160`}
                      alt={file.alt || basename}
                      style={{
                        width: "88px",
                        height: "88px",
                        objectFit: "contain",
                        borderRadius: "4px",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#4B5563",
                        maxWidth: "96px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={basename}
                    >
                      {basename}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {hasNextPage && endCursor && (
            <InlineStack align="center">
              <Button
                onClick={() => fetchFiles(search, endCursor)}
                loading={loading}
              >
                {t("filePickerLoadMore")}
              </Button>
            </InlineStack>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
