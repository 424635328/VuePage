# Vue 3

![VueJS](https://img.shields.io/badge/Vue.js-3.x-42b883) ![Vite](https://img.shields.io/badge/Vite-^5.0-646cff) ![Pinia](https://img.shields.io/badge/Pinia-^2.1-ffd859) ![Supabase](https://img.shields.io/badge/Supabase-Full%20Stack-3ecf8e) ![Performance](https://img.shields.io/badge/Public%20API%20QPS-%7E140-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

本项目是一个基于 **Vue 3**、**Vite**、**Pinia** 和 **Supabase** 全家桶构建的、全栈式的企业级电子商务/作品集展示与工具平台。它从一个纯前端的作品集，逐步演进为一个功能完备的全栈应用，其核心目标是通过**企业级的代码架构**、**现代化的工程实践**和**对极致用户体验的苛刻追求**，全面展示开发者在前后端整合、数据库设计、API 构建、性能优化、安全策略以及复杂前端工具开发方面的专业技能。

除了完整的商店系统，本项目还集成了一个功能强大的**在线图片编辑器**，展示了在复杂状态管理、Canvas 操作和高级用户交互方面的深厚实力。

## 🏛️ 架构亮点

- **组合式架构 (Composable Architecture)**: 全面采用 Vue 3 Composition API，通过自定义组合式函数 (`Composables`) 封装和复用跨组件的响应式逻辑，如 `useRedirect` 智能导航、`useToast` 通知系统等，实现了代码的高内聚、低耦合。
- **原子化状态管理 (Atomic State Management)**: 利用 Pinia 实现细粒度的、可预测的全局状态管理。Store 按业务领域（`auth`, `products`）和 UI 领域 (`ui`) 划分，职责清晰，便于维护和调试。
- **性能优先的渲染策略**: 关键页面如 `ShopPage` 采用 `IntersectionObserver` 实现**无限滚动**，避免了传统分页的性能瓶颈。全局导航采用**延迟加载提示**策略，优化了快速跳转的感知性能。
- **面向未来的视觉组件**: 所有UI组件，尤其是全局组件，都采用了**性能优先的动画设计**，严格使用 `transform` 和 `opacity` 并结合 `will-change` 提示，确保动画由 GPU 加速，实现 60fps 的流畅体验，并遵循**可访问性**标准 (`prefers-reduced-motion`)。

## ✨ 核心特性

- **惊艳的视觉效果**:
  - **动态全息背景**: 集成了一个由 React/TSX 精心移植而来的赛博朋克风格动态极光背景，包含了粒子、光球、视差、雨滴、闪电、霓虹灯等多种高级视觉特效。
  - **GPU 加速的 UI 动效**: 所有关键UI，如全局导航提示，都采用了极致性能优化的动效设计，包括多层视差流光、3D入场动画和交互式微动效，提供了媲美原生应用的视觉反馈。

- **现代化的全栈技术栈**: 全面拥抱 Vue 3 Composition API，利用 Vite 提供极速的开发体验。后端采用 **Supabase**，集成了 **Postgres 数据库**、**认证 (Auth)**、**对象存储 (Storage)** 和 **Edge Functions (Serverless API)**。

- **强大的在线图片编辑器**:
  - **核心功能**: 支持图片的**拖拽/点击上传**、**缩放**、**平移**、**滤镜应用**等基础编辑操作。
  - **高级交互**: 实现了**全局快捷键**支持（如 `Ctrl/Cmd + Z` 撤销，`Ctrl/Cmd + Y` 重做，`空格键` 拖拽画布），并智能地在输入状态下禁用快捷键，避免冲突。
  - **非破坏性编辑**: 所有操作都基于历史记录栈，用户可以无限次地**撤销 (Undo)** 和**重做 (Redo)**，保证了原始图片的安全。
  - **模块化架构**: 编辑器由 `TopMenuBar`, `EditorToolbar`, `CanvasArea`, `RightPanels` 等多个高内聚、低耦合的组件构成，结构清晰，易于扩展。

- **企业级后端架构与优化**:
  - **高性能数据查询**: 通过创建 **Postgres 数据库视图 (View)**，预先聚合商品及其关联图片，将原有的“N+1”查询优化为单次高效查询，数据库负载降低 50% 以上。
  - **CDN 级公共 API**: 利用 **Supabase Edge Function** 和 **CDN 缓存** (`Cache-Control: s-maxage`)，为公开的商品详情页提供了高性能、高可用的 API 端点，轻松应对高并发访问。
  - **安全的数据隔离**: 利用 Postgres 的**行级安全策略 (RLS)**，确保用户只能访问和修改自己的数据。

- **完整的认证系统**: 支持**邮箱/密码**、**OTP (一次性验证码)** 和 **GitHub OAuth** 三种登录方式。通过自定义邮件模板和智能错误处理，提供了安全流畅的注册和登录体验。

- **智能化的商品/文件管理**:
  - **图片/文件保险库**: 新增一个**文件保险库**模块，支持除文件夹外的所有文件上传（如 `.exe`, `.zip`, `.pdf` 等），并提供**批量选择、打包下载、独立删除**等高级文件管理功能。
  - **前端图片压缩**: 集成 `browser-image-compression` 库，在上传前自动优化图片，极大地提升了性能并节省了云存储成本。
  - **健壮的图片管理**: 支持在编辑时更改或删除已上传的图片，并通过后端逻辑自动清理云存储中的孤儿文件。

- **极致的用户体验 (UX)**:
  - **智能导航反馈系统**:
    - **感知性能优化**: 实现了**延迟加载提示**。对于快速的路由切换，系统不会显示任何加载提示，避免了不必要的视觉闪烁，让应用感觉**快了一个数量级**。
    - **避免冗余操作**: 系统能智能判断并**阻止到当前页面的重复导航**，防止无效的UI反馈。
    - **优雅的视觉呈现**: 全局提示组件采用非对称的未来感设计，拥有多层视差流光、3D入场和状态脉冲等多种GPU加速的微动效。
  - **无限滚动加载**: `Shop` 页面采用**无限滚动**加载商品列表，实现了极快的初始加载速度和流畅的浏览体验。
  - **非阻塞式反馈**: 大量使用自定义的 **Toast 通知**和**确认模态框**，取代了体验糟糕的原生 `alert` 和 `confirm`。
  - **“状态优先”的瞬时加载**: 在应用内导航时，通过 Pinia 暂存数据，实现了详情页的零延迟加载。

## ⚡ 性能与优化报告

本项目经过了严格的性能分析与多轮优化。我们使用专业的压力测试工具 **k6**，模拟了多场景、高并发的用户行为，以科学地评估系统的承载能力和响应速度。

### 优化历程

1.  **识别瓶颈**: 初始版本的详情页存在“N+1”查询问题，在高并发下导致 Edge Function 超时和大量请求失败。
2.  **后端优化**: 引入 **PostgreSQL 视图 (View)**，将多次数据库查询合并为一次，从根本上解决了查询效率问题。
3.  **缓存策略**: 为公共 API (Edge Function) 添加 **CDN 缓存**响应头，将绝大多数重复请求的负载从数据库和函数中剥离。
4.  **前端优化**: 重构了 `Shop` 页面，实现**无限滚动加载**；并构建了**智能导航反馈系统**，大幅提升了应用的感知性能和流畅度。

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
    - **数据库**: 进入 Supabase 项目的 `SQL Editor`，将本项目根目录 `supabase/migrations` 文件夹中的 SQL 脚本内容（包括 `CREATE TABLE`, `CREATE VIEW` 和 RLS 策略）粘贴并执行。
    - **认证**: 在 `Authentication > Providers` 中，启用 `Email` 和 `GitHub`。同时在 `Authentication > Email Templates` 中自定义邮件模板。
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

## 📁 项目架构与文件解析

```
.
├── 📄 .env                  # 环境变量
├── 📄 package.json
├── 📁 supabase/
│   ├── 📄 config.toml         # Supabase CLI 配置文件
│   ├── 📁 functions/
│   │   ├── 📁 _shared/        # Edge Functions 的共享代码
│   │   └── 📁 get-product-details/ # (已优化) 高性能公共 API
│   └── 📁 migrations/         # 数据库迁移脚本 (含视图和 RLS 策略)
├── 📁 public/
└── 📁 src/
    ├── 📁 assets/             # 静态资源 (SCSS, JSON数据)
    ├── 📁 components/         # 可复用 UI 构建块
    │   └── 📁 global/         # ✨ 全局单例组件 (如 GlobalRedirectingTip)
    │   └── 📁 editor/         # ✨ 图片编辑器核心组件
    ├── 📁 composables/        # Vue 组合式函数
    │   └── 📄 useRedirect.js   # ✨ (极致优化) 智能导航组合式函数
    ├── 📁 lib/                # 第三方库初始化 (Supabase Client)
    ├── 📁 router/             # Vue Router 配置
    ├── 📁 stores/             # Pinia 状态管理
    │   ├── 📄 ui.js          # ✨ 全局 UI 状态 (负责驱动全局组件)
    │   ├── 📄 products.js    # (已优化) 商品分页与 CRUD
    │   └── 📄 imageEditor.js # ✨ 图片编辑器状态 (含历史记录)
    └── 📁 views/              # 页面级组件
        ├── 📄 ShopPage.vue    # (已优化) 无限滚动商品列表
        └── 📄 ImageEditorPage.vue # ✨ 图片编辑器主页面
```

---

### **核心模块深度解析**

#### **✨ `composables/useRedirect.js` & `components/global/GlobalRedirectingTip.vue` - 智能导航反馈系统**

这是体现本项目对**极致用户体验**和**性能**追求的核心模块。它并非简单的“加载”提示，而是一个完整的、智能的导航体验管理系统。

- **`useRedirect.js` (大脑)**: 一个极致优化的组合式函数。
  - **感知性能优化**: 通过**延迟加载提示**（仅在导航 > 200ms 时显示），它消除了快速跳转时的UI闪烁，使应用响应速度在**感知层面**得到巨大提升。
  - **智能预判**: 自动阻止到当前页面的重复导航，并能处理外部链接，保证了交互的健壮性和合理性。
- **`GlobalRedirectingTip.vue` (视觉呈现)**: 一个全局单例组件，负责将导航状态以最优雅的方式呈现给用户。
  - **企业级动效**: 动画完全由 GPU 加速 (`will-change`)，包含多层视差流光、3D入场和状态脉冲效果，同时遵循**可访问性**标准。
  - **状态驱动**: 完全由 `stores/ui.js` 驱动，与业务逻辑彻底解耦。

#### **`📁 src/views/ImageEditorPage.vue` & `📁 src/stores/imageEditor.js` - 在线图片编辑器**

- **`ImageEditorPage.vue`**: 编辑器的主视图，负责整合各个子组件，并处理**全局事件**，如文件拖拽上传和键盘快捷键。
- **`stores/imageEditor.js`**: 图片编辑器的“大脑”，一个 Pinia store，负责管理画布状态和编辑历史，实现了**非破坏性编辑**和无限撤销/重做。

#### **`📁 supabase/` - 高性能后端**

- **`functions/get-product-details/`**: 一个经过深度优化的公开 Serverless API，通过**数据库视图**和**CDN缓存**两大核心技术，实现了高性能、高可用的公共数据查询。
- **`migrations/`**: 存放数据库的结构定义 SQL，包括表、视图和行级安全策略（RLS），保证了后端环境的**可复现性**和**安全性**。

#### **`📁 src/views/ShopPage.vue` & `📁 src/stores/products.js` - 高效数据加载**

- **`ShopPage.vue`**: 通过 `useIntersectionObserver` 实现了**无限滚动加载**，只在用户需要时才请求下一页数据，确保了极快的初始加载性能和可扩展性。
- **`stores/products.js`**: 负责所有商品相关的 CRUD 异步操作，并为前端提供了精细化的加载状态 (`loading`, `loadingMore`, `hasMore`)，同时采用**乐观更新**策略，提供极致的瞬时反馈。
