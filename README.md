# Vue 3 全栈企业级商店系统 (Full-Stack Enterprise-Grade Shop System)

![VueJS](https://img.shields.io/badge/Vue.js-3.x-42b883) ![Vite](https://img.shields.io/badge/Vite-^5.0-646cff) ![Pinia](https://img.shields.io/badge/Pinia-^2.1-ffd859) ![Supabase](https://img.shields.io/badge/Supabase-Full%20Stack-3ecf8e) ![Performance](https://img.shields.io/badge/Public%20API%20QPS-%7E140-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

本项目是一个基于 **Vue 3**、**Vite**、**Pinia** 和 **Supabase** 全家桶构建的、全栈式的企业级电子商务/作品集展示平台。它从一个纯前端的作品集，逐步演进为一个功能完备的全栈应用，其核心目标是通过**企业级的代码架构**、**现代化的工程实践**和**极致的用户体验**，全面展示开发者在前后端整合、数据库设计、API 构建、性能优化和安全策略方面的专业技能。

## ✨ 核心特性

- **惊艳的视觉效果**: 集成了一个由 React/TSX 精心移植而来的赛博朋克风格动态极光背景，包含了粒子、光球、视差、雨滴、闪电、霓虹灯等多种高级视觉特效。
- **现代化的全栈技术栈**: 全面拥抱 Vue 3 Composition API，利用 Vite 提供极速的开发体验。后端采用 **Supabase**，集成了 **Postgres 数据库**、**认证 (Auth)**、**对象存储 (Storage)** 和 **Edge Functions (Serverless API)**。
- **企业级后端架构与优化**:
  - **高性能数据查询**: 通过创建 **Postgres 数据库视图 (View)**，预先聚合商品及其关联图片，将原有的“N+1”查询优化为单次高效查询，数据库负载降低 50% 以上。
  - **CDN 级公共 API**: 利用 **Supabase Edge Function** 和 **CDN 缓存** (`Cache-Control: s-maxage`)，为公开的商品详情页提供了高性能、高可用的 API 端点，轻松应对高并发访问。
  - **安全的数据隔离**: 利用 Postgres 的**行级安全策略 (RLS)**，确保用户只能访问和修改自己的数据。
- **完整的认证系统**: 支持**邮箱/密码**、**OTP (一次性验证码)** 和 **GitHub OAuth** 三种登录方式。通过自定义邮件模板和智能错误处理，提供了安全流畅的注册和登录体验。
- **智能化的商品管理**:
  - **独立的编辑/创建页面**: 使用独立的路由 (`/shop/new`, `/shop/edit/:id`) 提供沉浸式的编辑体验。
  - **前端图片压缩**: 集成 `browser-image-compression` 库，在上传前自动优化图片，极大地提升了性能并节省了云存储成本。
  - **健壮的图片管理**: 支持在编辑时更改或删除已上传的图片，并通过后端逻辑自动清理云存储中的孤儿文件。
- **极致的用户体验 (UX)**:
  - **无限滚动加载**: `Shop` 页面采用**无限滚动**加载商品列表，实现了极快的初始加载速度和流畅的浏览体验，避免了传统分页的性能瓶颈。
  - **非阻塞式反馈**: 大量使用自定义的 **Toast 通知**和**确认模态框**，取代了体验糟糕的原生 `alert` 和 `confirm`。
  - **“状态优先”的瞬时加载**: 在应用内导航时，通过 Pinia 暂存数据，实现了详情页的零延迟加载。
  - **优雅的动画与过渡**: 大量运用 CSS 动画和过渡，实现了平滑的页面切换、元素入场效果和细腻的微交互。

## ⚡ 性能与优化报告

本项目经过了严格的性能分析与多轮优化。我们使用专业的压力测试工具 **k6**，模拟了多场景、高并发的用户行为，以科学地评估系统的承载能力和响应速度。

### 优化历程

1.  **识别瓶颈**: 初始版本的详情页存在“N+1”查询问题，在高并发下导致 Edge Function 超时和大量请求失败。
2.  **后端优化**: 引入 **PostgreSQL 视图 (View)**，将多次数据库查询合并为一次，从根本上解决了查询效率问题。
3.  **缓存策略**: 为公共 API (Edge Function) 添加 **CDN 缓存**响应头，将绝大多数重复请求的负载从数据库和函数中剥离。
4.  **前端优化**: 重构了 `Shop` 页面，实现**无限滚动加载**，提升了用户仪表盘的初始加载性能和可扩展性。

### 极限压力测试结果

以下是在混合压力场景下（模拟大量匿名用户浏览，同时有认证用户进行读写操作），系统各核心功能的性能表现：

| 测试场景 (用户行为)                | QPS 性能拐点 (约) | p(95) 响应时间 (在拐点负载下) | 成功率 (在拐点负载下) | 性能瓶颈                | 核心优化技术                        |
| ---------------------------------- | ----------------- | ----------------------------- | --------------------- | ----------------------- | ----------------------------------- |
| **匿名用户浏览 (公共 API)**        | **~140 QPS**      | < 1.2 s                       | **> 99.7%**           | Supabase CDN & 计算实例 | **数据库视图 + Edge Function 缓存** |
| **认证用户读数据 (查询个人商品)**  | **~18 QPS**       | ~ 1.5 s                       | > 99%                 | 数据库计算实例 (CPU/IO) | **分页加载 (Infinite Scroll)**      |
| **认证用户写数据 (创建/删除商品)** | **> 2 QPS**       | < 1.2 s                       | > 99.9%               | 数据库计算实例          | 异步操作, 本地状态即时更新          |

**结论**: 经过优化，系统展现出卓越的性能和健壮性。其**公共 API 具备了应对高流量冲击的能力**，而认证用户的核心 CRUD 功能也能为**数百名并发活跃用户提供流畅稳定的服务**。

## 🚀 快速开始

在开始之前，请确保您的本地环境已安装 [Node.js](https://nodejs.org/) (LTS 版本)、`npm` 或 `yarn`，以及 [Supabase CLI](https://supabase.com/docs/guides/cli)。

1.  **克隆仓库**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```
2.  **安装前端依赖**
    ```bash
    npm install @vueuse/core
    npm install
    ```
3.  **配置环境变量**
    - 在项目根目录创建一个 `.env` 文件。
    - 登录您的 [Supabase 项目](https://app.supabase.com/)，在 `Project Settings > API` 中找到您的 URL 和 `anon` key。
    - 将它们添加到 `.env` 文件中：
      ```env
      VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
      VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
      ```
4.  **配置 Supabase 后端**
    - **数据库**: 进入 Supabase 项目的 `SQL Editor`，将本项目根目录 `supabase/migrations` 文件夹中的 SQL 脚本内容（包括 `CREATE VIEW` 语句）粘贴并执行。
    - **认证**: 在 `Authentication > Providers` 中，启用 `Email` 和 `GitHub`。
    - **Edge Function**:
      ```bash
      # 登录并链接您的项目
      npx supabase login
      npx supabase link --project-ref <YOUR_PROJECT_REF>
      # 部署公共 API
      npx supabase functions deploy get-product-details --no-verify-jwt
      ```
5.  **启动开发服务器**
    ```bash
    npm run dev
    ```

## 📁 项目架构与文件解析 (全栈版)

```
.
├── 📄 .env                  # 环境变量
├── 📄 package.json
├── 📁 supabase/
│   ├── 📄 config.toml         # Supabase CLI 配置文件
│   ├── 📁 functions/
│   │   ├── 📁 _shared/        # Edge Functions 的共享代码
│   │   └── 📁 get-product-details/ # (已优化) 高性能公共 API
│   └── 📁 migrations/         # 数据库迁移脚本 (含视图定义)
├── 📁 public/
└── 📁 src/
    ├── 📁 assets/             # 静态资源 (SCSS, JSON数据)
    ├── 📁 components/         # 可复用 UI 构建块
    ├── 📁 lib/                # 第三方库初始化
    ├── 📁 router/             # Vue Router 配置
    ├── 📁 stores/             # Pinia 状态管理 (已优化分页)
    └── 📁 views/              # 页面级组件 (已优化性能)
```

---

### **核心模块解析**

#### **`📁 supabase/` - 高性能后端**

- **`functions/get-product-details/`**: 一个经过深度优化的公开 Serverless API。
  - **作用**: 通过**单次查询** `product_details` 视图，安全、高效地获取包含所有关联图片的商品完整信息。
  - **性能核心**:
    1.  **查询层**: 使用数据库视图避免“N+1”问题。
    2.  **缓存层**: 利用 `Cache-Control` 头实现 CDN 边缘缓存，大幅降低延迟和数据库负载。
- **`migrations/`**: 存放数据库的结构定义 SQL，包括 `CREATE TABLE` 和 `CREATE VIEW` 语句，保证了后端环境的可复现性。

#### **`📁 src/stores/products.js` - 优化的状态管理**

- **`products.js`**: 负责所有商品相关的 CRUD 异步操作，并实现了**高效的分页逻辑**。
  - **分页加载**: `fetchInitialProducts` 和 `fetchMoreProducts` action 提供了清晰的分页接口。
  - **精细化状态**: 通过 `loading`, `loadingMore`, `hasMore` 等状态，为前端实现复杂的加载 UI（如无限滚动）提供了有力支持。
  - **乐观更新**: 删除操作采用“先从UI移除，再调用API”的乐观更新策略，提供极致的瞬时反馈。

#### **`📁 src/views/` - 性能感知的页面组件**

- **`ShopPage.vue`**: 用户登录后的主仪表盘。
  - **性能**: 使用 `useIntersectionObserver` 实现了**无限滚动加载**，只在用户滚动到页面底部时才请求下一页数据，确保了极快的初始加载性能。
  - **UI/UX**: 精确处理 `productsLoading` 和 `loadingMore` 状态，为用户提供了清晰的“初始加载”和“加载更多”的视觉反馈，避免了内容闪烁。
- **`ProductDetailsPage.vue` & `ProductEditPage.vue`**:
  - **数据获取**: 统一通过调用 `supabase.functions.invoke('get-product-details', ...)` 来加载商品数据，充分享受了后端视图和缓存带来的性能优势。
  - **职责分离**: 前端组件专注于 UI 展示和用户交互，将复杂的数据聚合逻辑下沉到后端视图中，使得前后端职责更清晰。
