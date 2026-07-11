// Binance AI Assistant - Scriptable installer/updater
// Copy this file into Scriptable once. Re-run it whenever you want to update.

const RAW_BASE =
  "https://raw.githubusercontent.com/A1rChina/Binance-AI-Assistant/main/src";
const MANIFEST_URL = `${RAW_BASE}/manifest.json`;
const SCRIPT_NAME = "Binance Sync";

await main();

async function main() {
  try {
    const location = await chooseLocation();
    if (!location) return;

    const fm = location === "icloud" ? FileManager.iCloud() : FileManager.local();
    const targetPath = fm.joinPath(fm.documentsDirectory(), `${SCRIPT_NAME}.js`);

    const manifest = await downloadManifest();
    const source = await downloadParts(manifest);
    validateSource(source, manifest);

    const backupPath = backupExistingScript(fm, targetPath);
    fm.writeString(targetPath, source);

    const result = {
      ok: true,
      version: manifest.version,
      scriptName: SCRIPT_NAME,
      location,
      targetPath,
      backupPath,
      installedAt: new Date().toISOString(),
      manifest: MANIFEST_URL,
      partCount: manifest.parts.length,
      sourceLength: source.length,
    };

    Script.setShortcutOutput(JSON.stringify(result));
    await showSuccess(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error || "未知错误");
    console.error(message);
    Script.setShortcutOutput(JSON.stringify({ ok: false, error: message }));
    await showFailure(message);
  } finally {
    Script.complete();
  }
}

async function chooseLocation() {
  const alert = new Alert();
  alert.title = "安装 Binance AI Assistant";
  alert.message =
    "请选择脚本保存位置。已经在 Scriptable 中启用 iCloud 时，优先选择 iCloud。";
  alert.addAction("安装到 iCloud");
  alert.addAction("安装到本机");
  alert.addCancelAction("取消");

  const choice = await alert.presentSheet();
  if (choice === 0) return "icloud";
  if (choice === 1) return "local";
  return null;
}

async function downloadManifest() {
  const text = await downloadText(MANIFEST_URL, "安装清单");
  let manifest;

  try {
    manifest = JSON.parse(text);
  } catch (_) {
    throw new Error("安装清单不是有效 JSON。");
  }

  if (
    !manifest ||
    !Array.isArray(manifest.parts) ||
    manifest.parts.length === 0 ||
    !Number.isFinite(Number(manifest.length)) ||
    typeof manifest.marker !== "string"
  ) {
    throw new Error("安装清单字段不完整。");
  }

  return manifest;
}

async function downloadParts(manifest) {
  const chunks = [];

  for (let index = 0; index < manifest.parts.length; index += 1) {
    const relativePath = String(manifest.parts[index]).replace(/^\/+/, "");
    const url = `${RAW_BASE}/${relativePath}`;
    const label = `代码片段 ${index + 1}/${manifest.parts.length}`;
    chunks.push(await downloadText(url, label));
  }

  return chunks.join("");
}

async function downloadText(url, label) {
  const separator = url.includes("?") ? "&" : "?";
  const request = new Request(`${url}${separator}t=${Date.now()}`);
  request.method = "GET";
  request.timeoutInterval = 30;
  request.headers = {
    Accept: "text/plain",
    "Cache-Control": "no-cache",
  };

  const text = await request.loadString();
  const status = request.response ? request.response.statusCode : 0;

  if (status < 200 || status >= 300) {
    throw new Error(`${label}下载失败 HTTP ${status}`);
  }

  return text;
}

function validateSource(source, manifest) {
  const expectedLength = Number(manifest.length);

  if (typeof source !== "string" || source.length !== expectedLength) {
    throw new Error(
      `代码长度校验失败：期望 ${expectedLength}，实际 ${source.length}。`,
    );
  }

  if (!source.includes(manifest.marker)) {
    throw new Error("代码标记校验失败，未写入 Scriptable。");
  }

  if (!source.includes("await main();") || !source.includes("Script.complete();")) {
    throw new Error("主脚本结构校验失败，未写入 Scriptable。");
  }
}

function backupExistingScript(fm, targetPath) {
  if (!fm.fileExists(targetPath)) return null;

  const backupDirectory = fm.joinPath(fm.documentsDirectory(), "Backups");
  if (!fm.fileExists(backupDirectory)) {
    fm.createDirectory(backupDirectory, true);
  }

  const stamp = formatTimestamp(new Date());
  const backupPath = fm.joinPath(
    backupDirectory,
    `${SCRIPT_NAME}-${stamp}.js`,
  );

  const previousSource = fm.readString(targetPath);
  fm.writeString(backupPath, previousSource);
  return backupPath;
}

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

async function showSuccess(result) {
  const alert = new Alert();
  alert.title = "安装/更新完成";
  alert.message = [
    `版本：${result.version}`,
    `脚本：${result.scriptName}`,
    `位置：${result.location === "icloud" ? "iCloud" : "本机"}`,
    `代码片段：${result.partCount}`,
    result.backupPath ? "旧版本已备份到 Backups。" : "这是首次安装。",
    "以后重新运行此安装器即可更新。",
  ].join("\n");
  alert.addAction("运行 Binance Sync");
  alert.addCancelAction("稍后");

  const choice = await alert.presentAlert();
  if (choice === 0) {
    Safari.open(
      `scriptable:///run?scriptName=${encodeURIComponent(SCRIPT_NAME)}`,
    );
  }
}

async function showFailure(message) {
  const alert = new Alert();
  alert.title = "安装失败";
  alert.message = message.slice(0, 800);
  alert.addAction("知道了");
  await alert.presentAlert();
}
