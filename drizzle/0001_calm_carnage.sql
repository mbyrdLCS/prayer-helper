CREATE TABLE "parents" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"prayer_request" text,
	"story" text,
	"photo_url" text,
	"open_to_prayer" boolean DEFAULT true NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"option_id" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "prayers" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_option_id_question_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."question_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "question_options_q_idx" ON "question_options" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "question_responses_user_q_uniq" ON "question_responses" USING btree ("question_id","user_id");