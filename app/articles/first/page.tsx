"use client";

import React from "react";
import Link from "next/link";

export default function FirstArticle() {
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
        paddingTop: "50px",
        color: "#00ff00",
        overflow: "auto"

      }}
    >
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
          .content-box {
            border: 5px outset #ff00ff;
            background-color: #000080;
            color: #ffffff;
            width: 80%;
            max-width: 800px;
            padding: 20px;
            margin-bottom: 20px;
          }

          a:link { color: #0000ff; text-decoration: underline; }
          a:visited { color: #800080; text-decoration: underline; }
          a:hover { color: #ff0000; text-decoration: none; cursor: crosshair; }
        `
      }} />

      <h1 className="blink-text" style={{ color: "#ffff00", fontSize: "3rem", margin: "0 0 20px 0" }}>
        第一篇文章！WIP！
      </h1>

      <div className="content-box">
        <p>欢迎来到我的安格瑞博客的第一篇文章！！！😡（注意，目前为WIP）</p>
        <p>好的，今天我们就来探讨，我是谁？</p>
          <p>这真是个深奥的话题，以至于我想不到该如何回应，首先，如果你认为我存在，那么我应该是一个人类，但我又似乎不是，我应该是15y.o. 但去他妈的吧，每个人都知道个人主页里的年龄都是瞎写的<small><small><small>(其实是真的)</small></small></small></p>
          <big><big>你知道吗，这是来自html4时期的大字体，如果你看见的是大字，那么说明这个标签可能被解析了，我曾经用这个标签在mcmod做过短评核弹，但又有什么意义呢，没错，一切就是如此的没有意义...？<br/></big></big>
          <p>读到这里你应该发现我的语言能力相当捉急，哈哈，这是当然，写作从来都不是我的长处，关键现在我还困的要死，现在是凌晨5：30，我想睡觉</p>
          <p>我现在正在想，为什么没有人跟我一起玩dnd，可能只是因为我的charisma过于低下，也有可能是我患有严重的傻逼症，或者是大家单纯的对角色扮演和又臭又长的规则不感兴趣，也许都有吧</p>
          <p>好的，跑题了，但现在我们要开始真正的探讨我是谁，我知道这是一篇0分作文，文字好像犹如我发癫时拉出来的大粪，但这都不重要，真的。我现在居住在开普勒22b（这不可能）然后管理着一个邪恶的资本主义商业泛星系集团</p>
          <p>我会通过短讯术与我的商业帝国交谈，然后使用异界传送来四处通勤（真的吗，好像是假的）最后释放饕餮虚空来将我们的竞争对手物理灭除。我们的业务就是收集宇宙中的安格瑞能量，什么是安格瑞能量，就是字面意思，让你感到愤怒的能量<br/>
          它是宇宙中的原始资本，如果宇宙失去了安格瑞，那么所有依赖CNO循环和P-P链聚变的恒星就会全部原地坍缩成白矮星，你现在应该意识到了它有多么的不可或缺。但可悲的是，大部分文明根本没有意识到安格瑞的重要性；<br/>
          我们需要澄清一个概念，安格瑞并不等于仇恨，它只是原始的愤怒，疯狂，狂暴。而不是有预谋的仇恨报复行动，这不安格瑞，这叫怠惰，安格瑞就好比你试图用在java中用反射来修改final变量一样，这就是安格瑞，不稳定，但纯粹；虽然现在市场主流不再接受安格瑞（JEP500）<br/>
          但就如前文所说，它仍然是驱动恒星的必要资源。<br/>
              再说一下我平日里的生活吧，实际上，我现在在另一个晶壁系，这里是一个高科高魔世界，所以你就算来到你所在宇宙的开普勒22b，我也大概率不在”那里”<br/>
              承认吧，地球online很无趣，不是吗，它是一个设计失败的网游，充斥着P2W和诡异的平衡，太多杂乱，无意义的事情了。为什么生活里就不能多一点不可思议的，真正有趣的东西呢，我曾经也在地球online像区一样蠕动过，但现在我不一样了！
              我将觉醒哈哈哈，困死了，先睡了，不再探讨安格瑞了
          </p>
          <h1 style={{color:"red",fontSize: "4rem"}}>不要滥用安格瑞</h1>
          <p>WIP...</p>
        <br />
        <p>
          <Link href="/">[ 返回主页 ]</Link>
        </p>
      </div>
    </div>
  );
}
