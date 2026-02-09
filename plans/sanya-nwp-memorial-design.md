# 🏝️ 三亚纪念版 - 设计方案
## Sanya Memorial Edition - Design Proposal

---

## 一、主题概述

### 主题名称
- **主标题**: 「天涯·弈魂」
- **副标题**: 三亚纪念版
- **英文**: "Edge of World, Soul of Go - Sanya Memorial Edition"
- **版本代号**: 2026春节

### 设计理念
> "棋道如海，天涯为证；聂公遗风，薪火相传"

以三亚热带海岛风光为基调，融合聂卫平棋圣的传奇精神，打造一款兼具文化底蕴与海岛风情的特别版围棋应用。

---

## 二、色彩方案 🌈

### 主色调体系

```css
:root {
  /* 🏝️ 海岛风情 - 主色系 */
  --sanya-coral: #FF6B6B;        /* 珊瑚红 - 点缀色 */
  --sanya-ocean: #4ECDC4;         /* 热带海蓝 - 强调色 */
  --sanya-sunset: #FFE66D;        /* 落日金 - 荣耀色 */
  --sanya-sand: #F7DC6F;         /* 沙滩金 - 辅助色 */
  
  /* 🌴 椰风海韵 - 渐变色 */
  --gradient-sunset: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%);
  --gradient-ocean: linear-gradient(180deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%);
  --gradient-sand: linear-gradient(45deg, #F7DC6F 0%, #FDEBD0 100%);
  
  /* ✨ 聂卫平精神色 */
  --nwp-gold: #FFD700;            /* 金色 - 棋圣荣耀 */
  --nwp-red: #C0392B;             /* 丹砂红 - 中国红 */
  --nwp-jade: #27AE60;            /* 翡翠绿 - 椰树青 */
}
```

### 棋盘配色增强
```css
/* 纪念版棋盘 */
--board-memorial: #E8D5A3;        /* 暖色榧木 */
--board-memorial-glow: rgba(255, 215, 0, 0.15);  /* 金色光晕 */

--white-stone-memorial: #F8F8FF;  /* 象牙白 */
--black-stone-memorial: #1C1C1C;  /* 墨黑 */
```

---

## 三、视觉元素设计 🎨

### 3.1 Logo与图标

#### 主Logo设计
```
┌─────────────────────────────────────────┐
│                                         │
│     🏝️ 🌴                                │
│        ♔                                │
│    天  涯  弈  魂                          │
│                                         │
│    同弈 · 三亚聂卫平纪念版                  │
│                                         │
└─────────────────────────────────────────┘
```

**设计说明**:
- 棋子化作三亚地标「鹿回头」剪影
- 椰树环绕棋盘
- 天际线融入棋子落下轨迹
- 整体呈圆形徽章设计

#### 图标变体
| 场景 | 图标设计 |
|------|----------|
| 应用图标 | 金色棋子 + 椰叶环 |
| 执黑 | 黑子 + 凤凰木 |
| 执白 | 白子 + 天涯石 |
| 胜利 | 金色皇冠 + 海浪 |

### 3.2 背景设计

#### 主界面背景
```css
.home-background {
  background: 
    radial-gradient(ellipse at 20% 80%, rgba(78, 205, 196, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(255, 230, 109, 0.08) 0%, transparent 70%),
    var(--bg-primary);
  position: relative;
}

/* 装饰性海浪线条 */
.home-background::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: url('../image/wave-decoration.svg') repeat-x bottom;
  opacity: 0.3;
}
```

#### 棋盘区域背景
```css
.board-background {
  background: 
    radial-gradient(circle at center, 
      rgba(255, 215, 0, 0.05) 0%,
      transparent 70%);
  backdrop-filter: blur(5px);
}
```

### 3.3 粒子特效

#### 海岛氛围粒子
```javascript
// 粒子效果配置
const particleConfig = {
  type: 'butterfly', // 蝴蝶/椰叶
  colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#F7DC6F'],
  count: 15,
  animation: 'float',
  opacity: 0.6
};
```

---

## 四、UI组件设计 🎮

### 4.1 标题设计

```css
.game-title-memorial {
  font-family: 'STKaiti', 'KaiTi', serif; /* 楷体 */
  font-size: 3.8rem;
  font-weight: 700;
  background: var(--gradient-sunset);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 
    0 0 30px rgba(255, 107, 107, 0.3),
    0 0 60px rgba(255, 230, 109, 0.2);
  letter-spacing: 8px;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
}
```

### 4.2 按钮样式

#### 主按钮（聂卫平金）
```css
.btn-memorial-primary {
  background: var(--gradient-sunset);
  border: none;
  color: #1A1A2E;
  font-weight: 700;
  padding: 18px 35px;
  border-radius: 30px;
  box-shadow: 
    0 4px 15px rgba(255, 107, 107, 0.4),
    0 0 30px rgba(255, 230, 109, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-memorial-primary::before {
  content: '✦';
  position: absolute;
  left: 15px;
  opacity: 0.6;
}

.btn-memorial-primary::after {
  content: '✦';
  position: absolute;
  right: 15px;
  opacity: 0.6;
}

.btn-memorial-primary:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 6px 25px rgba(255, 107, 107, 0.5),
    0 0 50px rgba(255, 230, 109, 0.3);
}
```

#### 次按钮（海岛蓝）
```css
.btn-memorial-secondary {
  background: rgba(78, 205, 196, 0.15);
  border: 2px solid var(--sanya-ocean);
  color: var(--sanya-ocean);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.btn-memorial-secondary:hover {
  background: var(--sanya-ocean);
  color: #1A1A2E;
  box-shadow: 0 0 20px rgba(78, 205, 196, 0.4);
}
```

### 4.3 卡片设计

#### 玩家卡片
```css
.player-card-memorial {
  background: linear-gradient(135deg, 
    rgba(255, 107, 107, 0.1) 0%,
    rgba(78, 205, 196, 0.1) 100%);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 15px;
  padding: 15px;
  backdrop-filter: blur(10px);
}

.player-card-memorial.active {
  border-color: var(--nwp-gold);
  box-shadow: 
    0 0 20px rgba(255, 215, 0, 0.2),
    inset 0 0 20px rgba(255, 215, 0, 0.05);
}
```

### 4.4 计时器样式

```css
.timer-display-memorial {
  background: linear-gradient(180deg,
    rgba(26, 26, 46, 0.9) 0%,
    rgba(15, 52, 96, 0.9) 100%);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  font-family: 'Courier New', monospace;
}

.timer-main-memorial {
  font-size: 1.6rem;
  font-weight: 700;
  background: var(--gradient-sunset);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 五、特别功能设计 🌟

### 5.1 启动画面

```
╔═══════════════════════════════════════════╗
║                                           ║
║         🏝️ 三亚 · 天涯海角 🏝️               ║
║                                           ║
║    ╔═══════════════════════════════╗       ║
║    ║                               ║       ║
║    ║      ♔ 聂卫平 ♕               ║       ║
║    ║                               ║       ║
║    ║   "棋圣遗风 · 薪火相传"          ║       ║
║    ║                               ║       ║
║    ╚═══════════════════════════════╝       ║
║                                           ║
║      同弈 · 三亚聂卫平纪念版                ║
║      Sanya Nie Weiping Memorial           ║
║                                           ║
║         🏖️ 设计：步紧 (Bujin)               ║
║                                           ║
╚═══════════════════════════════════════════╝
```

### 5.2 落子特效

#### 金色落子（纪念版专属）
```javascript
const memorialStoneEffect = {
  placement: {
    black: {
      gradient: 'radial-gradient(circle at 30% 30%, #555, #1a1a1a)',
      glow: 'rgba(255, 215, 0, 0.3)',
      particle: 'gold-sparkle'
    },
    white: {
      gradient: 'radial-gradient(circle at 30% 30%, #fff, #e8e8e8)',
      glow: 'rgba(78, 205, 196, 0.3)',
      particle: 'ocean-bubble'
    }
  },
  animation: {
    scale: [0, 1.1, 1],
    opacity: [0, 1],
    duration: 300
  }
};
```

### 5.3 胜利画面

```
╔═══════════════════════════════════════════╗
║                                           ║
║         🏆 胜  利  🏆                      ║
║                                           ║
║         ♔  ♕  ♔  ♕                       ║
║                                           ║
║    "天  涯  论  剑 · 弈  魂 永  存"        ║
║                                           ║
║         🏝️ 三亚纪念版 🏝️                    ║
║                                           ║
╚═══════════════════════════════════════════╝
```

### 5.4 彩蛋功能

#### 聂卫平语录轮播
```javascript
const nwpQuotes = [
  "棋道如海，需穷尽一生去探索",
  "胜负乃兵家常事，重要的是棋艺的精进",
  "天涯海角，棋心永在",
  "聂卫平·棋圣语录"
];

// 在启动画面或等待时显示
function showNPWQuote() {
  const quote = nwpQuotes[Math.floor(Math.random() * nwpQuotes.length)];
  // 显示语录动画
}
```

#### 隐藏成就
| 成就名称 | 解锁条件 | 奖励 |
|---------|---------|------|
| 天涯弈魂 | 累计对局100局 | 金色棋子皮肤 |
| 海角论剑 | 连续获胜10局 | 海南椰树背景 |
| 棋圣传承 | 完整学习聂卫平开官 | 纪念版称号 |

---

## 六、版本信息设计 📝

### 6.1 版本号格式
```
主版本.纪念版标识.小版本
示例: 1.1.0-NWP-2024

含义:
- 1: 主版本号
- NWP-2024: 聂卫平纪念版 2024
- 0: 小版本号
```

### 6.2 版权信息
```css
.copyright-memorial {
  font-size: 0.75rem;
  color: rgba(255, 215, 0, 0.6);
  letter-spacing: 2px;
}

.copyright-memorial::before {
  content: '🏝️ ';
}

.copyright-memorial::after {
  content: ' 🏝️';
}
```

---

## 七、设计资源需求 📦

### 7.1 图片资源
- [ ] `logo-memorial.svg` - 主Logo
- [ ] `icon-black-memorial.svg` - 黑子图标
- [ ] `icon-white-memorial.svg` - 白子图标
- [ ] `wave-decoration.svg` - 海浪装饰
- [ ] `butterfly-particle.svg` - 蝴蝶粒子
- [ ] `background-sanya.jpg` - 三亚背景大图（可选）

### 7.2 音效资源（可选）
- [ ] `place-stone-memorial.mp3` - 纪念版落子音效
- [ ] `victory-memorial.mp3` - 胜利音效

### 7.3 字体资源
- 推荐使用系统楷体（STKaiti/KaiTi）
- 备选：思源宋体

---

## 八、实施优先级 🎯

| 优先级 | 功能 | 预计工时 | 复杂度 |
|-------|------|---------|--------|
| P0 | 配色方案更新 | 2h | ⭐ |
| P0 | 标题与Logo设计 | 4h | ⭐⭐ |
| P0 | 背景与装饰元素 | 4h | ⭐⭐ |
| P1 | 按钮组件样式 | 3h | ⭐⭐ |
| P1 | 玩家卡片样式 | 2h | ⭐ |
| P1 | 计时器样式 | 2h | ⭐ |
| P2 | 落子特效 | 6h | ⭐⭐⭐ |
| P2 | 胜利画面 | 4h | ⭐⭐ |
| P2 | 启动画面 | 3h | ⭐⭐ |
| P3 | 语录彩蛋 | 4h | ⭐⭐ |
| P3 | 隐藏成就 | 8h | ⭐⭐⭐ |

---

## 九、确认清单 ✅

**✅ 用户已确认的设计方向：**

| 类别 | 选择 | 优先级 |
|------|------|--------|
| 整体风格 | 🌴 **热带海岛风** | P0 |
| 色彩倾向 | 🌅 **暖色调（日落金为主）** | P0 |
| 特殊功能 | 🔥🔥🔥 **全都要** | P0 |

### 完整功能清单
- [x] 🔥 落子特效（金色闪光+海浪）
- [x] 🎵 背景音乐（海岛风情BGM）
- [x] 📖 聂卫平语录（启动画面轮播）
- [x] 🏆 成就系统（天涯弈魂等）
- [x] 🖼️ 动态背景（粒子+波浪）

### 用户额外需求
> 待补充...

---

**设计师**: 步紧 (Bujin)
**创建日期**: 2024年
**版本**: v1.0
