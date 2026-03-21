# iirose-meme-searcher

## 普通用户直接使用

如果你只是普通用户，不参与开发，直接把下面这个链接粘贴到 IIROSE 终端里即可：

```text
https://cdn.jsdelivr.net/gh/Nobeta-Work/iirose-meme-searcher@main/dist/ims.js
```

使用步骤：

1. 打开 IIROSE 页面。
2. 左侧菜单进入：工具 -> 终端。
3. 在终端输入 `js` 并回车。
4. 粘贴上面的链接并回车执行。
5. 加载完成后，点击页面右下角的 `IMS` 按钮。
6. 在配置面板中填写：
   - 搜索接口地址（默认已内置 `https://cn.bing.com/images/search`）
   - 检索前缀词（默认已内置：`duitang.com`、`表情包`、`白圣女`）
   - 候选数量
7. 回到聊天输入框，输入 `/m 开心` 这类内容开始搜索。

注意：

- 本仓库提供的是前端插件产物链接。
- 默认已经内置直连 Bing 的搜索地址。
- 如果浏览器环境拦截 Bing 跨域请求，插件会加载成功，但搜索可能失败。
- 默认检索前缀词已内置为：`duitang.com`、`表情包`、`白圣女`。

IMS 是一个运行在 iirose 网页端的前端插件。用户在聊天输入框输入前缀后，可以直接搜索表情包图片，并通过点击候选项把图片 URL 发送到公屏。

当前版本为 `v0.1.0`，已经实现并验证了以下能力：
- 网页端远程 JS 导入。
- 输入框锚定的非模态候选条。
- 通过可配置搜索接口地址进行图片搜索。
- 多个检索前缀词配置。
- 点击候选后发送裸图片 URL。
- 轻量配置面板。

## 功能概览

- 触发前缀默认是 `/m`。
- 支持 `/m关键词` 和 `/m 关键词` 两种输入方式。
- 默认直连 Bing 图片搜索地址，也支持用户改成自定义搜索接口地址。
- 默认内置多个检索前缀词：`duitang.com`、`表情包`、`白圣女`，也支持用户自行修改。
- 候选数量默认 `8`，可配置范围 `1-20`。
- 发送成功后会清空输入框。
- 候选条会在删除前缀、切换房间、发送成功后自动关闭或重置。

## 查询词拼接规则

如果配置面板中设置了多个检索前缀词，它们会在搜索时自动拼接到用户关键词前面。

示例：

- 检索前缀词：
  - `duitang.com`
  - `表情包`
  - `白圣女`
- 用户输入：`/m 开心`
- 最终查询词：`duitang.com 表情包 白圣女 开心`

## 关于 Bing 地址

当前插件要求“搜索接口地址”返回统一 JSON 协议，而不是普通搜索网页地址。

这意味着：

- `https://www.bing.com/images/search` 这类普通 Bing 网页地址，不能直接作为最终可用配置项。
- 如果你希望默认走 Bing，必须提供一个可访问的 Bing 搜索接口服务。
- 本仓库已经提供了 `scripts/bing-relay.mjs` 作为 Bing 接口示例实现，但它需要部署到你自己的服务环境后，才能得到真正可填写的地址。

## 仓库结构

- `src/`
  插件源码。
- `scripts/build.mjs`
  构建远程单文件脚本。
- `scripts/bing-relay.mjs`
  示例搜索接口服务（当前实现为 Bing 中继）。
- `scripts/print-installer.mjs`
  生成一行式安装器导入语句。
- `scripts/smoke-browser.mjs`
  实站 smoke 验证脚本。
- `dist/ims.js`
  构建后的远程单文件脚本。
## 安装依赖

```bash
npm install
```

## 构建

```bash
npm run build
```

构建成功后会生成：

- `dist/ims.js`
- `dist/ims.js.map`

## 推荐导入方式

### 1. 生成安装器导入语句

```bash
npm run print:installer -- https://<your-domain>/ims.js https://<your-search-api>/search
```

第一个参数：
- 远程脚本地址。

第二个参数：
- 可选的默认搜索接口地址。
- 如果你提供了自己的搜索服务，建议在安装器里一并写入。

### 2. 在 iirose 的 JS 终端执行生成的一行脚本

安装器会：
- 定位当前有效页面上下文。
- 优先注入到 `mainFrame`。
- 避免重复初始化。
- 自动加载远程单文件脚本。

## 搜索接口地址

插件前端支持两种搜索地址：

- 直连 Bing 图片搜索页地址
- 自定义 JSON 搜索接口地址

### 自定义接口协议

```text
GET https://your-search-service/search?q=关键词&limit=8
```

返回 JSON：

```json
{
  "items": [
    {
      "id": "xxx",
      "name": "xxx",
      "keywords": ["xxx"],
      "url": "https://example.com/a.jpg",
      "enabled": true
    }
  ]
}
```

### 默认直连 Bing

当前默认值：

```text
https://cn.bing.com/images/search
```

插件会自动在这个地址后追加：

- `q`
- `form`

并尝试直接解析 Bing 图片搜索页。

注意：

- 这是实验性默认方案。
- 某些浏览器环境下会因为跨域限制导致 `Failed to fetch`。
- 如果你遇到这种情况，请改用自定义搜索接口地址。

## 示例 Bing 中继

浏览器直接请求 Bing 可能受跨域策略影响。正式使用时，建议提供一个自己的搜索接口。当前仓库内置了一个 Bing 中继示例。

本仓库提供了一个最小可用 Node 中继：

```bash
npm run relay:bing
```

默认监听：

```text
http://localhost:8787/search?q=猫猫
```

返回格式：

```json
{
  "items": [
    {
      "id": "xxx",
      "name": "xxx",
      "keywords": ["xxx"],
      "url": "https://example.com/a.jpg",
      "enabled": true
    }
  ]
}
```

正式部署时，可以将 `scripts/bing-relay.mjs` 部署到你自己的 Node 服务环境。

## 配置项

当前支持以下配置：

- `triggerPrefix`
  触发前缀，默认 `/m`
- `searchApiUrl`
  搜索接口地址，可为空；为空时优先读取安装器注入的默认地址
- `keywordPrefixes`
  检索前缀词列表，支持多个
- `maxCandidates`
  候选上限，默认 `8`，范围 `1-20`

## 开发验证

运行测试：

```bash
npm test
```

当前测试覆盖：
- 触发前缀解析。
- 候选上限限制。
- 多前缀词解析。
- 查询词拼接。
- 搜索接口地址配置。
- Bing 结果 HTML 解析。

如果你本机 Chrome 已登录 iirose，也可以做实站 smoke：

```bash
node scripts/smoke-browser.mjs <ws-endpoint>
```

## 当前实现说明

- 候选条是输入框锚定的非模态悬浮候选条。
- 配置面板与候选条分离。
- 发送优先复用 iirose 页面原生 `moveinput.keydown()` 入口。
- 当前版本只承诺网页端。

## 已知限制

- 如果搜索接口后端依赖 Bing 页面解析，Bing 结构变化可能影响结果。
- 浏览器直连公共搜索站点通常存在跨域风险，因此正式使用建议配置自己的搜索接口地址。
- iirose 前端 DOM 结构若变动，输入框定位或发送入口可能需要适配。
