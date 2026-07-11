// Binance AI Assistant - Scriptable installer/updater
// Copy this file into Scriptable once. Re-run it whenever you want to update.

const SOURCE_URL =
  "https://raw.githubusercontent.com/A1rChina/Binance-AI-Assistant/main/src/BinanceSync.js";
const SCRIPT_NAME = "Binance Sync";
const EXPECTED_MARKER = "Binance USD-M Futures -> GitHub current snapshot";

await main();

async function main() {
  try {
    const location = await chooseLocation();
    if (!location) {
      Script.complete();
      return;
    }

    const fm = location === "icloud" ? FileManager.iCloud() : FileManager.local();
    const targetPath = fm.joinPath(fm.documentsDirectory(), `${SCRIPT_NAME}.js`);

    const source = await downloadSource();
    validateSource(source);

    const backupPath = backupExistingScript(fm, targetPath);
    fm.writeString(targetPath, source);

    const result = {
      ok: true,
      scriptName: SCRIPT_NAME,
      location,
      targetPath,
      backupPath,
      installedAt: new Date().toISOString(),
      source: SOURCE_URL,
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

async function downloadSource() {
  const request = new Request(SOURCE_URL);
  request.method = "GET";
  request.timeoutInterval = 30;
  request.headers = {
    Accept: "text/plain",
    "Cache-Control": "no-cache",
  };

  const text = await request.loadString();
  const status = request.response ? request.response.statusCode : 0;

  if (status < 200 || status >= 300) {
    throw new Error(`下载主脚本失败 HTTP ${status}`);
  }

  return text;
}

function validateSource(source) {
  if (typeof source !== "string" || source.length < 10000) {
    throw new Error("下载内容长度异常，未写入 Scriptable。");
  }

  if (!source.includes(EXPECTED_MARKER)) {
    throw new Error("下载内容校验失败，未写入 Scriptable。");
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
    `脚本：${result.scriptName}`,
    `位置：${result.location === "icloud" ? "iCloud" : "本机"}`,
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
