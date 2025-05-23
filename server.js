const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// 静态文件中间件
app.use(express.static(path.join(__dirname, 'public')));

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API 路由 - 时间转换功能
app.use(express.json());

// 闰秒列表
const leapSecList = [
  46828800, 78364801, 109900802, 173059203, 252028804, 315187205,
  346723206, 393984007, 425520008, 457056009, 504489610, 551750411,
  599184012, 820108813, 914803214, 1025136015, 1119744016, 1167264017
];

const gpsEpoch = new Date(Date.UTC(1980, 0, 6, 0, 0, 0));
const BEIJING_OFFSET = 8;

// 计算闰秒数量
function countLeap(sec) {
  return leapSecList.filter(v => v <= sec).length;
}

// UTC转北京时间
function utcToBeijing(utcDate) {
  return new Date(utcDate.getTime() + BEIJING_OFFSET * 60 * 60 * 1000);
}

// 北京时间转UTC
function beijingToUTC(beijingDate) {
  return new Date(beijingDate.getTime() - BEIJING_OFFSET * 60 * 60 * 1000);
}

// API: GPS时间转换
app.post('/api/convert/gps', (req, res) => {
  try {
    const { gpsMs } = req.body;
    const gpsSec = gpsMs / 1000;
    const leapCount = countLeap(gpsSec);
    const trueSec = gpsSec - leapCount;
    const utcDate = new Date(gpsEpoch.getTime() + trueSec * 1000);
    const beijingDate = utcToBeijing(utcDate);

    res.json({
      success: true,
      utc: {
        year: utcDate.getUTCFullYear(),
        month: utcDate.getUTCMonth() + 1,
        day: utcDate.getUTCDate(),
        hour: utcDate.getUTCHours(),
        minute: utcDate.getUTCMinutes(),
        second: utcDate.getUTCSeconds(),
        millisecond: utcDate.getUTCMilliseconds()
      },
      beijing: {
        year: beijingDate.getUTCFullYear(),
        month: beijingDate.getUTCMonth() + 1,
        day: beijingDate.getUTCDate(),
        hour: beijingDate.getUTCHours(),
        minute: beijingDate.getUTCMinutes(),
        second: beijingDate.getUTCSeconds(),
        millisecond: beijingDate.getUTCMilliseconds()
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// API: UTC时间转换
app.post('/api/convert/utc', (req, res) => {
  try {
    const { year, month, day, hour, minute, second, millisecond } = req.body;
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
    const secondsSinceEpoch = (utcDate - gpsEpoch) / 1000;
    const leapCount = countLeap(secondsSinceEpoch);
    const gpsMs = Math.round((secondsSinceEpoch + leapCount) * 1000);
    const beijingDate = utcToBeijing(utcDate);

    res.json({
      success: true,
      gpsMs,
      beijing: {
        year: beijingDate.getUTCFullYear(),
        month: beijingDate.getUTCMonth() + 1,
        day: beijingDate.getUTCDate(),
        hour: beijingDate.getUTCHours(),
        minute: beijingDate.getUTCMinutes(),
        second: beijingDate.getUTCSeconds(),
        millisecond: beijingDate.getUTCMilliseconds()
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// API: 北京时间转换
app.post('/api/convert/beijing', (req, res) => {
  try {
    const { year, month, day, hour, minute, second, millisecond } = req.body;
    const beijingDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));
    const utcDate = beijingToUTC(beijingDate);
    const secondsSinceEpoch = (utcDate - gpsEpoch) / 1000;
    const leapCount = countLeap(secondsSinceEpoch);
    const gpsMs = Math.round((secondsSinceEpoch + leapCount) * 1000);

    res.json({
      success: true,
      gpsMs,
      utc: {
        year: utcDate.getUTCFullYear(),
        month: utcDate.getUTCMonth() + 1,
        day: utcDate.getUTCDate(),
        hour: utcDate.getUTCHours(),
        minute: utcDate.getUTCMinutes(),
        second: utcDate.getUTCSeconds(),
        millisecond: utcDate.getUTCMilliseconds()
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 时间转换工具服务器已启动`);
  console.log(`📡 访问地址: http://localhost:${PORT}`);
  console.log(`⏰ GPS/UTC/北京时间转换器已就绪`);
});