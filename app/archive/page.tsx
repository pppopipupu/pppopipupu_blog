"use client";

import React from "react";
import Link from "next/link";

interface ArchiveLink {
  label: string;
  path: string;
}

interface ArchiveItem {
  name: string;
  date: string;
  description: string;
  links: ArchiveLink[];
}

// 存档列表：用户可以在此轻松添加新的归档网页
const ARCHIVE_LIST: ArchiveItem[] = [
  {
    name: "HeartMCMOD Wiki",
    date: "2026-06-03",
    description: "HeartMCMOD Wiki 的离线镜像存档。",
    links: [
      {
        label: "📖 Wiki 首页",
        path: "/archive/HeartMCMOD Wiki/HeartMCMOD Official Wiki ｜ Fandom (2026_6_3 08：01：49).html"
      },
      {
        label: "📑 所有页面索引",
        path: "/archive/HeartMCMOD Wiki/所有页面 ｜ HeartMCMOD Official Wiki ｜ Fandom (2026_6_3 07：47：00).html"
      }
    ]
  }
];

export default function ArchiveNavPage() {
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
      {/* 复古动画样式定义 */}
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
            margin-bottom: 30px;
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
          table.archive-table {
            border: 5px outset #00ffff;
            background-color: #000080;
            color: #ffffff;
            width: 80%;
            max-width: 900px;
            border-collapse: separate;
            border-spacing: 2px;
            box-shadow: 8px 8px 0px #ff00ff;
            margin-bottom: 40px;
          }
          table.archive-table th {
            border: 2px inset #ff00ff;
            background-color: #0a0040;
            color: #ffff00;
            padding: 12px;
            font-size: 1.2rem;
            text-transform: uppercase;
            font-family: sans-serif;
          }
          table.archive-table td {
            border: 2px inset #00ffff;
            padding: 15px;
            background-color: #000044;
          }
          .archive-link {
            color: #00ffff;
            text-decoration: underline;
            font-weight: bold;
          }
          .archive-link:hover {
            color: #ff00ff;
            text-decoration: none;
            background-color: #ffff00;
            color: #000;
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
          .guide-panel {
            width: 80%;
            max-width: 900px;
            border: 4px outset #ff00ff;
            background-color: #111111;
            padding: 20px;
            margin-bottom: 50px;
            box-shadow: 6px 6px 0px #00ff00;
            font-family: monospace;
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

      {/* 归档表格 */}
      <table className="archive-table">
        <thead>
          <tr>
            <th style={{ width: "20%" }}>存档时间</th>
            <th style={{ width: "25%" }}>项目名称</th>
            <th style={{ width: "35%" }}>说明</th>
            <th style={{ width: "20%" }}>传送门</th>
          </tr>
        </thead>
        <tbody>
          {ARCHIVE_LIST.map((item, index) => (
            <tr key={index}>
              <td style={{ textAlign: "center", fontFamily: "monospace", color: "#00ff00", fontWeight: "bold" }}>
                {item.date}
              </td>
              <td style={{ color: "#ffff00", fontWeight: "bold", fontSize: "1.1rem" }}>
                {item.name}
              </td>
              <td style={{ color: "#ffffff", fontSize: "0.95rem", lineHeight: "1.4" }}>
                {item.description}
              </td>
              <td>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {item.links.map((link, lIndex) => (
                    <a
                      key={lIndex}
                      href={encodeURI(link.path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="archive-link"
                      style={{ display: "block", textAlign: "center", padding: "5px", border: "1px dashed #00ffff" }}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>


      {/* 返回主站按钮 */}
      <Link href="/" style={{ textDecoration: "none" }}>
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
