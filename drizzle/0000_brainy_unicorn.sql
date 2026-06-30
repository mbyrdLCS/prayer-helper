CREATE TYPE "public"."claim_status" AS ENUM('pending', 'approved', 'denied');--> statement-breakpoint
CREATE TYPE "public"."redeemed_status" AS ENUM('none', 'pending', 'approved');--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"name" text,
	"image_url" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"kid_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"author_name" text,
	"day" date,
	"kid_id" integer,
	"body" text NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_selection_kids" (
	"id" serial PRIMARY KEY NOT NULL,
	"selection_id" integer NOT NULL,
	"kid_id" integer NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" date NOT NULL,
	"start_index" integer DEFAULT 0 NOT NULL,
	"next_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_selections_day_unique" UNIQUE("day")
);
--> statement-breakpoint
CREATE TABLE "kids" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"blurb" text,
	"prayer_request" text,
	"photo_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"claimed_by" text,
	"redeemed" "redeemed_status" DEFAULT 'none' NOT NULL,
	"redeemed_note" text,
	"redeemed_at" timestamp with time zone,
	"needs_review" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"kid_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_kid_id_kids_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_kid_id_kids_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_selection_kids" ADD CONSTRAINT "daily_selection_kids_selection_id_daily_selections_id_fk" FOREIGN KEY ("selection_id") REFERENCES "public"."daily_selections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_selection_kids" ADD CONSTRAINT "daily_selection_kids_kid_id_kids_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayers" ADD CONSTRAINT "prayers_kid_id_kids_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_day_idx" ON "comments" USING btree ("day");--> statement-breakpoint
CREATE INDEX "comments_kid_idx" ON "comments" USING btree ("kid_id");--> statement-breakpoint
CREATE INDEX "dsk_selection_idx" ON "daily_selection_kids" USING btree ("selection_id");--> statement-breakpoint
CREATE INDEX "kids_sort_idx" ON "kids" USING btree ("sort_order","id");--> statement-breakpoint
CREATE INDEX "kids_redeemed_idx" ON "kids" USING btree ("redeemed");--> statement-breakpoint
CREATE INDEX "prayers_day_idx" ON "prayers" USING btree ("day");