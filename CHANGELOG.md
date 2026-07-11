# Changelog

## 0.4.0 — 2026-07-11

- 增加从启用日起的前向收益追踪。
- 增加月度权益快照、成交和资金流水账本。
- 增加转入转出调整后的累计利润。
- 增加手续费、资金费和已实现盈亏分类汇总。
- 增加哈希记录键和重复数据合并。
- 增加 Scriptable 一键安装/更新器。
- 保留现有 Keychain 配置，更新主脚本无需重新输入密钥。

## 0.3.0

- 移除 WebView HMAC 依赖，改用纯 JavaScript HMAC-SHA256。
- 修复部分 iOS/Scriptable 版本的 `unsupported type` 错误。

## 0.2.0

- 修复 Scriptable WebView 返回对象导致的类型错误。
- 默认数据仓库改为 `A1rChina/sa`。

## 0.1.0

- 获取 Binance U 本位合约余额、持仓、普通挂单和条件单。
- 脱敏后覆盖写入 GitHub `binance/latest.json`。
