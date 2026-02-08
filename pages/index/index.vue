<template>
	<view class="game-container">
		<!-- 游戏标题和分数 -->
		<view class="game-header">
			<text class="game-title">贪吃蛇</text>
			<view class="header-right">
				<text class="score">分数: {{ score }}</text>
				<button class="about-btn" @click="showAbout">关于</button>
			</view>
		</view>

		<!-- 游戏画布 -->
		<view class="game-board" ref="gameBoard">
			<!-- 网格背景 -->
			<view class="grid-background"></view>
			
			<!-- 蛇身 -->
			<view 
				v-for="(segment, index) in snake" 
				:key="index" 
				class="snake-segment" 
				:style="{
					left: (segment.x + 0.5) * gridSize + 'rpx',
					top: (segment.y + 0.5) * gridSize + 'rpx',
					background: getSegmentColor(index)
				}"
			></view>

			<!-- 食物 -->
			<view 
				v-if="food" 
				class="food" 
				:style="{
					left: (food.x + 0.5) * gridSize + 'rpx',
					top: (food.y + 0.5) * gridSize + 'rpx'
				}"
			></view>

			<!-- 游戏开始和结束界面 -->
			<view v-if="gameState === 'start'" class="game-start">
				<text class="start-title">贪吃蛇</text>
				<text class="start-subtitle">使用摇杆控制蛇的移动</text>
				<text class="start-subtitle">吃到食物得分，撞到墙壁或自身游戏结束</text>
				<button class="start-btn" @click="startGame">开始游戏</button>
			</view>

			<view v-if="gameState === 'over'" class="game-over">
				<text class="over-title">游戏结束</text>
				<text class="over-score">最终分数: {{ score }}</text>
				<button class="restart-btn" @click="restartGame">重新开始</button>
			</view>
		</view>

		<!-- 摇杆控制 -->
		<view class="joystick-container">
			<view class="joystick-wrapper">
				<view class="joystick-base" ref="joystickBase">
					<view 
						class="joystick-knob" 
						ref="joystickKnob"
						:style="{
							transform: `translate(${joystickPos.x}rpx, ${joystickPos.y}rpx) translate(-50%, -50%)`
						}"
						@touchstart="touchStart"
						@touchmove="touchMove"
						@touchend="touchEnd"
						@touchcancel="touchEnd"
					></view>
				</view>
			</view>
		</view>

		<!-- 关于弹窗 -->
		<view v-if="aboutVisible" class="about-popup" @click="hideAbout">
			<view class="about-content" @click.stop>
				<!-- 装饰图标 -->
				<view class="decoration-top">
					<text class="decoration-icon">🐍</text>
				</view>
				
				<!-- 标题 -->
				<view class="title-container">
					<text class="about-title">🎮 关于贪吃蛇 🎮</text>
					<text class="subtitle">经典重现，童年回忆</text>
				</view>
				
				<!-- 分隔线 -->
				<view class="divider"></view>
				
				<!-- 信息区域 -->
				<view class="about-info">
					<view class="info-item">
						<text class="info-icon">👨‍💻</text>
						<view class="info-text">
							<text class="info-label">✨ 作者</text>
							<text class="info-value">Seaton</text>
						</view>
					</view>
					
					<view class="info-item">
						<text class="info-icon">📦</text>
						<view class="info-text">
							<text class="info-label">🏷️ 版本号</text>
							<text class="info-value">v1.0.0</text>
						</view>
					</view>
					
					<view class="info-item">
						<text class="info-icon">📅</text>
						<view class="info-text">
							<text class="info-label">🗓️ 发布时间</text>
							<text class="info-value">2026年2月</text>
						</view>
					</view>
					
					<view class="info-item">
						<text class="info-icon">🎯</text>
						<view class="info-text">
							<text class="info-label">📖 游戏说明</text>
							<text class="info-desc">🐍 使用摇杆控制蛇的移动方向\n🍎 吃到食物可以得分\n⚠️ 撞到墙壁或自身游戏结束\n\n💪 快来挑战最高分吧！</text>
						</view>
					</view>
				</view>
				
				<!-- 底部装饰 -->
				<view class="footer">
					<text class="footer-text">Made with ❤️</text>
				</view>
				
				<!-- 关闭按钮 -->
				<view class="btn-container">
					<button class="close-btn" @click="hideAbout">🚀 开始游戏</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				// 游戏状态: start, playing, over
				gameState: 'start',
				// 分数
				score: 0,
				// 网格大小
				gridSize: 20,
				// 游戏板大小
				boardWidth: 30,
				boardHeight: 40,
				// 蛇的初始位置和方向
				snake: [
					{ x: 5, y: 20 },
					{ x: 4, y: 20 },
					{ x: 3, y: 20 }
				],
				direction: 'right',
				lastDirection: 'right', // 记录上一帧的方向，防止快速反向移动
				// 食物位置
				food: null,
				// 摇杆位置
				joystickPos: { x: 0, y: 0 },
				joystickActive: false,
				// 游戏定时器
				gameTimer: null,
				// 移动速度
				speed: 150,
				// 屏幕尺寸信息
				screenInfo: null,
				// 关于弹窗可见性
				aboutVisible: false
			}
		},
		mounted() {
			// 获取屏幕尺寸信息并缓存
			try {
				this.screenInfo = uni.getSystemInfoSync();
			} catch (error) {
				console.error('获取屏幕信息失败:', error);
				// 使用默认值
				this.screenInfo = {
					windowWidth: 375,
					windowHeight: 667
				};
			}
			// 初始化游戏
			this.initGame();
		},
		destroyed() {
			// 清理游戏循环
			if (this.gameTimer) {
				clearTimeout(this.gameTimer);
			}
		},
		methods: {
			// 初始化游戏
			initGame() {
				// 重置游戏状态
				this.score = 0;
				this.snake = [
					{ x: 5, y: 20 },
					{ x: 4, y: 20 },
					{ x: 3, y: 20 }
				];
				this.direction = 'right';
				this.lastDirection = 'right';
				this.generateFood();
				// 确保游戏状态为开始
				this.gameState = 'start';
			},

			// 开始游戏
			startGame() {
				// 重置游戏状态
				this.score = 0;
				this.snake = [
					{ x: 5, y: 20 },
					{ x: 4, y: 20 },
					{ x: 3, y: 20 }
				];
				this.direction = 'right';
				this.lastDirection = 'right';
				this.generateFood();
				this.gameState = 'playing';
				
				// 清理旧定时器
				if (this.gameTimer) {
					cancelAnimationFrame(this.gameTimer);
				}
				
				// 使用 requestAnimationFrame 实现游戏循环
				this.lastTime = Date.now();
				this.gameLoop();
			},

			// 重新开始游戏
			restartGame() {
				// 重置游戏状态
				this.score = 0;
				this.snake = [
					{ x: 5, y: 20 },
					{ x: 4, y: 20 },
					{ x: 3, y: 20 }
				];
				this.direction = 'right';
				this.lastDirection = 'right';
				this.generateFood();
				this.gameState = 'playing';
				
				// 清理旧定时器
				if (this.gameTimer) {
					clearTimeout(this.gameTimer);
				}
				
				// 使用 setTimeout 实现游戏循环
				this.lastTime = Date.now();
				this.gameLoop();
			},

			// 移动蛇
			moveSnake() {
				if (this.gameState !== 'playing') return;

				// 获取蛇头
				const head = { ...this.snake[0] };

				// 根据方向移动蛇头
				switch (this.direction) {
					case 'up':
						head.y--;
						break;
					case 'down':
						head.y++;
						break;
					case 'left':
						head.x--;
						break;
					case 'right':
						head.x++;
						break;
				}

				// 检查碰撞
				if (this.checkCollision(head)) {
					this.gameOver();
					return;
				}

				// 检查是否吃到食物
				if (this.food && head.x === this.food.x && head.y === this.food.y) {
					// 增加分数
					this.score += 10;
					// 生成新食物
					this.generateFood();
					// 蛇身增长（不删除尾部）
				} else {
					// 移动蛇身（删除尾部，添加新头部）
					this.snake.pop();
				}

				// 添加新头部
				this.snake.unshift(head);

				// 记录当前方向
				this.lastDirection = this.direction;
			},

			// 检查碰撞
			checkCollision(head) {
				// 检查墙壁碰撞
				if (head.x < 0 || head.x >= this.boardWidth || head.y < 0 || head.y >= this.boardHeight) {
					return true;
				}

				// 检查自身碰撞
				for (let i = 1; i < this.snake.length; i++) {
					if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
						return true;
					}
				}

				return false;
			},

			// 生成食物
			generateFood() {
				let newFood;
				let isCollision;

				do {
					isCollision = false;
					// 随机生成食物位置
					newFood = {
						x: Math.floor(Math.random() * this.boardWidth),
						y: Math.floor(Math.random() * this.boardHeight)
					};

					// 检查食物是否与蛇身碰撞
					for (let segment of this.snake) {
						if (newFood.x === segment.x && newFood.y === segment.y) {
							isCollision = true;
							break;
						}
					}
				} while (isCollision);

				this.food = newFood;
			},

			// 游戏结束
			gameOver() {
				this.gameState = 'over';
				if (this.gameTimer) {
					clearTimeout(this.gameTimer);
				}
			},

			// 游戏循环
			gameLoop() {
				if (this.gameState !== 'playing') return;

				const now = Date.now();
				const deltaTime = now - this.lastTime;

				// 控制游戏速度
				if (deltaTime >= this.speed) {
					this.moveSnake();
					this.lastTime = now;
				}

				// 继续游戏循环
				this.gameTimer = setTimeout(() => {
					this.gameLoop();
			 }, 16);
			},

			// 触摸开始
			touchStart(e) {
				this.joystickActive = true;
			},

			// 触摸移动
			touchMove(e) {
				if (!this.joystickActive) return;

				// 检查屏幕信息是否已初始化
				if (!this.screenInfo) {
					console.warn('屏幕信息未初始化');
					return;
				}

				// 获取触摸位置
				const touchX = e.touches[0].clientX;
				const touchY = e.touches[0].clientY;

				// 使用缓存的屏幕尺寸信息
				const windowWidth = this.screenInfo.windowWidth;
				const windowHeight = this.screenInfo.windowHeight;

				// 假设摇杆中心在屏幕底部中央
				const baseCenterX = windowWidth / 2;
				// 计算摇杆中心的Y坐标，考虑到摇杆的大小
				const baseCenterY = windowHeight - 150;

				// 计算相对位置
				const deltaX = touchX - baseCenterX;
				const deltaY = touchY - baseCenterY;

				// 限制摇杆移动范围
				const maxDistance = 112; // 摇杆最大移动距离（扩大1.5倍）
				const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
				const ratio = distance > maxDistance ? maxDistance / distance : 1;

				// 更新摇杆位置
				this.joystickPos = {
					x: deltaX * ratio,
					y: deltaY * ratio
				};

				// 根据摇杆位置确定方向
				let newDirection;
				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					// 水平方向
					if (deltaX > 0) {
						newDirection = 'right';
					} else {
						newDirection = 'left';
					}
				} else {
					// 垂直方向
					if (deltaY > 0) {
						newDirection = 'down';
					} else {
						newDirection = 'up';
					}
				}

				// 防止快速反向移动导致游戏结束
				if (newDirection && newDirection !== this.lastDirection) {
					// 检查是否是反向移动
					const isOpposite = (
						(this.direction === 'up' && newDirection === 'down') ||
						(this.direction === 'down' && newDirection === 'up') ||
						(this.direction === 'left' && newDirection === 'right') ||
						(this.direction === 'right' && newDirection === 'left')
					);

					// 只有不是反向移动时才更新方向
					if (!isOpposite) {
						this.direction = newDirection;
					} else {
						// 如果是反向移动，立即更新lastDirection，防止连续检测
						this.lastDirection = this.direction;
					}
				}
			},

			// 触摸结束
			touchEnd() {
				this.joystickActive = false;
				// 重置摇杆位置
				this.joystickPos = { x: 0, y: 0 };
			},

			// 显示关于弹窗
			showAbout() {
				this.aboutVisible = true;
			},

			// 隐藏关于弹窗
			hideAbout() {
				this.aboutVisible = false;
			},

			// 获取蛇身段的颜色（渐变色）
			getSegmentColor(index) {
				const totalSegments = this.snake.length;
				const ratio = index / totalSegments;
				// 从头部到尾部的渐变色
				if (ratio < 0.3) {
					return '#00FFFF'; // 头部：青色
				} else if (ratio < 0.7) {
					return '#00FF00'; // 中部：绿色
				} else {
					return '#FFFF00'; // 尾部：黄色
				}
			}
		}
	}
</script>

<style>
	/* 全局样式 */
	page {
		background-color: #121212;
		color: #ffffff;
		height: 100%;
	}

	/* 游戏容器 */
	.game-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20rpx;
		height: 100vh;
		box-sizing: border-box;
	}

	/* 游戏标题和分数 */
	.game-header {
		width: 100%;
		max-width: 600rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.game-title {
		font-size: 48rpx;
		font-weight: bold;
		color: #00FFFF;
		text-shadow: 0 0 10rpx #00FFFF;
	}

	.score {
		font-size: 32rpx;
		color: #FFFF00;
		text-shadow: 0 0 5rpx #FFFF00;
	}

	/* 游戏画布 */
	.game-board {
		position: relative;
		width: 600rpx;
		height: 800rpx;
		background-color: #1E1E1E;
		border: 2rpx solid #333333;
		border-radius: 10rpx;
		overflow: hidden;
		box-shadow: 0 0 20rpx rgba(0, 255, 255, 0.3);
	}

	/* 网格背景 */
	.grid-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: 
			linear-gradient(rgba(0, 255, 255, 0.1) 1rpx, transparent 1rpx),
			linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1rpx, transparent 1rpx);
		background-size: 20rpx 20rpx;
		pointer-events: none;
		z-index: 0;
	}

	/* 蛇身 */
	.snake-segment {
		position: absolute;
		width: 18rpx;
		height: 18rpx;
		border-radius: 4rpx;
		box-shadow: 0 0 5rpx currentColor;
		transform: translate(-50%, -50%);
	}

	/* 食物 */
	.food {
		position: absolute;
		width: 16rpx;
		height: 16rpx;
		background-color: #FF00FF;
		border-radius: 50%;
		box-shadow: 0 0 10rpx #FF00FF;
		transform: translate(-50%, -50%);
	}

	/* 游戏开始界面 */
	.game-start {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(18, 18, 18, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.start-title {
		font-size: 64rpx;
		font-weight: bold;
		color: #00FFFF;
		text-shadow: 0 0 15rpx #00FFFF;
		margin-bottom: 40rpx;
	}

	.start-subtitle {
		font-size: 24rpx;
		color: #FFFFFF;
		margin-bottom: 20rpx;
		text-align: center;
		padding: 0 40rpx;
	}

	.start-btn {
		margin-top: 60rpx;
		width: 200rpx;
		height: 80rpx;
		font-size: 32rpx;
		background-color: #00FFFF;
		color: #121212;
		font-weight: bold;
		border-radius: 40rpx;
		box-shadow: 0 0 15rpx #00FFFF;
	}

	/* 游戏结束界面 */
	.game-over {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(18, 18, 18, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.over-title {
		font-size: 64rpx;
		font-weight: bold;
		color: #FF0000;
		text-shadow: 0 0 15rpx #FF0000;
		margin-bottom: 40rpx;
	}

	.over-score {
		font-size: 36rpx;
		color: #FFFF00;
		text-shadow: 0 0 10rpx #FFFF00;
		margin-bottom: 60rpx;
	}

	.restart-btn {
		width: 200rpx;
		height: 80rpx;
		font-size: 32rpx;
		background-color: #00FF00;
		color: #121212;
		font-weight: bold;
		border-radius: 40rpx;
		box-shadow: 0 0 15rpx #00FF00;
	}

	/* 摇杆控制 */
	.joystick-container {
		margin-top: 40rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		padding-bottom: 20rpx;
	}

	.joystick-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.joystick-base {
		position: relative;
		width: 337rpx; /* 扩大1.5倍 */
		height: 337rpx; /* 扩大1.5倍 */
		background-color: rgba(51, 51, 51, 0.5);
		border-radius: 50%;
		border: 2rpx solid #555555;
	}

	.joystick-knob {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 135rpx; /* 扩大1.5倍 */
		height: 135rpx; /* 扩大1.5倍 */
		background-color: #00FFFF;
		border-radius: 50%;
		box-shadow: 0 0 22rpx #00FFFF; /* 阴影也相应扩大 */
	}

	/* 按钮样式 */
	button {
		border: none;
		outline: none;
		cursor: pointer;
	}

	button::after {
		border: none;
	}

	/* 标题栏右侧 */
	.header-right {
		display: flex;
		align-items: center;
		gap: 20rpx;
	}

	/* 关于按钮 */
	.about-btn {
		padding: 10rpx 30rpx;
		background-color: rgba(0, 255, 255, 0.2);
		border: 1rpx solid #00FFFF;
		border-radius: 30rpx;
		color: #00FFFF;
		font-size: 24rpx;
	}

	/* 关于弹窗 */
	.about-popup {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		backdrop-filter: blur(10rpx);
	}

	/* 弹窗内容 */
	.about-content {
		width: 85%;
		max-width: 650rpx;
		background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
		border: 3rpx solid;
		border-image: linear-gradient(45deg, #00FFFF, #FF00FF, #00FFFF) 1;
		border-radius: 30rpx;
		padding: 50rpx 40rpx;
		box-shadow: 
			0 0 40rpx rgba(0, 255, 255, 0.4),
			0 0 80rpx rgba(255, 0, 255, 0.2),
			inset 0 0 30rpx rgba(0, 0, 0, 0.5);
		position: relative;
		overflow: hidden;
	}

	/* 弹窗内容顶部装饰 */
	.about-content::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 5rpx;
		background: linear-gradient(90deg, #00FFFF, #FF00FF, #00FFFF);
	}

	/* 装饰图标 */
	.decoration-top {
		text-align: center;
		margin-bottom: 20rpx;
	}

	.decoration-icon {
		font-size: 80rpx;
		display: inline-block;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-15rpx); }
	}

	/* 标题容器 */
	.title-container {
		text-align: center;
		margin-bottom: 30rpx;
	}

	/* 弹窗标题 */
	.about-title {
		display: block;
		font-size: 52rpx;
		font-weight: 900;
		background: linear-gradient(90deg, #00FFFF, #00FF00, #FFFF00);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-shadow: none;
		margin-bottom: 15rpx;
		letter-spacing: 4rpx;
	}

	/* 副标题 */
	.subtitle {
		display: block;
		font-size: 26rpx;
		color: #888888;
		font-style: italic;
		letter-spacing: 2rpx;
	}

	/* 分隔线 */
	.divider {
		height: 2rpx;
		background: linear-gradient(90deg, transparent, #00FFFF, transparent);
		margin: 30rpx 0;
		position: relative;
	}

	.divider::before {
		content: '⭐';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		font-size: 24rpx;
		background: #1a1a2e;
		padding: 0 15rpx;
	}

	/* 信息区域 */
	.about-info {
		margin-bottom: 35rpx;
	}

	/* 信息项 */
	.info-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 25rpx;
		padding: 15rpx;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 15rpx;
		transition: all 0.3s ease;
	}

	.info-item:hover {
		background: rgba(0, 255, 255, 0.1);
		transform: translateX(10rpx);
	}

	/* 信息图标 */
	.info-icon {
		font-size: 40rpx;
		margin-right: 20rpx;
		flex-shrink: 0;
	}

	/* 信息文本容器 */
	.info-text {
		flex: 1;
	}

	/* 信息标签 */
	.info-label {
		display: block;
		font-size: 24rpx;
		color: #888888;
		margin-bottom: 8rpx;
		font-weight: 600;
	}

	/* 信息值 */
	.info-value {
		display: block;
		font-size: 32rpx;
		color: #00FF00;
		font-weight: bold;
		text-shadow: 0 0 10rpx rgba(0, 255, 0, 0.5);
	}

	/* 描述文字 */
	.info-desc {
		display: block;
		font-size: 26rpx;
		color: #CCCCCC;
		line-height: 2;
		white-space: pre-line;
	}

	/* 底部装饰 */
	.footer {
		text-align: center;
		margin-bottom: 25rpx;
		padding-top: 20rpx;
		border-top: 1rpx solid rgba(255, 255, 255, 0.1);
	}

	.footer-text {
		font-size: 24rpx;
		color: #666666;
		letter-spacing: 3rpx;
	}

	/* 按钮容器 */
	.btn-container {
		margin-top: 20rpx;
	}

	/* 关闭按钮 */
	.close-btn {
		width: 100%;
		padding: 25rpx 40rpx;
		background: linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.3));
		border: 2rpx solid #00FFFF;
		border-radius: 50rpx;
		color: #FFFFFF;
		font-size: 34rpx;
		font-weight: bold;
		letter-spacing: 4rpx;
		box-shadow: 
			0 0 20rpx rgba(0, 255, 255, 0.4),
			inset 0 0 20rpx rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
	}

	.close-btn:active {
		transform: scale(0.95);
		box-shadow: 
			0 0 10rpx rgba(0, 255, 255, 0.6),
			inset 0 0 30rpx rgba(0, 0, 0, 0.3);
	}
</style>
