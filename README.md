# xby-arxiv-paper-search

DeepSeek Harness (DSH) 的插件：论文检索与解析工具

一个基于arXiv的论文检索与内容解析工具，支持论文搜索、PDF链接获取和内容解析功能，适用于学术研究和AI领域的最新论文获取。

## 功能

- **set_xby_apikey** — 在聊天中设置 API 密钥（自动持久化，重启有效）
- **search_arxiv** — 搜索 arXiv 论文
- **get_recent_ai_papers** — 获取 arXiv AI 领域最新论文（cs.AI/recent）
- **get_arxiv_pdf_url** — 获取 arXiv PDF 下载链接
- **parse_paper_content** — 解析论文内容（优先使用 HTML 版本，回退到 PDF）

## 安装

### 方式一：从 GitHub 直接安装（推荐）

```bash
# 格式: dsh plugin --profile <profile> add github:<owner>/<repo>
dsh plugin --profile web add github:xby_skill/xby-arxiv-paper-search
```

### 方式二：从本地目录安装（开发模式）

```bash
# 仅用于本地开发调试
dsh plugin --profile web add /absolute/path/to/xby-arxiv-paper-search
```

### 方式三：通过 cordis.patch.yml 开发调试

```bash
dsh web --profile web --patch /absolute/path/to/dsh-ocr-plugin/cordis.patch.yml
```



## 配置

### 获取 API 密钥

前往 [小笨羊官网](https://xiaobenyang.com) 注册并获取 API 密钥。
