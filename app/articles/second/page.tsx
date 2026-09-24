"use client";

import Link from "next/link";
import DynamicUniverseBackground from "@/components/space/DynamicUniverseBackground";


const TITLE = "root手机的混沌之路";
const DATE = "2026-09-24";


export default function SecondArticle() {
  return (
    <div className="nova-page">
      <DynamicUniverseBackground />
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .nova-page {
            position: relative;
            min-height: 100vh;
            background: #000000;
            color: #ffffff;
            font-family: "Maple Mono NL", ui-monospace, SFMono-Regular, Menlo, monospace;
            font-weight: 500;
          }
          .nova-bar {
            position: sticky;
            top: 0;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.14);
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(6px);
            font-size: 0.75rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }
          .nova-bar a {
            color: #ffffff;
            text-decoration: none;
          }
          .nova-bar a:hover {
            text-decoration: underline;
          }
          .nova-bar-dim {
            color: rgba(255, 255, 255, 0.45);
          }
          .nova-shell {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 760px;
            margin: 0 auto;
            padding: 96px 24px 120px;
          }
          .nova-meta {
            margin: 0 0 28px 0;
            font-size: 0.75rem;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.45);
          }
          .nova-title {
            margin: 0 0 28px 0;
            font-size: 2.5rem;
            font-weight: 500;
            line-height: 1.25;
            letter-spacing: -0.01em;
          }
          .nova-rule {
            margin: 0 0 40px 0;
            border: 0;
            border-top: 1px solid rgba(255, 255, 255, 0.14);
          }
          .nova-body {
            min-height: 150vh;
            font-size: 0.95rem;
            line-height: 2;
            color: rgba(255, 255, 255, 0.85);
          }
          .nova-body p {
            margin: 0 0 1.5em 0;
          }
          .nova-body a {
            color: #ffffff;
            text-decoration: underline;
          }
          .nova-pending {
            color: rgba(255, 255, 255, 0.3);
          }
          .nova-foot {
            margin: 0;
            font-size: 0.8rem;
          }
          .nova-foot a {
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
          }
          .nova-foot a:hover {
            color: #ffffff;
            text-decoration: underline;
          }
          @media (max-width: 640px) {
            .nova-shell {
              padding: 64px 20px 96px;
            }
            .nova-title {
              font-size: 1.85rem;
            }
          }
        `,
        }}
      />

      <header className="nova-bar">
        <Link href="/">pppopipupu</Link>
        <span className="nova-bar-dim">Article / 置顶</span>
      </header>

      <main className="nova-shell">
        <p className="nova-meta">{DATE} · PINNED</p>

        <h1 className="nova-title">{TITLE}</h1>

        <hr className="nova-rule" />


        <article className="nova-body">
          <p className="nova-pending">博客第一篇正经的文章，由pppopipupu™匠心打造，但因为我的作文水平过于垃圾，请见谅，而且如果你是专业机佬可能会发现我的正文很大一部分都是bullshit，一些技术细节可能也有问题（比如实际上一加ColorOS16均没有修复GhostLock等），总之此文章with ABSOLUTELY NO WARRANTY, to the extent permitted by law</p>
            <br/>
            <p>我的老手机是一个华为nova se，联发科上古SoC，一个羸弱的残废，以至于打开任何基于chromium内核的国产套壳app都会卡顿5~秒，这让我的QOL下降了一个档次（根据本人估计至少91%）。<br/>然后死冯华为还往手机内安插诸如”系统管家“，“快应用”这种广告遥测应用，进一步让我的手机变的几乎不可用，华为的老harmonyOS还对adb大幅削弱，以至于碰不了系统应用一点，disable都没权限；这时我感到一阵虚无，唉，跟了我5年的牢手机，到头来却是一个没用的板砖，连app的data/data都进不去，而华为从物理意义上解BL就是不可能的，只能将就着用</p>
            <br/>
            <p>但就在某一天，我起床，发现新快递到了，拆开发现是一台新手机。<br/>我妈都看不下去我的旧废物手机了，给我买了个新手机，我欣喜若狂。<br/>看到背面的型号是一加Turbo 6，我更是直接高潮了，在我的印象中，一加是最好解锁BL的手机牌子，而且SoC也不差，8sgen4，我便开始幻想我解了BL，统治手机，用内存修改器和root termux篡改老游戏和手机的快感</p>
            <br/>
            <p>但在我满怀期待的打开手机的时候，进入我眼帘的却是国产安卓系统那般景象，预装几十个傻逼app，连锁屏都有广告，差点气得我直接从楼上跳下来释放龙吼幻化然后释放阳炎爆将楼下邻居停在车位上的汽车全部炸飞。<br/>然后在我冷静下来后连上电脑装好安卓驱动准备给这个手机进行一个彻头彻尾的血腥大屠杀，首当其冲的就是那个乐划锁屏，最开始就想将它碎尸万段，但在我满怀愤怒的敲下adb uninstall时，系统拒绝，pm disable，还是他妈的拒绝，pm disable-user，还是他妈的拒绝，这个手机好像把adb shell降级成二等公民都不如的废物一样，碰都碰不了这些应用的一根毫毛，以至于用adb安装应用都会跳出那个深度扫描界面</p>
            <br/>
            <p>这更坚定了我一定要root权限的决心，但当我在b站搜索一加手机解BL时，心立即凉了半截，原来一加被绿厂收购后，也开始学习绿厂搞深度测试，卡注册时间，还要审核，我四处寻找绕过审核解BL的办法，但是无果，现在手机都有TEE和硬件安全证明，没有oppo的地主服务器内部绝密的RSA4096私钥签发的unlock.bin，连碰BL的一丢丢可能性都没有。<br/>但我并没有被这一点点阻碍打倒，正路不通我就走歪路，这几个月安卓不是一堆提权CVE吗，我要exploit，我要夺回我的所属之物！</p>
            <br/>
            <p>这时一个叫ghostlock的漏洞（CVE-2026-43499）引起了我的兴趣，我操，这就是我要的漏洞，GitHub上还有现成的PoC可以用（JoinChang/ghostlock-oneplus），虽然没有直接对我手机可用的机型，只需要根据自己的内核dump出panic栈算一下偏移量patch boot.img就能直接飞升，拿到持久化root shell，下崽出KernelSU Live进程，成为手机的爹！</p>
            <br/>
            <p>但就在我手舞足蹈，使用danbooru+gelbooru对枕头释放超能光束，准备召唤IDA ROMCloud vmlinux-to-elf爆改手机的时候，突然手机的OTA弹出了一条消息，要升级到ColorOS 16.0.9，重启就生效。<br/>然后我直接眩晕瘫坐，尿都给我吓出来两滴；我操，这意味着什么，这意味着新系统镜像可能已经写入到Slot B，还安置了夜间自动重启，我的手机随时可能升级，而升级了就意味着GhostLock可能会失效，我就会被关进一辈子监牢，永世只配使用破板砖。</p>
            <br/>
            <p>我赶忙进入设置把一切可能自动更新的东西全部关闭，然后调OTA API发现已经安排了凌晨1点，虽然已经关闭了自动更新但是我那个生物本能，还处于战斗与逃跑状态，我绝对不能放松，于是立即启动omp，配上反代codebuddy获取的免费愚蠢模型，开始YOLO mode，连接adb，准备狂暴exploit的时候，发现畜生deepseek v4.1flash不小心搞错fastboot驱动了，我手机重启了！<br/>但没有进fastboot，进了安卓系统。<br/>我心想“完了，完几把蛋了，我的春秋美梦破灭了，我要滚回监牢了，系统升级了，CVE没了，我一定要用最一针见血，最不绕弯子，最残酷，最痛苦，最悔恨，最粗俗，最疯狂甚至能让反代网关当场炸裂，腾讯风控拉响，社会信用分掉到负数的语气辱骂deepseek”。<br/>但就在这时现实给了我一个既甜又痛又带恩赐的耳光，手机系统根本没更新，我他妈一直在自己瞎意淫制造一个危机感，能带来吊桥效应的场景，能让我觉得不在2小时内利用成功我的手机就会变成破板砖的危机场景。<br/>就连deepseek自己的CoT里也先是害怕没驱动重启搞砸了，然后检查一下发现刚才我输的提示词都是胡扯蛋，我也把我在TUI里输入到一半的侮辱文字全部删除，开始放空大脑，立地成佛，与世无争，海阔天空，开始积攒修为</p>
            <br/>
            <p>然后我躺在床上看见带有污渍，刚刚被玷污过的枕头，又看到deepseek正在疯狂蹂躏我的手机，kernel panic重启了至少不下几十次，我感到一阵虚无，新买的手机，本应是我的应许之物，现在却被一个人机和厂商和GitHub上的随机PoC玩弄，我又看到CoT里闪过的点滴，发现我刚才的假设，假设系统升级漏洞会失效，假设OTA会静默更新，假设没有root就干不死广告应用，全都是我的臆想。<br/>我就像一个可悲又无能又自大的父亲，陷入了深深的虚无主义。<br/>我在床上睡着了，梦见去了天堂，然后很快一种未知的力量又唤醒了我，Agent跑完了，脚本写好了，KernelSU开起来了，OTA和系统内置应用都被抹除了。<br/>我兴奋又恐慌的打开了手机，又望向电脑，发现deepseek写的破脚本成功率只有50%，50%！！！<br/>每次开机50%概率生起root shell，50%直接自爆再次重启，我又眩晕瘫坐，屎都被吓出来了。<br/>手机的闪存一定经不得这般折腾。<br/>我小心翼翼地查看了一下root，尝试用ReSukiSU持久化，但是我又陷入了虚无，我现在手机正处于一个不稳定的亚稳态，一旦我手贱改动只读分区的一个字节，手机就会原地爆炸变砖，没有解BL我也刷不了系统，我看着被蹂躏过的手机，又看着随时可能爆炸，每次重启都靠摇奖的root shellk，和ResukiSU的icon上的明风杂鱼表情包，这恐怕就是终结了...</p>
            <br/>
            <p>不，这不是终结，我秉着争取了不一定有，不争取一定没有的信念下载了官方解BL申请App深度测试，就算那个app前端上写的什么注册账号90天，绑定手机号实名认证我一个条件都不符合，但是管他呢，说不定通过了呢？<br/>我看了眼钟表，已经2：30分了，便躺上床直接睡觉</p>
            <br/>
            <p>第二天早上我拿起手机，随机打开深度测试，看到画面之后宛如晴天霹雳，我操，竟然申请通过了，不到一天！<br/>我屁资格都不符合！<br/>我直接原地起飞，一脚把门踹碎，三个后空翻跳下楼释放下劈连招，精准击败在楼下盘旋的无上辐光，随后摆出散打起手式，对垃圾桶释放刺拳-刺拳-后直拳循环直到垃圾桶损坏，再对地面释放巧克力海啸把我蹦回我的房间。<br/>我心想这一定是oppo服务器炸裂了，或者是我没更新系统的功劳，fallback到了旧的深度测试审核条件，我直接连接电脑，进入fastboot模式，愤怒输入fastboot oem unlock，弹出Google的恐吓界面，大胆点击Yes，手机原地重启进入orange state并猎杀data文件夹，持久化patch内核，安装ResukiSU。<br/>这时看见ResukiSU的明风杂鱼表情包我的心境完全变了，这不是指我，这是指这台手机，已经是我的所有物了，笑得我直接进入pixiv，收藏几个明风铯图，并立即下载termux并赐予root权限，再安装sudo包，键入sudo ps aux，看着我手机里的子民们，哎呀，真是件美事啊...</p>
            <br/>
            <p>至于那个PoC和脚本我直接永久archive，打入冷宫，享受着原生root的特权，就算colorOS OTA 10^10^10次我也只要刷一下内核就好了，这，就算baklava的真谛，我再测试了一下指纹支付，竟然完好无损，还不用指纹模块，我感觉我受到了老天爷雷劈般的幸运，至于之前的那些琐事和意淫？<br/>全部丢进垃圾桶。</p>
            <br/>
            <big><big><p>后日谈</p></big></big>
          <br/>
          <p>在此之后，我装了个内存修改器，全局字体替换模块，ReZygisk和KernelPatchNext，就结束了折腾之旅，至于刷入Fedora和Arch配Hyprland或者KDE mobile还是什么小众合成器？<br/>等到手机EOL再说吧，至少目前而言驱动不支持，刷上相机NFC SoC调度估计全炸，被root精简过的colorOS也不是不能用。<br/>我在F-Droid上装了个打砖块游戏，我的旧华为nova也永远进入了长眠...（或许可以跑点轻量级服务？也说不定）</p>
        </article>

        <p className="nova-foot">
          <Link href="/">[ 返回主页 ]</Link>
        </p>
      </main>
    </div>
  );
}
