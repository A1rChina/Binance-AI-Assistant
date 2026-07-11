# Binance AI Assistant

通过 iPhone 上的 Scriptable 读取 Binance U 本位合约账户，并将脱敏后的当前状态与从启用日起的收益数据写入 GitHub，供 ChatGPT 进行风险审计和收益分析。

## 工作方式

```text
iPhone / Scriptable
        ↓ Binance 只读 API
余额、持仓、挂单、成交、资金流水
        ↓ 脱敏、去重、汇总
GitHub 私有数据仓库
        ↓
ChatGPT 分析
```

本仓库只保存程序代码，不保存 Binance API Key、API Secret、GitHub Token 或账户数据。

## 文件结构

```text
Binance-AI-Assistant/
├─ Installer.js           # Scriptable 安装器/更新器
├─ Installer.txt          # 便于 iOS 浏览器复制的安装器文本
├─ src/
│  └─ BinanceSync.js      # 主同步脚本
└─ CHANGELOG.md
```

## iOS 安装

### 第一次安装

1. 在 iPhone Safari 中打开本仓库的 `Installer.txt`。
2. 点击 **Raw**，全选并复制全部内容。
3. 打开 Scriptable，点击右上角 `+` 新建脚本。
4. 粘贴内容，命名为 `Install Binance AI Assistant`。
5. 运行安装器，选择安装到 iCloud 或本机。
6. 安装完成后运行自动生成的 `Binance Sync`。

### 后续更新

重新运行 `Install Binance AI Assistant`。安装器会：

- 从本仓库下载最新的 `src/BinanceSync.js`；
- 自动备份旧版本到 Scriptable 的 `Backups` 目录；
- 覆盖安装最新版本；
- 保留 Keychain 中已经保存的密钥和配置。

## 首次配置

主脚本第一次运行会要求填写：

- Binance API Key；
- Binance API Secret；
- GitHub Fine-grained Personal Access Token；
- 数据仓库所有者、仓库名、分支和文件路径。

当前默认配置为：

```text
GitHub 用户名：A1rChina
数据仓库：sa
分支：main
当前快照：binance/latest.json
```

目录不需要手动建立，脚本会自动创建。

## 权限要求

### Binance API

只启用读取权限：

```text
✅ Enable Reading
❌ Spot & Margin Trading
❌ Futures Trading
❌ Universal Transfer
❌ Withdrawals
```

请为本工具单独创建 API Key，不要复用自动交易程序的密钥。

### GitHub Token

创建 Fine-grained Personal Access Token：

```text
Repository access：只选择数据仓库 sa
Repository permissions：Contents → Read and write
其他权限：No access
```

数据仓库包含账户余额、持仓和收益信息，建议设为 **Private**。

## 数据结构

主脚本会在数据仓库中维护：

```text
sa/
└─ binance/
   ├─ latest.json
   ├─ index.json
   └─ history/
      ├─ 2026-07.json
      ├─ 2026-08.json
      └─ ...
```

- `latest.json`：当前账户、持仓、挂单和实时风险状态，持续覆盖。
- `index.json`：追踪起点、累计收益、转入转出和月份索引。
- `history/YYYY-MM.json`：从启用脚本之日起的权益快照、成交和资金流水，持续追加并去重。

脚本不会回填启用前的历史数据。

## 收益口径

```text
调整后利润 = 当前权益 - 起始权益 - 追踪期净转入
```

同时分别记录：

- `REALIZED_PNL`：已实现盈亏；
- `COMMISSION`：手续费；
- `FUNDING_FEE`：资金费；
- `TRANSFER`：转入和转出；
- 每次运行时的账户权益和浮动盈亏。

建议每天至少运行一次。若超过约 80 天未同步，Binance 普通资金流水接口的回溯窗口可能造成数据缺口。

## 快捷指令参数

在 iOS Shortcuts 中使用 Scriptable 的 **Run Script**：

| 参数 | 功能 |
|---|---|
| 留空 | 正常同步 |
| `setup` | 重新填写密钥与仓库配置 |
| `clear` | 清除 Scriptable Keychain 中的配置，仅建议在 Scriptable App 内手动执行 |

## ChatGPT 分析提示词

```text
@GitHub 读取 A1rChina/sa 中的 binance/index.json，
再根据 months 字段读取 binance/history/YYYY-MM.json。

分析从 startedAt 开始的：
1. 调整后实际利润；
2. 已实现盈亏、手续费和资金费；
3. 净转入转出；
4. 月度收益和权益曲线；
5. 最大回撤；
6. 胜率、盈亏比、平均单笔收益；
7. 不同交易对和多空方向的收益贡献；
8. 当前持仓风险。

转账不得计入交易收益，并说明数据时间与完整性警告。
```

## 安全边界

- API Key、Secret 和 GitHub Token 只保存在 Scriptable Keychain。
- GitHub 文件中使用哈希后的记录键去重，不上传原始订单 ID、客户端订单 ID 和账户 UID。
- 本工具仅做只读采集与分析，不下单、不撤单、不调整杠杆、不划转、不提币。
