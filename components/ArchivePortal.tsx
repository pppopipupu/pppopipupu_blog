"use client";

import React from "react";
import Link from "next/link";

export default function ArchivePortal() {
  return (
    <div style={{
      width: "80%",
      maxWidth: "800px",
      border: "5px outset #ff00ff",
      backgroundColor: "#000080",
      padding: "20px",
      marginBottom: "50px",
      boxShadow: "10px 10px 0px #00ffff",
      textAlign: "center",
    }}>
      <h2 className="rainbow-text blink-text" style={{
        fontSize: "2.5rem",
        margin: "0 0 15px 0",
        textTransform: "uppercase"
      }}>
        ★★★ ARCHIVE!（Icerainboww Fandom相关） ★★★
      </h2>
      <p style={{ color: "#ffff00", fontSize: "1.1rem", marginBottom: "20px", lineHeight: "1.5" }}>
        Fandom界面存档，以供后人考究冻蓝虹-神女事件后续冻蓝虹修的史……
        （我也不知道为什么我要把它放到我的界面,可能因为我跟这件事也有关吧）
        <br/>
        声明：档案馆的内容全部为Icerainboww撰写，不代表我的观点，我挂在网站上只是为了单纯的记录这个事件。<br/>
        实际上我不赞同档案馆上的几乎所有内容，包括冻对伐木累的看法和Icebing的日志等，我只对冻做出的背刺和翻脸行为感到恶心。<br/>
        希望大家不要因为QQ的烂事继续外溢到百科，污染百科环境，也不要因为相关人士的退站而气愤，这件事情冻方面都是主动退站的，同时删除了大量百科用户的联系方式（包括我）。
      </p>
      <Link href="/archive" style={{ textDecoration: "none" }}>
        <div className="spell-btn" style={{
          border: "3px inset #00ffff",
          backgroundColor: "#000044",
          padding: "15px 30px",
          cursor: "crosshair",
          display: "inline-block",
          boxShadow: "4px 4px 0px #ff00ff"
        }}>
          <span style={{
            fontSize: "1.8rem",
            fontWeight: "bold",
            color: "#00ff00",
            textShadow: "2px 2px 0px #000"
          }}>
            ▶ 进入时光隧道 ◀
          </span>
        </div>
      </Link>
    </div>
  );
}
