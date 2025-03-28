# Parasail 节点自动管理工具

用于自动管理 Parasail 网络节点的命令行工具。它可以自动完成节点的激活、签到和状态监控等任务，并支持多账号管理。

## 功能特性

- 自动节点激活与签到（每30分钟自动执行一次）
- 多账号管理支持，可同时管理多个钱包
- 实时节点状态监控与状态表格展示
- 简洁美观的命令行界面
- 自动化代理服务器配置
- 完整的日志记录与错误处理

## 项目结构

```
├── src/                # 源代码目录
│   ├── api/            # API调用模块
│   │   ├── node.js     # 节点相关API
│   │   └── user.js     # 用户认证API
│   ├── config/         # 配置处理模块
│   │   ├── loader.js   # 配置加载器
│   │   └── saver.js    # 配置保存器
│   ├── ui/             # 用户界面模块
│   │   ├── display.js  # 显示处理
│   │   └── layout.js   # 布局管理
│   └── utils/          # 工具类
│       ├── banner.js   # 顶部横幅
│       ├── logger.js   # 日志工具
│       └── proxy.js    # 代理管理
├── data/               # 数据存储目录
├── logs/               # 日志文件目录
├── index.js            # 程序入口文件
├── config.json         # 配置文件
├── config.example.json # 配置文件示例
├── privatekeys.txt     # 私钥文件（可选）
├── proxies.txt         # 代理配置文件（可选）
├── referLink.txt       # 推荐链接文件（可选）
└── package.json        # 项目依赖配置
```

## 安装说明

1. 确保您已安装 Node.js (v14+)
2. 克隆本仓库或下载代码
3. 在项目目录下运行 `npm install` 安装依赖

## 配置方法

有两种方式配置账号:

### 方法1: 使用配置文件 (config.json)

在项目根目录创建 `config.json` 文件:

```json
[
  {
    "privateKey": "你的钱包私钥",
    "proxy": "代理地址 (可选, 格式: http://用户名:密码@host:port 或 ip:port)",
    "custom_name": "账号名称",
    "referLink": "推荐链接 (可选)"
  },
  {
    "privateKey": "第二个钱包私钥",
    "proxy": "第二个代理 (可选)",
    "custom_name": "账号2"
  }
]
```

### 方法2: 使用文本文件

1. 在项目根目录创建 `privatekeys.txt` 文件，每行一个私钥
2. 可选: 创建 `proxies.txt` 文件，每行一个代理地址
3. 可选: 创建 `referLink.txt` 文件，在第一行写入推荐链接

```
# privatekeys.txt 示例
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# proxies.txt 示例 
http://user:pass@host:port
127.0.0.1:7890

# referLink.txt 示例
MHg0RmRkNmYwMDA5NjAzOTQ3M3mEXMDk2MEwMGZCc0N0QmNkN0NTi0
```

## 使用方法

```bash
npm start
```

启动后，程序会自动:
1. 验证并激活所有账号
2. 执行签到操作
3. 显示节点状态和账号概览表格
4. 开始30分钟倒计时，等待下一次
5. 每10分钟自动更新状态信息

## 界面说明

程序界面包含以下几个部分:
- **顶部横幅**: 显示程序版本和当前账号名称
- **左侧日志区**: 显示程序运行日志和多账号状态表格
- **右侧状态区**: 
  - 上部显示倒计时信息
  - 下部显示当前账号节点状态
- **底部状态栏**: 显示当前时间和连接状态

## 键盘快捷键

- `q` 或 `Ctrl+C`: 退出程序

## 日志文件

程序会在 `logs` 目录下生成日志文件，格式为 `parasail-YYYY-MM-DD.log`，记录所有操作过程。

## 版本历史

### v1.0.1 (2025-03-28)
- 项目结构采用模块化设计
- 多账号管理功能
- 表格显示
- 轮询策略，10分钟一次状态更新
- 日志显示问题
- 新增从referLink.txt读取推荐链接的功能