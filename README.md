# iirose-meme-searcher

IIROSE 表情包搜索插件，支持快速搜索并发送表情包图片到公屏。

## 快速使用

如果你只是普通用户，不参与开发，直接把下面这个链接粘贴到 IIROSE 终端里即可：

```text
https://cdn.jsdelivr.net/gh/Nobeta-Work/iirose-meme-searcher@v0.1.0/dist/bundle.js
```

### 使用步骤

1. 打开 IIROSE 页面。
2. 左侧菜单进入：**工具** -> **终端**。
3. 在终端输入 `js` 并回车。
4. 粘贴上面的链接并回车执行。
5. 加载完成后，**双击页面任意位置**打开配置面板。
6. 配置说明：
   - **搜索接口地址**：默认已内置中继服务 `https://iirose-meme-searcher.iirose-meme-searcher.workers.dev/search`
   - **检索前缀词**：默认已内置 `duitang.com`、`表情包`、`白圣女`
   - **候选数量**：默认 `8`，可配置范围 `1-20`
7. 回到聊天输入框，输入 `/m 开心` 这类内容开始搜索。
8. 点击候选图片即可发送到公屏。

### 前缀词参考
- 塞西莉亚: [duitang.com 白圣女] ~~低表情命中率~~
- 猫: [huaban.com 猫 表情包]
- 抽象表情包: [qiubiaoqing.com 抽象 表情包 ]

---

## 功能概览

- 触发前缀默认是 `/m`。
- 支持 `/m关键词` 和 `/m 关键词` 两种输入方式。
- 默认使用 Cloudflare Workers 中继服务，解决跨域问题。
- 默认内置多个检索前缀词：`duitang.com`、`表情包`、`白圣女`，也支持用户自行修改。
- 候选数量默认 `8`，可配置范围 `1-20`。
- 发送成功后会清空输入框。
- 候选条会在删除前缀、切换房间、发送成功后自动关闭或重置。

### UI 特性

- **配置面板**：双击页面任意位置显示，5 秒后自动隐藏，隐藏状态下鼠标穿透不影响点击。
- **候选条**：透明背景，只显示图片，无文字标签。
- **候选条**：支持滚轮横向滚动查看更多结果。

---

## 查询词拼接规则

如果配置面板中设置了多个检索前缀词，它们会在搜索时自动拼接到用户关键词前面。

**示例：**

- 检索前缀词：
  - `duitang.com`
  - `表情包`
  - `白圣女`
- 用户输入：`/m 开心`
- 最终查询词：`duitang.com 表情包 白圣女 开心`

---

## 搜索接口协议

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

---

## 仓库结构

- `src/` - 插件源码
- `scripts/build.mjs` - 构建远程单文件脚本
- `scripts/print-installer.mjs` - 生成一行式安装器导入语句
- `dist/bundle.js` - 构建后的远程单文件脚本

---

## 安装依赖

```bash
npm install
```

## 构建

```bash
npm run build
```

构建成功后会生成：

- `dist/bundle.js`
- `dist/bundle.js.map`

---

## 推荐导入方式

### 生成安装器导入语句

```bash
npm run print:installer -- https://<your-domain>/bundle.js https://<your-search-api>/search
```

参数说明：

- 第一个参数：远程脚本地址（必填）
- 第二个参数：可选的默认搜索接口地址

### 在 iirose 的 JS 终端执行生成的一行脚本

安装器会：

- 定位当前有效页面上下文。
- 优先注入到 `mainFrame`。
- 避免重复初始化。
- 自动加载远程单文件脚本。

---

## 配置项

当前支持以下配置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `triggerPrefix` | 触发前缀 | `/m` |
| `searchApiUrl` | 搜索接口地址 | `https://iirose-meme-searcher.iirose-meme-searcher.workers.dev/search` |
| `corsProxyUrl` | CORS 代理地址（可选） | 空 |
| `keywordPrefixes` | 检索前缀词列表 | `['duitang.com', '表情包', '白圣女']` |
| `maxCandidates` | 候选上限 | `8` (范围 `1-20`) |
| `debug` | 调试模式 | `false` |

---

## 开发验证

### 运行测试

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

---

## 当前实现说明

- 候选条是输入框锚定的非模态悬浮候选条。
- 配置面板与候选条分离。
- 发送优先复用 iirose 页面原生 `moveinput.keydown()` 入口。
- 当前版本只承诺网页端。

---

## 已知限制

- 如果搜索接口后端依赖 Bing 页面解析，Bing 结构变化可能影响结果。
- 浏览器直连公共搜索站点通常存在跨域风险，因此正式使用建议配置自己的搜索接口地址。
- iirose 前端 DOM 结构若变动，输入框定位或发送入口可能需要适配。

---

## 版本

当前版本：`v0.1.0`

### 变更日志

#### v0.1.0

- 网页端远程 JS 导入
- 输入框锚定的非模态候选条
- 通过可配置搜索接口地址进行图片搜索
- 多个检索前缀词配置
- 点击候选后发送裸图片 URL
- 轻量配置面板（双击触发，5 秒自动隐藏）
- 候选条透明化，只显示图片
- 默认使用 Cloudflare Workers 中继服务
