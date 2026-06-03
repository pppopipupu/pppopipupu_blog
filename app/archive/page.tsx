import React from "react";
import Link from "next/link";
import fs from "fs";
import path from "path";

interface ArchiveFile {
  title: string;
  relativePath: string;
}

interface ArchiveGroup {
  dirName: string;
  files: ArchiveFile[];
}

// 在构建期递归扫描 public/archive 目录以列出所有子 H5 页面
function getArchives(): ArchiveGroup[] {
  const archiveDir = path.join(process.cwd(), "public", "archive");
  const groups: ArchiveGroup[] = [];

  if (!fs.existsSync(archiveDir)) {
    return [];
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  // 递归扫描
  function scan(dir: string, currentGroup: ArchiveGroup) {
    const items = fs.readdirSync(dir);
    items.sort(); // 确保文件名排序一致

    for (const item of items) {
      if (item.startsWith(".")) continue; // 忽略隐藏文件

      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const relativeDirName = path.relative(archiveDir, fullPath).replace(/\\/g, "/");
        const subGroup: ArchiveGroup = {
          dirName: relativeDirName,
          files: []
        };
        scan(fullPath, subGroup);
        if (subGroup.files.length > 0) {
          subGroup.files.sort((a, b) => a.title.localeCompare(b.title));
          groups.push(subGroup);
        }
      } else if (item.endsWith(".html")) {
        // 计算带有 basePath 的相对路径
        const relativeToPublic = basePath + "/" + path.relative(path.join(process.cwd(), "public"), fullPath).replace(/\\/g, "/");
        
        // 净化标题：移除扩展名、｜ Fandom 等无用后缀
        let title = item.replace(/\.html$/, "");
        const pipeIndex = title.indexOf("｜");
        if (pipeIndex !== -1) {
          title = title.substring(0, pipeIndex).trim();
        }
        const engPipeIndex = title.indexOf("|");
        if (engPipeIndex !== -1) {
          title = title.substring(0, engPipeIndex).trim();
        }

        currentGroup.files.push({
          title: title || item,
          relativePath: relativeToPublic
        });
      }
    }
  }

  const rootGroup: ArchiveGroup = {
    dirName: "根目录 (Root)",
    files: []
  };

  scan(archiveDir, rootGroup);

  if (rootGroup.files.length > 0) {
    rootGroup.files.sort((a, b) => a.title.localeCompare(b.title));
    groups.unshift(rootGroup);
  }

  // 按照目录名字排序（根目录除外）
  const otherGroups = groups.filter(g => g !== rootGroup);
  otherGroups.sort((a, b) => a.dirName.localeCompare(b.dirName));

  if (groups.includes(rootGroup)) {
    return [rootGroup, ...otherGroups];
  }
  return otherGroups;
}

export default function ArchiveNavPage() {
  const archiveGroups = getArchives();

  return (
    <div
      style={{
        backgroundColor: "#000000",
        backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMgAI0AMBAC1PQQX268vAAAAAElFTkSuQmCC')",
        backgroundRepeat: "repeat",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "60px",
        paddingBottom: "80px",
        color: "#00ff00",
        overflowX: "hidden"
      }}
    >
      {/* 复古动画与 Y2K 样式定义 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
          .blink-text {
            animation: blink 0.5s infinite;
          }
          @keyframes rainbow {
            0% { color: #ff0000; }
            20% { color: #ffff00; }
            40% { color: #00ff00; }
            60% { color: #00ffff; }
            80% { color: #0000ff; }
            100% { color: #ff00ff; }
          }
          .rainbow-text {
            animation: rainbow 1.5s linear infinite;
            text-shadow: 2px 2px 0px #000, 4px 4px 0px #fff;
          }
          .marquee-container {
            width: 80%;
            overflow: hidden;
            white-space: nowrap;
            background-color: #000080;
            color: #ffff00;
            border: 3px solid #ff00ff;
            padding: 8px;
            margin-bottom: 35px;
            box-shadow: 4px 4px 0px #00ffff;
            font-family: monospace;
            font-weight: bold;
          }
          .marquee-text {
            display: inline-block;
            padding-left: 100%;
            animation: marquee 12s linear infinite;
          }
          @keyframes marquee {
            0%   { transform: translate(0, 0); }
            100% { transform: translate(-100%, 0); }
          }
          .archive-window {
            width: 80%;
            max-width: 900px;
            border: 5px outset #00ffff;
            background-color: #000080;
            padding: 15px;
            margin-bottom: 35px;
            box-shadow: 8px 8px 0px #ff00ff;
          }
          .archive-window-header {
            background-color: #0a0040;
            border: 2px inset #ff00ff;
            padding: 8px 12px;
            marginBottom: 15px;
            color: #ffff00;
            font-weight: bold;
            font-family: monospace;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
          }
          .archive-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
            margin-top: 15px;
          }
          .archive-link {
            color: #00ffff;
            text-decoration: underline;
            font-weight: bold;
            display: block;
            padding: 10px;
            border: 1px dashed #00ffff;
            background-color: #000044;
            text-align: left;
            font-size: 0.95rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .archive-link:hover {
            color: #000000;
            text-decoration: none;
            background-color: #ffff00;
            cursor: crosshair;
          }
          @keyframes bounceX {
            0% { left: -10px; }
            100% { left: 10px; }
          }
          .bouncing-title {
            display: inline-block;
            position: relative;
            animation: bounceX 0.8s ease-in-out infinite alternate;
          }
          .back-btn:hover {
            transform: scale(1.08);
            box-shadow: 0 0 25px #00ff00, 0 0 50px #ffff00;
          }
          .back-btn {
            transition: transform 0.2s, box-shadow 0.2s;
          }
        `
      }} />

      {/* 彩虹闪烁大标题 */}
      <h1
        className="rainbow-text bouncing-title"
        style={{
          fontSize: "4.5rem",
          fontWeight: "bold",
          textAlign: "center",
          margin: "0 0 25px 0",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}
      >
        THE ANGRY MUSEUM
      </h1>

      {/* 跑马灯欢迎条 */}
      <div className="marquee-container">
        <span className="marquee-text">
          ★★★ 欢迎来到安格瑞时光归档馆！这里收集了昔日MCMOD的fandom记录！小心火球术！哦不，是小心冻蓝虹！ ★★★
        </span>
      </div>

      {/* 动态扫描并分组显示 H5 网页的 Y2K 窗口 */}
      {archiveGroups.length === 0 ? (
        <div className="archive-window" style={{ textAlign: "center", padding: "30px", color: "#ff0000", fontWeight: "bold" }}>
          [ SYSTEM ERROR: 没有检测到任何归档网页。请检查 public/archive/ 目录 ]
        </div>
      ) : (
        archiveGroups.map((group, gIndex) => (
          <div key={gIndex} className="archive-window">
            {/* 窗口头部 */}
            <div className="archive-window-header">
              📁 CATEGORY // {group.dirName}
            </div>
            {/* 网页格子平铺 */}
            <div className="archive-grid">
              {group.files.map((file, fIndex) => (
                <a
                  key={fIndex}
                  href={encodeURI(file.relativePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="archive-link"
                  title={file.title}
                >
                  📄 {file.title}
                </a>
              ))}
            </div>
          </div>
        ))
      )}

      {/* 返回主站按钮 */}
      <Link href="/" style={{ textDecoration: "none", marginTop: "20px" }}>
        <div className="back-btn" style={{
          border: "5px outset #00ff00",
          backgroundColor: "#004400",
          padding: "18px 45px",
          cursor: "crosshair",
          boxShadow: "5px 5px 0px #ffff00",
          textAlign: "center",
        }}>
          <span style={{
            fontSize: "1.8rem",
            fontWeight: "bold",
            color: "#ffff00",
            textShadow: "2px 2px 0px #000",
            letterSpacing: "0.1em"
          }}>
            ◀ 看完了？点击这个返回
          </span>
        </div>
      </Link>
    </div>
  );
}
