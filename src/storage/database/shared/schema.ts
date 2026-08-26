import { sql } from "drizzle-orm";
import { pgTable, serial, varchar, text, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// AI Agent 配置表
export const agentConfig = pgTable(
  "agent_config",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull().default("默认配置"),
    system_prompt: text("system_prompt").notNull().default(""),
    tone: varchar("tone", { length: 50 }).notNull().default("亲切"),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("agent_config_is_active_idx").on(table.is_active),
  ]
);

// 知识库/FAQ 表
export const knowledgeBase = pgTable(
  "knowledge_base",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    category: varchar("category", { length: 100 }).default(""),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_base_category_idx").on(table.category),
    index("knowledge_base_is_active_idx").on(table.is_active),
  ]
);

// 对话记录表
export const conversations = pgTable(
  "conversations",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    customer_id: varchar("customer_id", { length: 100 }).notNull(),
    customer_name: varchar("customer_name", { length: 200 }).default(""),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    is_transferred: boolean("is_transferred").notNull().default(false),
    transferred_to: varchar("transferred_to", { length: 200 }).default(""),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("conversations_customer_id_idx").on(table.customer_id),
    index("conversations_status_idx").on(table.status),
    index("conversations_created_at_idx").on(table.created_at),
  ]
);

// 消息记录表
export const messages = pgTable(
  "messages",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    conversation_id: varchar("conversation_id", { length: 36 }).notNull().references(() => conversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    content: text("content").notNull(),
    is_manual: boolean("is_manual").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_conversation_id_idx").on(table.conversation_id),
    index("messages_created_at_idx").on(table.created_at),
  ]
);

// 转人工规则表
export const transferRules = pgTable(
  "transfer_rules",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    keyword: varchar("keyword", { length: 100 }).notNull(),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("transfer_rules_keyword_idx").on(table.keyword),
    index("transfer_rules_is_active_idx").on(table.is_active),
  ]
);

// 通知目标表
export const notificationTargets = pgTable(
  "notification_targets",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    wecom_userid: varchar("wecom_userid", { length: 100 }).notNull(),
    is_active: boolean("is_active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notification_targets_is_active_idx").on(table.is_active),
  ]
);
