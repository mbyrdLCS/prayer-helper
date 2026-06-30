import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const claimStatus = pgEnum("claim_status", ["pending", "approved", "denied"]);
export const redeemedStatus = pgEnum("redeemed_status", ["none", "pending", "approved"]);

/** Mirror of Clerk users so we can join/display and track admin role. */
export const appUsers = pgTable("app_users", {
  id: text("id").primaryKey(), // Clerk user id
  email: text("email"),
  name: text("name"),
  imageUrl: text("image_url"),
  isAdmin: boolean("is_admin").notNull().default(false),
  approved: boolean("approved").notNull().default(false),
  emailDailyCard: boolean("email_daily_card").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A child on the prayer list (first name only — these are minors). */
export const kids = pgTable(
  "kids",
  {
    id: serial("id").primaryKey(),
    firstName: text("first_name").notNull(),
    blurb: text("blurb"),
    prayerRequest: text("prayer_request"),
    photoUrl: text("photo_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    hidden: boolean("hidden").notNull().default(false), // moderation / soft-delete
    claimedBy: text("claimed_by"), // app_users.id once a claim is approved
    redeemed: redeemedStatus("redeemed").notNull().default("none"),
    redeemedNote: text("redeemed_note"),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    needsReview: boolean("needs_review").notNull().default(false), // seeded-from-image flag
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sortIdx: index("kids_sort_idx").on(t.sortOrder, t.id),
    redeemedIdx: index("kids_redeemed_idx").on(t.redeemed),
  })
);

/** A parent's request to claim (be the contact for) a child. Requires admin approval. */
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  kidId: integer("kid_id").notNull().references(() => kids.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  status: claimStatus("status").notNull().default("pending"),
  message: text("message"),
  decidedBy: text("decided_by"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per day = the batch of kids featured that day. */
export const dailySelections = pgTable("daily_selections", {
  id: serial("id").primaryKey(),
  day: date("day").notNull().unique(),
  startIndex: integer("start_index").notNull().default(0),
  nextIndex: integer("next_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailySelectionKids = pgTable(
  "daily_selection_kids",
  {
    id: serial("id").primaryKey(),
    selectionId: integer("selection_id")
      .notNull()
      .references(() => dailySelections.id, { onDelete: "cascade" }),
    kidId: integer("kid_id").notNull().references(() => kids.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => ({ selIdx: index("dsk_selection_idx").on(t.selectionId) })
);

/** A "Prayed" tap. kidId null = prayed for the whole day's batch. */
/** A parent in the group — their own profile + prayer requests. Keyed by user. */
export const parents = pgTable("parents", {
  userId: text("user_id").primaryKey(), // app_users.id
  displayName: text("display_name"), // optional; blank = shown anonymously
  prayerRequest: text("prayer_request"),
  story: text("story"),
  photoUrl: text("photo_url"),
  openToPrayer: boolean("open_to_prayer").notNull().default(true),
  hidden: boolean("hidden").notNull().default(false), // moderation
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prayers = pgTable(
  "prayers",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    day: date("day").notNull(),
    kidId: integer("kid_id").references(() => kids.id, { onDelete: "cascade" }),
    parentId: text("parent_id"), // praying for a parent (their user id)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ dayIdx: index("prayers_day_idx").on(t.day) })
);

/** Comments on a day's prayer, a kid's profile, or a parent's profile. */
export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    authorName: text("author_name"),
    day: date("day"),
    kidId: integer("kid_id").references(() => kids.id, { onDelete: "cascade" }),
    parentId: text("parent_id"), // comment on a parent's profile
    body: text("body").notNull(),
    hidden: boolean("hidden").notNull().default(false), // moderation
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    dayIdx: index("comments_day_idx").on(t.day),
    kidIdx: index("comments_kid_idx").on(t.kidId),
  })
);

/** Admin-authored questions for the parent "insights" page (anonymous polling). */
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questionOptions = pgTable(
  "question_options",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({ qIdx: index("question_options_q_idx").on(t.questionId) })
);

/** One current answer per user per question (can be changed over time). */
export const questionResponses = pgTable(
  "question_responses",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    optionId: integer("option_id").notNull().references(() => questionOptions.id, { onDelete: "cascade" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ uniq: uniqueIndex("question_responses_user_q_uniq").on(t.questionId, t.userId) })
);

/** Simple key/value app settings editable by admins (e.g. daily_count). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Kid = typeof kids.$inferSelect;
export type AppUser = typeof appUsers.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Parent = typeof parents.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuestionOption = typeof questionOptions.$inferSelect;
