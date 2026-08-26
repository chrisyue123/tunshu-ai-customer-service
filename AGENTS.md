# AGENTS.md - 囤鼠迷你仓 AI 智能客服系统

## 项目概览

企业微信 AI 智能客服管理后台，基于 Next.js 16 + Supabase + LLM 构建。支持 AI 自动回复客户消息、知识库管理、转人工配置、实时对话监控等功能。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19 + TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **AI**: coze-coding-dev-sdk (LLM)

## 目录结构

```
src/
├── app/
│   ├── page.tsx                    # Dashboard 工作台
│   ├── agent/page.tsx              # AI Agent 配置页
│   ├── knowledge/page.tsx          # 知识库/FAQ 管理
│   ├── chat-test/page.tsx          # AI 对话测试
│   ├── monitor/page.tsx            # 实时对话监控 + 人工接管
│   ├── transfer/page.tsx           # 转人工配置
│   ├── history/page.tsx            # 对话历史记录
│   └── api/
│       ├── agent/route.ts          # AI Agent CRUD
│       ├── knowledge/route.ts      # 知识库 CRUD
│       ├── chat-test/route.ts      # AI 对话（流式）
│       ├── conversations/route.ts  # 对话管理
│       ├── conversations/history/route.ts  # 历史记录
│       ├── messages/route.ts       # 消息管理
│       ├── transfer-rules/route.ts # 转人工规则
│       ├── notification-targets/route.ts   # 通知人员
│       ├── stats/route.ts          # 统计数据
│       └── wecom/route.ts          # 企业微信回调
├── components/
│   ├── sidebar.tsx                 # 侧边栏导航
│   ├── header.tsx                  # 顶部导航
│   └── ui/                         # shadcn/ui 组件
└── storage/database/
    ├── shared/schema.ts            # Drizzle 表定义
    └── supabase-client.ts          # Supabase 客户端
```

## 开发命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务
pnpm ts-check     # TypeScript 类型检查
pnpm lint         # ESLint 检查
```

## 数据库表

| 表名 | 说明 |
|------|------|
| agent_config | AI Agent 配置（提示词、语气等） |
| knowledge_base | 知识库/FAQ 条目 |
| conversations | 对话记录 |
| messages | 消息记录 |
| transfer_rules | 转人工关键词规则 |
| notification_targets | 转人工通知目标 |

## 企业微信对接

企业微信回调接口: `/api/wecom`
- GET: URL 验证
- POST: 接收消息事件，调用 AI 生成回复

对接时需要配置：企业 ID、AgentId、Secret、Token、EncodingAESKey
