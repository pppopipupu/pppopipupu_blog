# 音乐播放器架构与开发规范

本文档记录了项目中音乐播放器的整体架构设计、复古视觉规范、3D 粒子系统、以及物理运动引擎的实现细节，供后续维护与修改此组件时参考。

## 关联文件

- 主播放器组件：[MusicPlayer.tsx](file:///c:/Users/pppop/Desktop/pppopipupu_blog/components/MusicPlayer.tsx)
- 动态加载包装组件：[DynamicMusicPlayer.tsx](file:///c:/Users/pppop/Desktop/pppopipupu_blog/components/DynamicMusicPlayer.tsx)
- 音频文件静态扫描：[next.config.ts](file:///c:/Users/pppop/Desktop/pppopipupu_blog/next.config.ts)
- 全局布局：[app/layout.tsx](file:///c:/Users/pppop/Desktop/pppopipupu_blog/app/layout.tsx)

## 核心架构设计

### 1. 静态音频扫描与加载机制
为了兼容项目的静态导出（output: 'export'）限制，无法在运行时提供 Next.js 服务端 API 路由进行音乐文件夹扫描。因此，项目在 [next.config.ts](file:///c:/Users/pppop/Desktop/pppopipupu_blog/next.config.ts) 的配置加载阶段，由 Node 环境执行同步文件扫描，读取 `public/music/` 目录下的所有 MP3 音频，并自动写入静态的 `public/music/list.json` 曲目列表。
客户端在初始化时，使用 fetch 请求该 `list.json` 获取所有歌曲文件名，并拼接环境变量 `NEXT_PUBLIC_BASE_PATH` 以动态获取完整的音频地址。

### 2. 视觉设计系统（Y2K 像素复古美学）
播放器界面采用了 Winamp 风格的像素复古美学设计：
- 双重边框：采用明暗相间的粗像素边框，呈现硬核复古金属质感。
- 酸性渐变与荧光色：主色调选用荧光绿（#00ff00）与霓虹粉（#ff00ff），并在 CD 开启按钮使用 conic-gradient 全息渐变。
- 液晶滚动屏：歌名以 marquee 动画在大字号液晶字体（Courier New / 等宽字体）中水平滚动播放。
- 状态存储：播放器的开启与关闭状态会实时同步存入 localStorage（键名为 musicPlayerEnabled），以便在跨页面浏览时保持一致性。

### 3. 3D 粒子系统与层级透传
为增强视觉张力，播放器顶层集成了一个 React Three Fiber 驱动的 Canvas，包含以下两种粒子特效：
- [Particles](file:///c:/Users/pppop/Desktop/pppopipupu_blog/components/MusicPlayer.tsx#L7)：在播放器内部区域形成呈正弦/余弦规律波动的流沙波浪，运动幅度与速度与当前播放状态绑定。
- [BorderParticles](file:///c:/Users/pppop/Desktop/pppopipupu_blog/components/MusicPlayer.tsx#L53)：随机在播放器的上、下、左、右四壁边界区域产生微小的 boxGeometry 立方体粒子并往外喷射，通过在 Tick 中减少生命周期实现渐隐。
- 穿透机制：将 3D Canvas 容器置于 z-index: 3 的顶层，并在 Canvas 及其容器标签上设置 pointer-events: "none" 的 inline styles。这使得鼠标手势与点击事件能无阻碍地穿透至 z-index: 2 的播放器控制按钮上，兼顾了顶级特效呈现与顺畅交互。

### 4. 窗口物理抖动与狂暴碰撞引擎
- 普通播放抖动：播放状态下，播放器容器添加 jitter-active 样式，由 CSS 动画在 0.15s 内高频轻微偏移并配合强荧光阴影，实现随声波颤抖的质感。
- 狂暴碰撞（发癫）物理模拟：每隔 5 秒有 30% 概率触发持续时间为 3 秒的 glitch 状态。
  - 启动阶段：记录原始 CSS 过渡状态，并强行阻断 CSS transition（`el.style.transition = "none"`）。
  - 物理仿真阶段：利用 `requestAnimationFrame` 驱动 ticks 闭包。在 tick 中获取当前窗口可视尺寸，根据预设速度（3200px/s 至 5000px/s）以及上一帧的时间差 delta，实时更新 dx 与 dy 偏置，通过 `el.style.transform = translate(dx, -dy)` 让播放器快速移动。
  - 弹性边界碰撞：当检测到播放器外边缘碰触窗口视口四壁时，立刻对运动速度（vx/vy）进行方向取反，实现无旋转的垂直反弹效果。
  - 优雅归位设计：为避免运动结束后窗口瞬间传送回原位的糟糕体验，重置逻辑在最后一帧清空 `transform` 样式，并重新激活 CSS 过渡属性（transition 包含 transform 属性）。通过缓动公式使容器流畅、弹性地归位至 React 的默认定位（left: 30px, bottom: 30px）。

## 编码约束与原则

- 严禁包含任何注释：在修改任何代码文件时，不得添加新的双斜杠或多行注释，同时也不允许删除任何现有的注释。
- 严禁在文档中包含 emoji：在任何 markdown 文档或代码文档中，严禁混入任何 emoji 字符。
- 采用最新的 React API：遵循 Next.js 客户端组件的最佳实践，状态管理使用 useMemo/useEffect/useRef 进行精细化调优。
