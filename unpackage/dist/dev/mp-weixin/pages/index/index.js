"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      // 游戏状态: start, playing, over
      gameState: "start",
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
      direction: "right",
      lastDirection: "right",
      // 记录上一帧的方向，防止快速反向移动
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
      screenInfo: null
    };
  },
  mounted() {
    try {
      this.screenInfo = common_vendor.index.getSystemInfoSync();
    } catch (error) {
      common_vendor.index.__f__("error", "at pages/index/index.vue:108", "获取屏幕信息失败:", error);
      this.screenInfo = {
        windowWidth: 375,
        windowHeight: 667
      };
    }
    this.initGame();
  },
  destroyed() {
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
    }
  },
  methods: {
    // 初始化游戏
    initGame() {
      this.score = 0;
      this.snake = [
        { x: 5, y: 20 },
        { x: 4, y: 20 },
        { x: 3, y: 20 }
      ];
      this.direction = "right";
      this.lastDirection = "right";
      this.generateFood();
      this.gameState = "start";
    },
    // 开始游戏
    startGame() {
      this.score = 0;
      this.snake = [
        { x: 5, y: 20 },
        { x: 4, y: 20 },
        { x: 3, y: 20 }
      ];
      this.direction = "right";
      this.lastDirection = "right";
      this.generateFood();
      this.gameState = "playing";
      if (this.gameTimer) {
        cancelAnimationFrame(this.gameTimer);
      }
      this.lastTime = Date.now();
      this.gameLoop();
    },
    // 重新开始游戏
    restartGame() {
      this.score = 0;
      this.snake = [
        { x: 5, y: 20 },
        { x: 4, y: 20 },
        { x: 3, y: 20 }
      ];
      this.direction = "right";
      this.lastDirection = "right";
      this.generateFood();
      this.gameState = "playing";
      if (this.gameTimer) {
        cancelAnimationFrame(this.gameTimer);
      }
      this.lastTime = Date.now();
      this.gameLoop();
    },
    // 移动蛇
    moveSnake() {
      if (this.gameState !== "playing")
        return;
      const head = { ...this.snake[0] };
      switch (this.direction) {
        case "up":
          head.y--;
          break;
        case "down":
          head.y++;
          break;
        case "left":
          head.x--;
          break;
        case "right":
          head.x++;
          break;
      }
      if (this.checkCollision(head)) {
        this.gameOver();
        return;
      }
      if (this.food && head.x === this.food.x && head.y === this.food.y) {
        this.score += 10;
        this.generateFood();
      } else {
        this.snake.pop();
      }
      this.snake.unshift(head);
      this.lastDirection = this.direction;
    },
    // 检查碰撞
    checkCollision(head) {
      if (head.x < 0 || head.x >= this.boardWidth || head.y < 0 || head.y >= this.boardHeight) {
        return true;
      }
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
        newFood = {
          x: Math.floor(Math.random() * this.boardWidth),
          y: Math.floor(Math.random() * this.boardHeight)
        };
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
      this.gameState = "over";
      if (this.gameTimer) {
        clearTimeout(this.gameTimer);
      }
    },
    // 游戏循环
    gameLoop() {
      if (this.gameState !== "playing")
        return;
      const now = Date.now();
      const deltaTime = now - this.lastTime;
      if (deltaTime >= this.speed) {
        this.moveSnake();
        this.lastTime = now;
      }
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
      if (!this.joystickActive)
        return;
      if (!this.screenInfo) {
        common_vendor.index.__f__("warn", "at pages/index/index.vue:317", "屏幕信息未初始化");
        return;
      }
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const windowWidth = this.screenInfo.windowWidth;
      const windowHeight = this.screenInfo.windowHeight;
      const baseCenterX = windowWidth / 2;
      const baseCenterY = windowHeight - 150;
      const deltaX = touchX - baseCenterX;
      const deltaY = touchY - baseCenterY;
      const maxDistance = 75;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const ratio = distance > maxDistance ? maxDistance / distance : 1;
      this.joystickPos = {
        x: deltaX * ratio,
        y: deltaY * ratio
      };
      let newDirection;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          newDirection = "right";
        } else {
          newDirection = "left";
        }
      } else {
        if (deltaY > 0) {
          newDirection = "down";
        } else {
          newDirection = "up";
        }
      }
      if (newDirection && newDirection !== this.lastDirection) {
        const isOpposite = this.direction === "up" && newDirection === "down" || this.direction === "down" && newDirection === "up" || this.direction === "left" && newDirection === "right" || this.direction === "right" && newDirection === "left";
        if (!isOpposite) {
          this.direction = newDirection;
        } else {
          this.lastDirection = this.direction;
        }
      }
    },
    // 触摸结束
    touchEnd() {
      this.joystickActive = false;
      this.joystickPos = { x: 0, y: 0 };
    },
    // 获取蛇身段的颜色（渐变色）
    getSegmentColor(index) {
      const totalSegments = this.snake.length;
      const ratio = index / totalSegments;
      if (ratio < 0.3) {
        return "#00FFFF";
      } else if (ratio < 0.7) {
        return "#00FF00";
      } else {
        return "#FFFF00";
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.t($data.score),
    b: common_vendor.f($data.snake, (segment, index, i0) => {
      return {
        a: index,
        b: segment.x * $data.gridSize + "rpx",
        c: segment.y * $data.gridSize + "rpx",
        d: $options.getSegmentColor(index)
      };
    }),
    c: $data.food
  }, $data.food ? {
    d: $data.food.x * $data.gridSize + "rpx",
    e: $data.food.y * $data.gridSize + "rpx"
  } : {}, {
    f: $data.gameState === "start"
  }, $data.gameState === "start" ? {
    g: common_vendor.o((...args) => $options.startGame && $options.startGame(...args))
  } : {}, {
    h: $data.gameState === "over"
  }, $data.gameState === "over" ? {
    i: common_vendor.t($data.score),
    j: common_vendor.o((...args) => $options.restartGame && $options.restartGame(...args))
  } : {}, {
    k: `translate(${$data.joystickPos.x}rpx, ${$data.joystickPos.y}rpx) translate(-50%, -50%)`,
    l: common_vendor.o((...args) => $options.touchStart && $options.touchStart(...args)),
    m: common_vendor.o((...args) => $options.touchMove && $options.touchMove(...args)),
    n: common_vendor.o((...args) => $options.touchEnd && $options.touchEnd(...args)),
    o: common_vendor.o((...args) => $options.touchEnd && $options.touchEnd(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
