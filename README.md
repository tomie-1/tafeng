# 踏风 Tafeng

踏风是一个面向 Cloudflare Worker 部署的 WebSSH 工作台原型，使用 React + Vite + TypeScript 构建，预留 Rust SSH 网关。它包含管理密码登录、两步验证设置、VPS 连接信息管理、终端工作台、文件上传下载、文本配置编辑器、资源监控、进程列表、多语言界面和全局命令历史记录。

English documentation: [Readme_EN.md](./Readme_EN.md)

## 功能概览

- WebSSH 终端工作台，界面风格接近 macOS Terminal。
- 支持保存 VPS 连接信息：IP / 域名、端口、用户名、密码或私钥。
- 首页管理密码登录，设置中可开启两步验证。
- 中文 / English 双语界面。
- 文件列表、文本配置编辑器、上传和下载接口。
- 上传接口设计上限为 10G。
- 连接后显示 CPU、内存、Swap、硬盘使用情况和进程列表。
- 全局命令历史记录，所有 VPS 共用，最多保存 100000 条。
- Cloudflare Worker + KV + R2 部署结构。
- 预留 Rust 网关目录，方便后续接入真实 SSH/SFTP。

## 当前状态说明

当前项目已经完成前端、Worker API、认证、设置、连接管理、命令历史、文件接口和监控面板骨架。真实 SSH/SFTP 协议接入被隔离在 [worker/sshBridge.ts](./worker/sshBridge.ts)，目前是可运行的开发桥接模式。

后续接入真实 SSH 有两种建议路线：

1. 在 `worker/sshBridge.ts` 中接入 Cloudflare Worker TCP Socket 和 SSH 协议实现。
2. 使用 [rust-gateway](./rust-gateway) 作为真实 SSH/SFTP 网关，Worker 负责鉴权、静态资源和边缘入口。

## 目录结构

```text
tafeng/
├── src/                 # React + Vite + TypeScript 前端
├── worker/              # Cloudflare Worker API 与 WebSocket 服务
├── shared/              # 前后端共用类型
├── rust-gateway/        # 预留 Rust 后端网关
├── public/              # 静态资源目录
├── dist/client/         # 前端构建产物
├── wrangler.toml        # Cloudflare Worker 配置
├── package.json         # 前端和 Worker 脚本
└── LICENSE              # MIT License
```

## 环境要求

- Node.js 18 或更高版本，推荐 Node.js 20+。
- npm 9 或更高版本。
- Cloudflare 账号。
- Wrangler CLI。本项目已把 `wrangler` 放在 devDependencies 中，可以直接使用 `npm run worker:dev` 和 `npm run worker:deploy`。
- Rust 工具链，仅当你需要运行或开发 `rust-gateway/` 时需要。

## 本地开发

安装依赖：

```bash
npm install
```

启动 Vite 前端开发服务：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:5173/
```

构建前端并启动本地 Worker：

```bash
npm run build
npm run worker:dev
```

Worker 默认访问地址：

```text
http://localhost:8787/
```

本地开发默认管理密码是：

```text
tafeng
```

生产环境不要使用默认密码，请配置 `ADMIN_PASSWORD` Secret。

## Cloudflare 资源准备

踏风部署到 Cloudflare Worker 时需要两个资源：

- KV Namespace：保存设置、会话、VPS 连接信息、命令历史索引和命令历史条目。
- R2 Bucket：保存上传文件或大文件中转数据。

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

如果是在无浏览器的服务器上部署，可以改用 Cloudflare API Token，并设置环境变量：

```bash
export CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
```

API Token 至少需要 Worker、KV、R2 相关权限。

### 2. 创建 KV Namespace

创建生产 KV：

```bash
npx wrangler kv namespace create TAFENG_KV
```

创建预览 KV：

```bash
npx wrangler kv namespace create TAFENG_KV --preview
```

命令执行后会输出类似内容：

```toml
[[kv_namespaces]]
binding = "TAFENG_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
```

把输出中的 `id` 和 `preview_id` 填入 [wrangler.toml](./wrangler.toml)：

```toml
[[kv_namespaces]]
binding = "TAFENG_KV"
id = "你的生产 KV id"
preview_id = "你的预览 KV id"
```

### 3. 创建 R2 Bucket

创建生产 Bucket：

```bash
npx wrangler r2 bucket create tafeng-files
```

创建预览 Bucket：

```bash
npx wrangler r2 bucket create tafeng-files-preview
```

确认 [wrangler.toml](./wrangler.toml) 中的配置和 Bucket 名称一致：

```toml
[[r2_buckets]]
binding = "TAFENG_FILES"
bucket_name = "tafeng-files"
preview_bucket_name = "tafeng-files-preview"
```

### 4. 设置管理密码

生产环境必须设置管理密码：

```bash
npx wrangler secret put ADMIN_PASSWORD
```

根据提示输入你的管理密码。

可选：设置会话密钥。当前代码预留了 `SESSION_SECRET`，后续如果你扩展签名会话或加密存储，可以使用它：

```bash
npx wrangler secret put SESSION_SECRET
```

## 构建与部署

### 1. 类型检查

```bash
npm run typecheck
```

### 2. 构建前端

```bash
npm run build
```

构建完成后，静态文件会输出到：

```text
dist/client/
```

### 3. 部署 Worker

```bash
npm run worker:deploy
```

部署成功后，Wrangler 会输出 Worker 访问地址，例如：

```text
https://tafeng.your-subdomain.workers.dev
```

打开这个地址，输入你通过 `ADMIN_PASSWORD` 配置的管理密码即可进入。

## 自定义域名

可以在 Cloudflare Dashboard 中为 Worker 绑定自定义域名：

1. 进入 Cloudflare Dashboard。
2. 打开 Workers & Pages。
3. 选择 `tafeng` Worker。
4. 进入 Settings。
5. 在 Domains & Routes 中添加自定义域名或路由。

## 两步验证

当前界面已经提供两步验证开关，并完成了登录流程占位。开发模式下验证码占位为：

```text
000000
```

生产环境建议后续接入标准 TOTP：

- 为管理员生成 TOTP Secret。
- 用二维码绑定 Authenticator 应用。
- 在 Worker 登录逻辑中校验 TOTP。
- 把 TOTP Secret 加密后保存到 KV 或放入 Secret。

相关入口在：

- [worker/auth.ts](./worker/auth.ts)
- [src/components/SettingsPanel.tsx](./src/components/SettingsPanel.tsx)

## 文件上传下载

上传接口位于：

```text
POST /api/files/upload
```

当前 Worker 会检查 `Content-Length`，超过 10G 会返回 `413`。文件内容会写入 R2 Bucket：

```text
TAFENG_FILES
```

真实 SFTP 上传下载接入后，建议流程为：

1. 浏览器上传到 Worker。
2. Worker 将大文件流式写入 R2 临时对象。
3. Rust 网关或 SSH/SFTP 适配层从 R2 读取并上传到 VPS。
4. 任务完成后删除临时对象。

这样可以避免浏览器、Worker 和远端 VPS 之间长时间保持不稳定连接。

## 命令历史记录

踏风会全局保存所有 VPS 执行过的命令，最多保存 100000 条。

接口：

```text
GET /api/command-history?limit=300&offset=0
DELETE /api/command-history
```

存储方式：

- KV 中保存一个全局索引。
- 每条命令单独保存为 KV 条目。
- 超过 100000 条时自动删除最旧记录。

## 多语言

目前支持：

- 中文
- English

前端语言字典位于：

```text
src/lib/i18n.ts
```

如需增加新语言：

1. 在 `shared/types.ts` 中扩展 `Language` 类型。
2. 在 `src/lib/i18n.ts` 中增加对应字典。
3. 在 `SettingsPanel` 的语言选择器中增加选项。

## Rust 网关

`rust-gateway/` 是预留的真实 SSH/SFTP 后端骨架。

运行方式：

```bash
cd rust-gateway
cargo run
```

默认监听地址：

```text
http://127.0.0.1:9090
```

健康检查：

```bash
curl http://127.0.0.1:9090/health
```

当前 Rust 网关包含：

- `/health`
- `/ssh` WebSocket 占位接口
- `/sftp/upload` 上传占位接口
- `/sftp/download` 下载占位接口

后续建议接入：

- `russh` 或系统 `ssh` 子进程。
- SFTP 流式上传下载。
- 和 Worker 之间的内部鉴权。
- 任务状态回调和大文件传输进度。

## 安全建议

生产部署前建议完成以下事项：

- 设置强管理密码：`npx wrangler secret put ADMIN_PASSWORD`。
- 接入真实 TOTP 两步验证。
- 不要明文长期保存 SSH 密码或私钥，建议使用加密存储。
- 为 KV 中保存的 VPS 凭据增加加密层。
- 限制 Worker 访问来源或增加额外访问控制。
- 定期清理不需要的命令历史。
- 为 R2 临时上传对象设置清理策略。
- 真实 SSH 接入时做好连接超时、命令审计和错误处理。

## 常用命令

```bash
# 安装依赖
npm install

# 启动前端开发服务
npm run dev

# 类型检查
npm run typecheck

# 构建前端
npm run build

# 本地运行 Worker
npm run worker:dev

# 部署 Worker
npm run worker:deploy

# 运行 Rust 网关
cd rust-gateway
cargo run
```

## 常见问题

### 1. 打开页面后无法登录

请确认已经设置生产管理密码：

```bash
npx wrangler secret put ADMIN_PASSWORD
```

本地开发没有设置 Secret 时，默认密码是 `tafeng`。

### 2. Wrangler 提示 KV id 无效

请确认已经执行：

```bash
npx wrangler kv namespace create TAFENG_KV
npx wrangler kv namespace create TAFENG_KV --preview
```

并且已经把输出的 `id` 和 `preview_id` 写入 [wrangler.toml](./wrangler.toml)。

### 3. 文件上传失败

请确认 R2 Bucket 已创建，并且 [wrangler.toml](./wrangler.toml) 中的 `bucket_name` 和 `preview_bucket_name` 正确。

### 4. 终端现在没有连接真实 VPS

这是当前原型的预期行为。真实 SSH/SFTP 需要在 [worker/sshBridge.ts](./worker/sshBridge.ts) 或 [rust-gateway](./rust-gateway) 中接入。

### 5. 命令历史是否按 VPS 隔离

不是。当前设计是全局历史记录，不管哪个 VPS，所有执行过的命令都会进入同一个历史列表，最多保存 100000 条。

## 开源协议

本项目采用 MIT License。你可以自由使用、修改、分发和用于商业项目，但需要保留版权与许可声明。详见 [LICENSE](./LICENSE)。
