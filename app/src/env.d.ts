interface CloudflareEnv {
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?: string;
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?: string;
  CLOUDFLARE_AIG_TOKEN?: string;

  // ─── BIM Reviews Report · Notion integration ────────────────────
  /** Notion Internal Integration Token (SECRET — never commit). */
  NOTION_TOKEN?: string;
  /** ID of the Notion database that stores BIM Reviews Report entries. */
  NOTION_BIM_DATABASE_ID?: string;
  /** Optional Notion API version override (default 2022-06-28). */
  NOTION_VERSION?: string;
  /** Optional JSON map of BIMReview field -> Notion property name overrides. */
  NOTION_BIM_PROPERTY_MAP?: string;
}
