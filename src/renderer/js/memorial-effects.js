/**
 * 🏝️ 三亚聂卫平纪念版特效模块
 * Sanya Nie Weiping Memorial Edition Effects
 * 
 * 功能：
 * - 粒子系统（海岛风情）
 * - 落子特效
 * - 胜利动画
 * - 聂卫平语录轮播
 * - 成就系统
 */

class MemorialEffects {
  constructor() {
    this.container = null;
    this.particles = [];
    this.audioContext = null;
    this.quoteIndex = 0;
    
    // 聂卫平语录
    this.nwpQuotes = [
      "棋道如海，需穷尽一生去探索",
      "胜负乃兵家常事，重要的是棋艺的精进",
      "天涯海角，棋心永在",
      "聂卫平·棋圣语录",
      "布局如战略，中盘如决战，收官如打扫战场",
      "棋盘如人生，每一步都是选择",
      "真正的棋手，永远在追求更高的境界"
    ];
    
    // 粒子颜色
    this.particleColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#F7DC6F', '#FFD700'];
    
    // 成就系统
    this.achievements = {
      'tianya_yihun': {
        name: '天涯弈魂',
        description: '累计对局100局',
        reward: '金色棋子皮肤',
        unlocked: false,
        progress: 0,
        target: 100
      },
      'haijiao_lunjian': {
        name: '海角论剑',
        description: '连续获胜10局',
        reward: '海南椰树背景',
        unlocked: false,
        progress: 0,
        target: 10
      },
      'qi_sheng_chuancheng': {
        name: '棋圣传承',
        description: '完整学习聂卫平开官',
        reward: '纪念版称号',
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
        reward: '🌴 椰树头像框',
        unlocked: false,
        progress: 0,
        target: 10
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
    // 创建背景粒子
    this.createBackgroundParticles();
    
    // 启动粒子动画循环
    this.animateParticles();
  }
  
  /**
   * 创建背景粒子
   */
  createBackgroundParticles() {
    const colors = this.particleColors;
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'bg-particle';
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        opacity: ${Math.random() * 0.5 + 0.2};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float ${Math.random() * 4 + 4}s ease-in-out infinite;
        animation-delay: ${Math.random() * 4}s;
        pointer-events: none;
      `;
      this.container.appendChild(particle);
      this.particles.push(particle);
    }
  }
  
  /**
   * 粒子动画循环
   */
  animateParticles() {
    const animate = () => {
      this.particles.forEach((particle, index) => {
        // 轻微移动效果
        const currentTransform = particle.style.transform || 'translate(0, 0)';
        const newTransform = currentTransform.replace(/translate\([^)]+\)/, '');
        
        if (Math.random() > 0.98) {
          particle.style.left = `${Math.random() * 100}%`;
          particle.style.top = `${Math.random() * 100}%`;
        }
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * 落子特效
   * @param {Object} position - 落子位置 {x, y}
   * @param {string} color - 棋子颜色 'black' | 'white'
   */
  showPlaceStoneEffect(position, color) {
    const effect = document.createElement('div');
    effect.className = 'stone-effect';
    
    const colorConfig = color === 'black' 
      ? { glow: 'rgba(255, 215, 0, 0.5)', particle: '#FFD700' }
      : { glow: 'rgba(78, 205, 196, 0.5)', particle: '#4ECDC4' };
    
    effect.style.cssText = `
      position: absolute;
      left: ${position.x}px;
      top: ${position.y}px;
      width: 50px;
      height: 50px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(circle, ${colorConfig.glow} 0%, transparent 70%);
      animation: stone-place 0.5s ease-out forwards;
      pointer-events: none;
      z-index: 1000;
    `;
    
    document.body.appendChild(effect);
    
    // 创建粒子爆发效果
    this.createParticleBurst(position, colorConfig.particle);
    
    // 动画结束后移除
    setTimeout(() => {
      effect.remove();
    }, 500);
  }
  
  /**
   * 粒子爆发效果
   */
  createParticleBurst(position, color) {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 360;
      const particle = document.createElement('div');
      particle.className = 'burst-particle';
      particle.style.cssText = `
        position: absolute;
        left: ${position.x}px;
        top: ${position.y}px;
        width: 6px;
        height: 6px;
        background: ${color};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: particle-burst 0.6s ease-out forwards;
        --angle: ${angle}deg;
        --distance: ${Math.random() * 40 + 30}px;
        pointer-events: none;
        z-index: 1001;
      `;
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 600);
    }
  }
  
  /**
   * 胜利特效
   */
  showVictoryEffect() {
    // 创建烟花效果
    this.createFireworks();
    
    // 显示胜利面板
    this.showVictoryPanel();
  }
  
  /**
   * 创建烟花
   */
  createFireworks() {
    const colors = this.particleColors;
    
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1;
        const y = Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.1;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        this.createFirework(x, y, color);
      }, i * 300);
    }
  }
  
  /**
   * 创建单个烟花
   */
  createFirework(x, y, color) {
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 360;
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 8px;
        height: 8px;
        background: ${color};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: firework-particle 1s ease-out forwards;
        --start-x: ${x}px;
        --start-y: ${y}px;
        --angle: ${angle}deg;
        --distance: ${Math.random() * 100 + 50}px;
        pointer-events: none;
        z-index: 1002;
      `;
      
      document.body.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 1000);
    }
  }
  
  /**
   * 显示胜利面板
   */
  showVictoryPanel() {
    const panel = document.createElement('div');
    panel.className = 'victory-panel';
    panel.innerHTML = `
      <div class="victory-content">
        <h1 class="victory-title">🏆 胜  🏆</h1>
        <p class="victory-quote">"天  涯  论  剑 · 弈  魂 永  存"</p>
        <p class="victory-edition">🏝️ 三亚聂卫平纪念版 🏝️</p>
      </div>
    `;
    
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(26, 26, 46, 0.95);
      border: 2px solid rgba(255, 215, 0, 0.5);
      border-radius: 20px;
      padding: 40px 60px;
      text-align: center;
      z-index: 10000;
      animation: victory-appear 0.5s ease-out;
    `;
    
    document.body.appendChild(panel);
    
    // 3秒后自动关闭
    setTimeout(() => {
      panel.style.opacity = '0';
      panel.style.transform = 'translate(-50%, -50%) scale(0.8)';
      panel.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        panel.remove();
      }, 300);
    }, 3000);
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
   * 播放落子音效
   */
  playPlaceStoneSound() {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }
  
  /**
   * 播放胜利音效
   */
  playVictorySound() {
    if (!this.audioContext) return;
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.15);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + index * 0.15);
      gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + index * 0.15 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.15 + 0.3);
      
      oscillator.start(this.audioContext.currentTime + index * 0.15);
      oscillator.stop(this.audioContext.currentTime + index * 0.15 + 0.3);
    });
  }
  
  /**
   * 显示聂卫平语录
   * @param {HTMLElement} container - 显示容器
   */
  showNPWQuote(container) {
    if (!container) return;
    
    const quote = document.createElement('div');
    quote.className = 'nwp-quote';
    quote.innerHTML = `
      <p class="quote-text">"${this.nwpQuotes[this.quoteIndex]}"</p>
      <p class="quote-author">— 聂卫平</p>
    `;
    
    quote.style.cssText = `
      background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(78, 205, 196, 0.1));
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 15px;
      padding: 20px 30px;
      margin: 20px 0;
      text-align: center;
      animation: fadeIn 0.5s ease-out;
    `;
    
    container.appendChild(quote);
    
    // 更新索引
    this.quoteIndex = (this.quoteIndex + 1) % this.nwpQuotes.length;
    
    // 5秒后淡出
    setTimeout(() => {
      quote.style.opacity = '0';
      quote.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        quote.remove();
      }, 500);
    }, 5000);
  }
  
  /**
   * 更新成就进度
   * @param {string} achievementId - 成就ID
   * @param {number} increment - 增加进度
   */
  updateAchievement(achievementId, increment = 1) {
    const achievement = this.achievements[achievementId];
    if (!achievement || achievement.unlocked) return;
    
    achievement.progress += increment;
    
    // 检查是否解锁
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
    
    // 显示成就通知
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
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 107, 107, 0.2));
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
  @keyframes stone-place {
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
  
  @keyframes particle-burst {
    0% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--distance) * -0.5));
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--distance) * -1));
      opacity: 0;
    }
  }
  
  @keyframes firework-particle {
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
  
  @keyframes firework-particle {
    0% {
      transform: translate(0, 0) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(calc(cos(var(--angle)) * var(--distance)), calc(sin(var(--angle)) * var(--distance))) scale(0);
      opacity: 0;
    }
  }
`;

document.head.appendChild(style);

// 导出实例
window.memorialEffects = new MemorialEffects();
