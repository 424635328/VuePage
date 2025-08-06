# Vue 3 全栈企业级商店系统 (Full-Stack Enterprise-Grade Shop System)

![VueJS](https://img.shields.io/badge/Vue.js-3.x-42b883) ![Vite](https://img.shields.io/badge/Vite-^5.0-646cff) ![Pinia](https://img.shields.io/badge/Pinia-^2.1-ffd859) ![Supabase](https://img.shields.io/badge/Supabase-Full%20Stack-3ecf8e) ![License](https://img.shields.io/badge/license-MIT-blue)

本项目是一个基于 **Vue 3**、**Vite**、**Pinia** 和 **Supabase** 全家桶构建的、全栈式的企业级电子商务/作品集展示平台。它从一个纯前端的作品集，逐步演进为一个功能完备的全栈应用，其核心目标是通过**企业级的代码架构**、**现代化的工程实践**和**极致的用户体验**，全面展示开发者在前后端整合、数据库设计、API 构建和安全策略方面的专业技能。

## ✨ 核心特性

- **惊艳的视觉效果**: 集成了一个由 React/TSX 精心移植而来的赛博朋克风格动态极光背景，包含了粒子、光球、视差、雨滴、闪电、霓虹灯等多种高级视觉特效。
- **现代化的全栈技术栈**: 全面拥抱 Vue 3 Composition API，利用 Vite 提供极速的开发体验。后端采用 **Supabase**，集成了 **Postgres 数据库**、**认证 (Auth)**、**对象存储 (Storage)** 和 **Edge Functions (Serverless API)**。
- **企业级后端架构**:
  - **安全的数据库设计**: 利用 Postgres 的行级安全策略 (RLS)，确保用户只能访问和修改自己的数据。
  - **公共 API 端点**: 通过 **Supabase Edge Function** 创建了高性能、可公开访问的 REST API，实现了与前端的完全解耦，并支持了真正的公开分享和 SEO。
  - **原子化数据库操作**: 数据库表的 `public_id` (UUID) 字段由数据库自动生成，保证了分享链接的唯一性和不可预测性。
- **完整的认证系统**: 支持**邮箱/密码**、**OTP (一次性验证码)** 和 **GitHub OAuth** 三种登录方式。通过自定义邮件模板和智能错误处理，提供了安全流畅的注册和登录体验。
- **智能化的商品管理**:
  - **独立的编辑/创建页面**: 使用独立的路由 (`/shop/new`, `/shop/edit/:id`) 提供沉浸式的编辑体验。
  - **前端图片压缩**: 集成 `browser-image-compression` 库，在上传前自动优化图片，极大地提升了性能并节省了成本。
  - **健壮的图片管理**: 支持在编辑时更改或删除已上传的图片，并通过后端逻辑自动清理云存储中的孤儿文件。
- **内容自适应布局**: 商品详情页采用先进的**“混合内容布局”**算法，能够解析 Markdown 风格的描述，并根据内容（是否有图、文本结构）智能选择最佳的渲染方式。
- **极致的用户体验 (UX)**:
  - **非阻塞式反馈**: 大量使用自定义的 **Toast 通知**和**确认模态框**，取代了体验糟糕的原生 `alert` 和 `confirm`。
  - **“状态优先”的瞬时加载**: 在应用内导航时，通过 Pinia 暂存数据，实现了详情页的零延迟加载。
  - **优雅的动画与过渡**: 大量运用 CSS 动画和过渡，实现了平滑的页面切换、元素入场效果和细腻的微交互。

## 🚀 快速开始

在开始之前，请确保您的本地环境已安装 [Node.js](https://nodejs.org/) (LTS 版本)、`npm` 或 `yarn`，以及 [Supabase CLI](https://supabase.com/docs/guides/cli)。

1.  **克隆仓库**

    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **安装前端依赖**

    ```bash
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
    - **数据库**: 进入 Supabase 项目的 `SQL Editor`，将本项目根目录 `supabase/migrations` 文件夹中的 SQL 脚本内容粘贴并执行，以创建 `products` 表并设置 RLS 策略。
    - **认证**: 在 `Authentication > Providers` 中，启用 `Email` 和 `GitHub`。为 GitHub 提供您自己创建的 OAuth App 的 Client ID 和 Secret。
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
    项目将在本地启动，通常地址为 `http://localhost:5173`。

## 📁 项目架构与文件解析 (全栈版)

```
.
├── 📄 .env                  # 环境变量
├── 📄 package.json
├── 📁 public/
├── 📁 src/
│   ├── 📁 assets/             # 静态资源 (SCSS, JSON数据)
│   ├── 📁 components/
│   │   ├── 📁 auth/           # 认证模态框
│   │   ├── 📁 common/         # 可复用的通用组件 (Toast, ConfirmModal)
│   │   └── 📁 shop/           # 商店相关组件 (ProductCard, FloatingActions)
│   ├── 📁 lib/                # 第三方库初始化 (supabaseClient.js)
│   ├── 📁 router/             # Vue Router 配置
│   ├── 📁 stores/             # Pinia 状态管理
│   └── 📁 views/              # 页面级组件 (ShopPage, ProductDetailsPage, ProductEditPage)
└── 📁 supabase/
    ├── 📁 functions/
    │   ├── 📁 _shared/        # Edge Functions 的共享代码 (cors.ts)
    │   └── 📁 get-product-details/ # 公共 API: 获取商品详情
    └── 📄 config.toml         # Supabase CLI 配置文件
```

---

### **核心模块解析**

#### **`📁 supabase/` - 后端即服务 (Backend as a Service)**

- **`functions/get-product-details/`**: 一个公开的、无认证的 Serverless API 端点。
  - **作用**: 负责通过商品的 `public_id` (UUID) 从数据库中安全地获取单个商品的完整信息。
  - **技术细节**: 使用 `SERVICE_ROLE_KEY` 创建 Supabase Admin 客户端，使其能够**绕过 RLS 策略**进行数据查询。这是实现“链接对所有人可见”功能的技术核心。返回的数据为纯 JSON 格式。
  - **关联**: 被 `views/ProductDetailsPage.vue` 通过 `fetch()` API 调用。

#### **`📁 src/stores/` - 全局状态管理中心 (Pinia)**

- **`auth.js`**: 负责处理所有用户认证相关的逻辑，包括注册、登录、登出、密码重置、OTP 验证等。
- **`products.js`**: 负责所有与商品相关的 CRUD (增删改查) 异步操作。
  - **智能更新**: `updateProduct` action 实现了健壮的图片管理逻辑，能够自动清理云存储中的孤儿文件。
  - **“状态优先”加载**: 包含 `selectedProduct` 状态和 `selectProductForDetailPage` action，用于在导航前暂存数据，实现详情页的瞬时加载。
- **`toast.js`**: 一个简单的全局事件总线，用于触发和管理非阻塞式的 Toast 通知。

#### **`📁 src/views/` - 页面级组件**

- **`ShopPage.vue`**: 用户登录后的主仪表盘。
  - **职责**: 展示用户创建的所有商品卡片列表；提供新建商品的入口；处理删除和复制链接的操作。
  - **技术细节**: 通过插槽 (`<slot>`) 将操作按钮（编辑、删除等）动态注入到每个 `ProductCard` 组件中，保持了子组件的纯粹性。

- **`ProductEditPage.vue`**: 独立的商品创建/编辑页面。
  - **职责**: 提供一个功能完备的表单，用于创建或修改商品信息，包括标题、描述和图片。
  - **智能模式**: 通过路由参数 (`props.public_id`) 自动判断当前是“新建模式”还是“编辑模式”。
  - **前端优化**: 在此页面进行**图片压缩**，确保上传的文件是经过优化的。
  - **用户体验**: 保存成功后，自动重定向到该商品的详情页，提供了流畅的工作流。

- **`ProductDetailsPage.vue`**: 公开的商品详情页。
  - **职责**: 展示单个商品的完整信息，包括所有结构化的描述内容；为所有者提供专属的工具栏。
  - **数据获取**: 采用**“状态优先，API 为辅”**的策略。优先从 `products.js` store 中读取数据以实现瞬时加载；如果 store 中无数据（例如直接通过链接访问），则回退到调用 `get-product-details` Edge Function 公共 API。
  - **SEO & 分享**: 在挂载时动态更新页面的 `og:*` meta 标签，以确保在社交媒体上分享时能生成富链接预览。
  - **上下文 UI**: 通过 `isOwner` 计算属性，智能地显示或隐藏“所有者工具栏”。

#### **`📁 src/components/` - 可复用 UI 构建块**

- **`common/ConfirmModal.vue`**: 一个可复用的、非阻塞式的确认模态框，用于所有危险操作（如删除商品），取代了 `window.confirm`。
- **`common/AppToast.vue`**: 全局唯一的 Toast 组件，监听 `toast.js` store 的变化并显示通知。
- **`shop/ProductCard.vue`**: 商品卡片组件。
  - **职责分离**: 其结构被明确分为**导航区**（上半部分，被 `<router-link>` 包裹）和**操作区**（下半部分，通过 `<slot>` 接收按钮），从根本上解决了事件冒泡冲突。
