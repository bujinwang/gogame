/**
 * ✨ 天涯·归魂特效模块
 * Tianya · Returning Soul Effects
 * 
 * 功能：
 * - 粒子系统（魂光星海）
 * - 落子特效
 * - 胜利动画
 * - 归魂语录轮播
 * - 成就系统
 */

class MemorialEffects {
  constructor() {
    this.container = null;
    this.particles = [];
    this.audioContext = null;
    this.quoteIndex = 0;
    
    // ✨ 归魂语录
    this.nwpQuotes = [
      "天涯海角，魂归弈道",
      "棋道如海，需穷尽一生去探索",
      "胜负乃兵家常事，重要的是棋艺的精进",
      "布局如战略，中盘如决战，收官如打扫战场",
      "棋盘如人生，每一步都是选择",
      "真正的棋手，永远在追求更高的境界",
      "归去来兮，棋魂永存",
      "天涯不远，魂兮归来"
    ];
    
    // ✨ 魂光粒子颜色
    this.particleColors = [
      '#ffd700',  // 金光
      '#c0c0c0',  // 银光
      '#00bcd4',  // 幽蓝
      '#4a1942',  // 神秘紫
      '#ffec8b'   // 浅金
    ];
    
    // 成就系统
    this.achievements = {
      'tianya_guihun': {
        name: '天涯归魂',
        description: '累计对局100局',
        reward: '✨ 归魂金光棋子',
        unlocked: false,
        progress: 0,
        target: 100
      },
      'lunjian_chenglong': {
        name: '论剑成龙',
        description: '连续获胜10局',
        reward: '🌌 星河背景',
        unlocked: false,
        progress: 0,
        target: 10
      },
      'qi_sheng_yongheng': {
        name: '棋圣永恒',
        description: '完整学习弈道精髓',
        reward: '🏆 归魂称号',
        unlocked: false,
        progress: 0,
        target: 100
      },
      'first_win': {
        name: '初露锋芒',
        description: '获得首场胜利',
        reward: '🏆 纪念徽章',
        unlocked: false
      },
      'ten_games': {
        name: '棋逢对手',
        description: '完成10局对局',
        reward: '✨ 星光头像框',
        unlocked: false,
        progress: 0,
        target: 10
      },
      'wu_sheng_jueding': {
        name: '无上决定',
        description: '完成50局对局',
        reward: '🌟 银河棋子',
        unlocked: false,
        progress: 0,
        target: 50
      }
    };
  }
  
  /**
   * 初始化特效系统
   */
  init() {
    this.createContainer();
    this.startParticleSystem();
    this.initAudio();
  }
  
  /**
   * 创建粒子容器
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'particle-container';
    this.container.id = 'memorial-particles';
    document.body.appendChild(this.container);
  }
  
  /**
   * 启动粒子系统
   */
  startParticleSystem() {
    this.createBackgroundParticles();
    this.animateParticles();
  }
  
  /**
   * ✨ 创建归魂背景粒子
   */
  createBackgroundParticles() {
    const colors = this.particleColors;
    
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'bg-particle soul-particle';
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 6 + 3}px;
        height: ${Math.random() * 6 + 3}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        opacity: ${Math.random() * 0.6 + 0.2};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        box-shadow: 0 0 10px ${colors[Math.floor(Math.random() * colors.length)]};
        animation: soul-float ${Math.random() * 5 + 5}s ease-in-out infinite;
        animation-delay: ${Math.random() * 5}s;
        pointer-events: none;
      `;
      this.container.appendChild(particle);
      this.particles.push(particle);
    }
    
    for (let i = 0; i < 8; i++) {
      const star = document.createElement('div');
      star.className = 'bg-particle star-particle';
      star.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: #ffd700;
        border-radius: 50%;
        opacity: ${Math.random() * 0.5 + 0.3};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        box-shadow: 0 0 15px #ffd700, 0 0 30px #ffd700;
        animation: star-twinkle ${Math.random() * 3 + 2}s ease-in-out infinite;
        animation-delay: ${Math.random() * 3}s;
        pointer-events: none;
      `;
      this.container.appendChild(star);
      this.particles.push(star);
    }
  }
  
  /**
   * 粒子动画循环
   */
  animateParticles() {
    const animate = () => {
      this.particles.forEach((particle) => {
        if (Math.random() > 0.99) {
          const currentLeft = parseFloat(particle.style.left);
          const currentTop = parseFloat(particle.style.top);
          particle.style.left = `${currentLeft + (Math.random() - 0.5) * 2}%`;
          particle.style.top = `${currentTop + (Math.random() - 0.5) * 2}%`;
        }
      });
      requestAnimationFrame(animate);
    };
    animate();
  }
  
  /**
   * ✨ 落子特效 - 归魂版
   */
  showPlaceStoneEffect(position, color) {
    const effect = document.createElement('div');
    effect.className = 'stone-effect';
    
    const colorConfig = color === 'black' 
      ? { glow: 'rgba(255, 215, 0, 0.6)', particle: '#ffd700', secondary: '#c0c0c0' }
      : { glow: 'rgba(0, 188, 212, 0.6)', particle: '#00bcd4', secondary: '#c0c0c0' };
    
    effect.style.cssText = `
      position: absolute;
      left: ${position.x}px;
      top: ${position.y}px;
      width: 60px;
      height: 60px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(circle, ${colorConfig.glow} 0%, transparent 70%);
      animation: soul-stone-place 0.6s ease-out forwards;
      pointer-events: none;
      z-index: 1000;
    `;
    
    document.body.appendChild(effect);
    this.createSoulParticleBurst(position, colorConfig);
    
    setTimeout(() => {
      effect.remove();
    }, 600);
  }
  
  /**
   * ✨ 魂光粒子爆发
   */
  createSoulParticleBurst(position, colorConfig) {
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 360;
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        left: ${position.x}px;
        top: ${position.y}px;
        width: ${Math.random() * 4 + 4}px;
        height: ${Math.random() * 4 + 4}px;
        background: ${Math.random() > 0.5 ? colorConfig.particle : colorConfig.secondary};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: soul-particle-burst 0.8s ease-out forwards;
        --angle: ${angle}deg;
        --distance: ${Math.random() * 50 + 40}px;
        pointer-events: none;
        z-index: 1001;
        box-shadow: 0 0 10px ${colorConfig.particle};
      `;
      document.body.appendChild(particle);
      setTimeout(() => { particle.remove(); }, 800);
    }
  }
  
  /**
   * ✨ 胜利特效 - 归魂版
   */
  showVictoryEffect() {
    this.createSoulFireworks();
    this.showVictoryPanel();
  }
  
  /**
   * ✨ 创建星河烟花
   */
  createSoulFireworks() {
    const colors = this.particleColors;
    
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth * 0.7 + window.innerWidth * 0.15;
        const y = Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.1;
        const color = colors[Math.floor(Math.random() * colors.length)];
        this.createSoulFirework(x, y, color);
      }, i * 400);
    }
  }
  
  /**
   * ✨ 创建单发星河烟花
   */
  createSoulFirework(x, y, color) {
    const particleCount = 24;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 360;
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 6px;
        height: 6px;
        background: ${color};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: soul-firework 1.2s ease-out forwards;
        --angle: ${angle}deg;
        --distance: ${Math.random() * 120 + 60}px;
        pointer-events: none;
        z-index: 1002;
        box-shadow: 0 0 10px ${color}, 0 0 20px ${color};
      `;
      document.body.appendChild(particle);
      setTimeout(() => { particle.remove(); }, 1200);
    }
  }
  
  /**
   * ✨ 显示胜利面板 - 归魂版
   */
  showVictoryPanel() {
    const panel = document.createElement('div');
    panel.className = 'victory-panel';
    panel.innerHTML = `
      <div class="victory-content">
        <h1 class="victory-title">🏆 胜  🏆</h1>
        <p class="victory-quote">"天  涯  归  魂 · 弈  道  永  恒"</p>
        <p class="victory-edition">✨ 天涯·归魂纪念版 ✨</p>
      </div>
    `;
    
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, rgba(26, 26, 46, 0.98), rgba(74, 25, 66, 0.95));
      border: 2px solid rgba(255, 215, 0, 0.6);
      border-radius: 25px;
      padding: 50px 70px;
      text-align: center;
      z-index: 10000;
      animation: victory-appear 0.6s ease-out;
      box-shadow: 0 0 50px rgba(255, 215, 0, 0.3);
    `;
    
    document.body.appendChild(panel);
    
    setTimeout(() => {
      panel.style.opacity = '0';
      panel.style.transform = 'translate(-50%, -50%) scale(0.8)';
      panel.style.transition = 'all 0.4s ease';
      setTimeout(() => { panel.remove(); }, 400);
    }, 3500);
  }
  
  /**
   * 初始化音频
   */
  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }
  
  /**
   * ✨ 播放落子音效 - 空灵版
   */
  playPlaceStoneSound() {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.005, this.audioContext.currentTime + 0.15);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }
  
  /**
   * ✨ 播放胜利音效 - 辉煌版
   */
  playVictorySound() {
    if (!this.audioContext) return;
    
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    
    notes.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.12);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + index * 0.12);
      gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + index * 0.12 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.005, this.audioContext.currentTime + index * 0.12 + 0.4);
      
      oscillator.start(this.audioContext.currentTime + index * 0.12);
      oscillator.stop(this.audioContext.currentTime + index * 0.12 + 0.4);
    });
  }
  
  /**
   * ✨ 显示归魂语录
   */
  showNPWQuote(container) {
    if (!container) return;
    
    const quote = document.createElement('div');
    quote.className = 'nwp-quote';
    quote.innerHTML = `
      <p class="quote-text">"${this.nwpQuotes[this.quoteIndex]}"</p>
      <p class="quote-author">— 天涯·归魂</p>
    `;
    
    quote.style.cssText = `
      background: linear-gradient(135deg, rgba(74, 25, 66, 0.3), rgba(26, 26, 46, 0.5));
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 15px;
      padding: 25px 35px;
      margin: 20px 0;
      text-align: center;
      animation: fadeIn 0.5s ease-out;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.1);
    `;
    
    container.appendChild(quote);
    this.quoteIndex = (this.quoteIndex + 1) % this.nwpQuotes.length;
    
    setTimeout(() => {
      quote.style.opacity = '0';
      quote.style.transition = 'opacity 0.6s ease';
      setTimeout(() => { quote.remove(); }, 600);
    }, 5500);
  }
  
  /**
   * 更新成就进度
   */
  updateAchievement(achievementId, increment = 1) {
    const achievement = this.achievements[achievementId];
    if (!achievement || achievement.unlocked) return;
    
    achievement.progress += increment;
    
    if (achievement.progress >= achievement.target) {
      this.unlockAchievement(achievementId);
    }
    
    return achievement.progress;
  }
  
  /**
   * 解锁成就
   */
  unlockAchievement(achievementId) {
    const achievement = this.achievements[achievementId];
    if (!achievement || achievement.unlocked) return;
    
    achievement.unlocked = true;
    this.showAchievementNotification(achievement);
  }
  
  /**
   * 显示成就通知
   */
  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-info">
        <p class="achievement-name">${achievement.name}</p>
        <p class="achievement-reward">奖励: ${achievement.reward}</p>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(74, 25, 66, 0.2));
      border: 2px solid rgba(255, 215, 0, 0.5);
      border-radius: 15px;
      padding: 15px 25px;
      display: flex;
      align-items: center;
      gap: 15px;
      animation: slideIn 0.5s ease-out, fadeOut 0.5s ease-out 3s forwards;
      z-index: 10001;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3500);
  }
  
  /**
   * 获取所有成就
   */
  getAchievements() {
    return Object.values(this.achievements);
  }
  
  /**
   * 获取未解锁成就进度
   */
  getAchievementsProgress() {
    return this.achievements;
  }
  
  /**
   * 清理资源
   */
  destroy() {
    if (this.container) {
      this.container.remove();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// 添加CSS动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes soul-stone-place {
    0% {
      transform: translate(-50%, -50%) scale(0);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0.8;
    }
    100% {
      transform: translate(-50%, -50%) scale(2);
      opacity: 0;
    }
  }
  
  @keyframes soul-particle-burst {
    0% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--distance) * -0.3));
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--distance) * -1));
      opacity: 0;
    }
  }
  
  @keyframes soul-firework {
    0% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--distance) * -1));
      opacity: 0;
    }
  }
  
  @keyframes victory-appear {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes slideIn {
    0% {
      transform: translateX(100%);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  
  @keyframes soul-float {
    0%, 100% {
      transform: translateY(0) translateX(0);
      opacity: 0.4;
    }
    25% {
      transform: translateY(-8px) translateX(5px);
      opacity: 0.6;
    }
    50% {
      transform: translateY(-15px) translateX(0);
      opacity: 0.5;
    }
    75% {
      transform: translateY(-8px) translateX(-5px);
      opacity: 0.7;
    }
  }
  
  @keyframes star-twinkle {
    0%, 100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
  }
`;

document.head.appendChild(style);

// 导出实例
window.memorialEffects = new MemorialEffects();
