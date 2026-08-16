"use client";

export interface PhysicsBody {
  id: string;
  element: HTMLElement;
  originalElement: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  angle: number;
  vAngle: number;
  mass: number;
  restitution: number;
  isDragging: boolean;
  isSettled: boolean;
  origDocX: number;
  origDocY: number;
}

export class DOMPhysicsEngine {
  private bodies: PhysicsBody[] = [];
  private container: HTMLDivElement | null = null;
  private animId: number | null = null;
  private isRunning = false;
  private isReverting = false;
  private draggedBody: PhysicsBody | null = null;
  private dragOffset = { x: 0, y: 0 };
  private lastMousePos = { x: 0, y: 0, time: 0 };
  private mouseVelocity = { vx: 0, vy: 0 };

  public init() {
    if (!this.container || !document.body.contains(this.container)) {
      const cont = document.createElement("div");
      cont.id = "thunder-physics-container";
      cont.style.position = "fixed";
      cont.style.inset = "0";
      cont.style.background = "transparent";
      cont.style.pointerEvents = "none";
      cont.style.zIndex = "9990";
      cont.style.overflow = "hidden";
      document.body.appendChild(cont);
      this.container = cont;
    }

    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);

    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  public captureAndShatter(strikePoints: { x: number; y: number }[]) {
    this.init();
    if (!this.container) return;

    if (this.bodies.length > 0) {
      this.applyShockImpulses(strikePoints);
      return;
    }

    const capturedSet = new Set<HTMLElement>();

    const isValidTarget = (el: HTMLElement) => {
      if (
        el === document.body ||
        el === document.documentElement ||
        el.id === "thunder-button-root" ||
        el.id === "thunder-physics-container" ||
        el.closest("#thunder-button-root") ||
        el.closest("#thunder-physics-container")
      ) {
        return false;
      }

      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > window.innerWidth * 0.96 && h > window.innerHeight * 0.95) {
        return false;
      }

      return true;
    };

    document.querySelectorAll("div").forEach((el) => {
      if (
        el.offsetWidth > 150 &&
        el.offsetWidth <= 460 &&
        el.offsetHeight > 80 &&
        el.offsetHeight <= 650 &&
        el.innerText &&
        el.innerText.includes("WINAMP LITE")
      ) {
        let playerBox: HTMLElement = el;
        if (el.parentElement instanceof HTMLElement && el.parentElement.offsetWidth <= 470) {
          playerBox = el.parentElement;
        }
        if (isValidTarget(playerBox)) {
          capturedSet.add(playerBox);
        }
      }
    });

    document.querySelectorAll("canvas").forEach((canvas) => {
      if (canvas instanceof HTMLElement && isValidTarget(canvas)) {
        const parent = canvas.parentElement;
        if (
          parent &&
          isValidTarget(parent) &&
          parent.offsetHeight >= 150 &&
          parent.offsetHeight <= 500 &&
          parent.offsetWidth <= window.innerWidth * 0.95
        ) {
          capturedSet.add(parent);
        } else {
          capturedSet.add(canvas);
        }
      }
    });

    const targetSelectors = [
      "h1.rainbow-text",
      ".marquee-container",
      "h2.blink-text",
      "h2.rainbow-text",
      "h2",
      "table",
      "table.article-table",
      "table.article-table tr",
      "table.article-table th",
      "table.article-table td",
      ".article-table",
      "a",
      "button",
      "#comments",
      ".giscus",
      "section.giscus",
      "iframe.giscus-frame",
      "div.giscus",
      "giscus-widget",
      ".spell-twitch",
    ];

    targetSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (el instanceof HTMLElement && isValidTarget(el)) {
          capturedSet.add(el);
        }
      });
    });

    document.querySelectorAll("div").forEach((el) => {
      if (!(el instanceof HTMLElement) || !isValidTarget(el)) return;
      
      const hasGuestbook = el.innerText && el.innerText.includes("GUESTBOOK") && el.offsetWidth <= 850 && el.offsetHeight >= 100;
      const hasLLM = el.innerText && el.innerText.includes("VERY NB LLM") && el.offsetWidth <= 850 && el.offsetHeight >= 100;
      const hasArticles = el.innerText && el.innerText.includes("My Articles") && el.tagName === "TABLE";
      const hasOutsetBorder = el.style.border && (el.style.border.includes("outset") || el.style.border.includes("inset"));

      if (hasGuestbook || hasLLM || hasArticles || hasOutsetBorder) {
        capturedSet.add(el);
      }
    });

    const elementsList: HTMLElement[] = [];
    const rawArray = Array.from(capturedSet);
    rawArray.forEach((el) => {
      const isContained = rawArray.some(
        (other) => other !== el && other.contains(el)
      );
      if (!isContained) {
        elementsList.push(el);
      }
    });

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    elementsList.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;

      const clone = el.cloneNode(true) as HTMLElement;

      const srcCanvases = el.querySelectorAll("canvas");
      const dstCanvases = clone.querySelectorAll("canvas");
      if (el instanceof HTMLCanvasElement && clone instanceof HTMLCanvasElement) {
        try {
          const dataUrl = el.toDataURL();
          clone.style.backgroundImage = `url(${dataUrl})`;
          clone.style.backgroundSize = "contain";
          clone.style.backgroundRepeat = "no-repeat";
        } catch {}
      } else {
        srcCanvases.forEach((src, cIdx) => {
          const dst = dstCanvases[cIdx];
          if (dst) {
            try {
              const dataUrl = src.toDataURL();
              dst.style.backgroundImage = `url(${dataUrl})`;
              dst.style.backgroundSize = "contain";
              dst.style.backgroundRepeat = "no-repeat";
            } catch {}
          }
        });
      }

      const srcIframes = el.querySelectorAll("iframe");
      const dstIframes = clone.querySelectorAll("iframe");
      srcIframes.forEach((srcIframe, iIdx) => {
        const dst = dstIframes[iIdx];
        if (dst) {
          const iRect = srcIframe.getBoundingClientRect();
          const w = iRect.width > 0 ? iRect.width : 700;
          const h = iRect.height > 0 ? iRect.height : 300;
          dst.style.width = `${w}px`;
          dst.style.height = `${h}px`;
          dst.style.background = "#000044";
          dst.style.border = "2px dashed #00ffff";
          dst.style.boxShadow = "inset 0 0 20px rgba(0,255,255,0.3)";
        }
      });

      let initX = rect.left;
      let initY = rect.top;
      let initVx = 0;
      let initVy = 0;
      let initVAngle = (Math.random() - 0.5) * 0.4;

      const isBelowViewport = rect.top > screenHeight + 80;
      const isAboveViewport = rect.bottom < -80;

      if (isBelowViewport) {
        initX = Math.max(10, Math.min(screenWidth - rect.width - 10, rect.left));
        initY = screenHeight + 20 + (index % 5) * 35;
        initVy = -(24 + Math.random() * 18);
        initVx = (Math.random() - 0.5) * 18;
      } else if (isAboveViewport) {
        initX = Math.max(10, Math.min(screenWidth - rect.width - 10, rect.left));
        initY = -60 - (index % 4) * 30;
        initVy = 12 + Math.random() * 16;
        initVx = (Math.random() - 0.5) * 16;
      }

      clone.style.position = "absolute";
      clone.style.left = "0px";
      clone.style.top = "0px";
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.margin = "0";
      clone.style.boxSizing = "border-box";
      clone.style.transformOrigin = "center center";
      clone.style.cursor = "grab";
      clone.style.userSelect = "none";
      clone.style.pointerEvents = "auto";
      clone.style.willChange = "transform";
      clone.style.zIndex = `${100 + index}`;
      clone.style.boxShadow = "0 8px 30px rgba(0, 229, 255, 0.55)";
      clone.style.transform = `translate3d(${initX.toFixed(2)}px, ${initY.toFixed(2)}px, 0px) rotate(0rad)`;

      this.container?.appendChild(clone);
      el.style.visibility = "hidden";

      const body: PhysicsBody = {
        id: `body_${index}`,
        element: clone,
        originalElement: el,
        x: initX,
        y: initY,
        vx: initVx,
        vy: initVy,
        width: rect.width,
        height: rect.height,
        angle: 0,
        vAngle: initVAngle,
        mass: Math.max(1, (rect.width * rect.height) / 1000),
        restitution: 0.35 + Math.random() * 0.25,
        isDragging: false,
        isSettled: false,
        origDocX: rect.left + window.scrollX,
        origDocY: rect.top + window.scrollY,
      };

      clone.addEventListener("pointerdown", (e) => this.onBodyPointerDown(e, body));
      this.bodies.push(body);
    });

    this.applyShockImpulses(strikePoints);

    if (!this.isRunning) {
      this.isRunning = true;
      this.tick();
    }
  }

  private applyShockImpulses(strikePoints: { x: number; y: number }[]) {
    const defaultCenter = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
    const points = strikePoints.length > 0 ? strikePoints : [defaultCenter];

    this.bodies.forEach((body) => {
      body.isSettled = false;
      const bCenterX = body.x + body.width / 2;
      const bCenterY = body.y + body.height / 2;

      let closestPt = points[0];
      let minDist = Infinity;
      points.forEach((pt) => {
        const d = Math.hypot(bCenterX - pt.x, bCenterY - pt.y);
        if (d < minDist) {
          minDist = d;
          closestPt = pt;
        }
      });

      const dx = bCenterX - closestPt.x;
      const dy = bCenterY - closestPt.y;
      const dist = Math.max(20, Math.hypot(dx, dy));
      const forceMag = Math.min(45, (800 / dist) * 18);

      const angle = Math.atan2(dy, dx);
      body.vx += Math.cos(angle) * forceMag + (Math.random() - 0.5) * 14;
      body.vy += -Math.abs(Math.sin(angle) * forceMag) - (14 + Math.random() * 18);
      body.vAngle += (Math.random() - 0.5) * 0.45;
    });
  }

  private onBodyPointerDown(e: PointerEvent, body: PhysicsBody) {
    if (this.isReverting) return;
    e.preventDefault();
    this.draggedBody = body;
    body.isDragging = true;
    body.isSettled = false;
    body.element.style.cursor = "grabbing";
    this.dragOffset = {
      x: e.clientX - body.x,
      y: e.clientY - body.y,
    };
    this.lastMousePos = { x: e.clientX, y: e.clientY, time: performance.now() };
    this.mouseVelocity = { vx: 0, vy: 0 };
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.draggedBody) return;
    const now = performance.now();
    const dt = Math.max(1, now - this.lastMousePos.time);

    this.mouseVelocity = {
      vx: ((e.clientX - this.lastMousePos.x) / dt) * 16,
      vy: ((e.clientY - this.lastMousePos.y) / dt) * 16,
    };

    this.lastMousePos = { x: e.clientX, y: e.clientY, time: now };

    this.draggedBody.x = e.clientX - this.dragOffset.x;
    this.draggedBody.y = e.clientY - this.dragOffset.y;
    this.draggedBody.vx = 0;
    this.draggedBody.vy = 0;
  };

  private onPointerUp = () => {
    if (!this.draggedBody) return;
    this.draggedBody.isDragging = false;
    this.draggedBody.element.style.cursor = "grab";
    this.draggedBody.vx = Math.max(-35, Math.min(35, this.mouseVelocity.vx));
    this.draggedBody.vy = Math.max(-35, Math.min(35, this.mouseVelocity.vy));
    this.draggedBody.vAngle = (Math.random() - 0.5) * 0.3;
    this.draggedBody = null;
  };

  private tick = () => {
    if (!this.isRunning) return;

    const gravity = 0.78;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      if (b.isDragging) {
        b.element.style.transform = `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0px) rotate(${b.angle.toFixed(3)}rad)`;
        continue;
      }

      if (!b.isSettled) {
        b.vy += gravity;
        b.vx *= 0.992;
        b.vy *= 0.995;
        b.vAngle *= 0.97;

        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.vAngle;

        if (b.x < 0) {
          b.x = 0;
          b.vx = -b.vx * b.restitution;
        } else if (b.x + b.width > screenWidth) {
          b.x = screenWidth - b.width;
          b.vx = -b.vx * b.restitution;
        }

        const floorY = screenHeight - b.height - 4;
        if (b.y >= floorY) {
          b.y = floorY;
          if (Math.abs(b.vy) > 1.5) {
            b.vy = -b.vy * b.restitution;
            b.vx *= 0.85;
          } else {
            b.vy = 0;
            b.vx *= 0.8;
            if (Math.abs(b.vx) < 0.2 && Math.abs(b.vy) < 0.2 && Math.abs(b.vAngle) < 0.02) {
              b.isSettled = true;
            }
          }
        }
      }
    }

    for (let i = 0; i < this.bodies.length; i++) {
      const b1 = this.bodies[i];
      for (let j = i + 1; j < this.bodies.length; j++) {
        const b2 = this.bodies[j];

        if (
          b1.x < b2.x + b2.width &&
          b1.x + b1.width > b2.x &&
          b1.y < b2.y + b2.height &&
          b1.y + b1.height > b2.y
        ) {
          const overlapX = Math.min(b1.x + b1.width - b2.x, b2.x + b2.width - b1.x);
          const overlapY = Math.min(b1.y + b1.height - b2.y, b2.y + b2.height - b1.y);

          if (overlapY < overlapX) {
            const sign = b1.y < b2.y ? -1 : 1;
            const push = overlapY * 0.5;

            if (!b1.isDragging) b1.y += sign * push;
            if (!b2.isDragging) b2.y -= sign * push;

            const avgVy = (b1.vy + b2.vy) * 0.5;
            b1.vy = avgVy * 0.6;
            b2.vy = avgVy * 0.6;
            b1.isSettled = false;
            b2.isSettled = false;
          } else {
            const sign = b1.x < b2.x ? -1 : 1;
            const push = overlapX * 0.5;

            if (!b1.isDragging) b1.x += sign * push;
            if (!b2.isDragging) b2.x -= sign * push;

            const avgVx = (b1.vx + b2.vx) * 0.5;
            b1.vx = avgVx * 0.5;
            b2.vx = -avgVx * 0.5;
            b1.isSettled = false;
            b2.isSettled = false;
          }
        }
      }
    }

    for (let i = 0; i < this.bodies.length; i++) {
      const b = this.bodies[i];
      b.element.style.transform = `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0px) rotate(${b.angle.toFixed(3)}rad)`;
    }

    this.animId = requestAnimationFrame(this.tick);
  };

  public revertAll(onComplete?: () => void) {
    if (this.bodies.length === 0 || this.isReverting) return;
    this.isReverting = true;

    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.isRunning = false;

    const startTime = performance.now();
    const duration = 1200;

    const startStates = this.bodies.map((b) => ({
      body: b,
      startX: b.x,
      startY: b.y,
      startAngle: b.angle,
      targetX: b.origDocX - window.scrollX,
      targetY: b.origDocY - window.scrollY,
    }));

    const animateRevert = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      startStates.forEach(({ body, startX, startY, startAngle, targetX, targetY }) => {
        const curX = startX + (targetX - startX) * ease;
        const curY = startY + (targetY - startY) * ease;
        const curAngle = startAngle * (1 - ease);
        body.element.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0px) rotate(${curAngle.toFixed(3)}rad)`;
        body.element.style.boxShadow = `0 0 ${20 * (1 - ease)}px #00ffff`;
      });

      if (progress < 1) {
        requestAnimationFrame(animateRevert);
      } else {
        this.bodies.forEach((b) => {
          b.originalElement.style.visibility = "";
          b.element.remove();
        });
        this.bodies = [];
        this.isReverting = false;
        if (this.container) {
          this.container.remove();
          this.container = null;
        }
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);
        window.removeEventListener("pointercancel", this.onPointerUp);
        onComplete?.();
      }
    };

    requestAnimationFrame(animateRevert);
  }

  public get isShattered() {
    return this.bodies.length > 0;
  }
}

export const domPhysicsEngine = new DOMPhysicsEngine();
