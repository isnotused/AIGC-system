// ==================== Initialize AOS ====================
AOS.init({
  duration: 800,
  once: true,
  offset: 100
});

// ==================== Navbar Scroll Effect ====================
window.addEventListener('scroll', function() {
  const navbar = document.getElementById('mainNav');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ==================== Page Navigation ====================
function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  const activeLink = document.querySelector(`.nav-link[href="#${pageId}"]`);
  if (activeLink) activeLink.classList.add('active');
}

// Wire nav links to page switching
document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const pageId = this.getAttribute('href').slice(1);
    showPage(pageId);
    // Close mobile nav if open
    const navCollapse = document.getElementById('navbarNav');
    if (navCollapse && navCollapse.classList.contains('show')) {
      navCollapse.classList.remove('show');
    }
  });
});

// ==================== File Drag and Drop ====================
const dropZone = document.getElementById('fileDropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('dropFileList');
const dropStatus = document.getElementById('dropStatus');
let uploadedFiles = [];

function setStatus(msg, cls) {
  dropStatus.textContent = msg;
  dropStatus.className = 'drop-status' + (cls ? ' ' + cls : '');
}

function renderFileList() {
  fileList.innerHTML = '';
  uploadedFiles.forEach((file, idx) => {
    const item = document.createElement('div');
    item.className = 'drop-file-item';
    item.innerHTML = `<i class="fa-solid fa-file-lines"></i>${file.name} <span class="remove-file" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></span>`;
    fileList.appendChild(item);
  });
  fileList.querySelectorAll('.remove-file').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      uploadedFiles.splice(parseInt(this.dataset.idx), 1);
      renderFileList();
    });
  });
}

// 解析 CSV 文本为对象数组
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] || '');
    return obj;
  });
}

// 把任意数据规整成系统所需的验证条目
function normalizeRecord(raw, idx) {
  const get = (...keys) => {
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== '') return raw[k];
    }
    return '';
  };
  const content = String(get('content', '素材内容', 'text', '内容', 'title') || `导入条目 #${idx + 1}`);
  const type = String(get('type', '类型', '素材类型') || '新闻文本');
  let sim = parseFloat(get('similarity', '相似度', 'score'));
  if (isNaN(sim)) sim = 0.75 + Math.random() * 0.25;
  if (sim > 1) sim = sim / 100;
  const facts = String(get('facts', '事实要素', 'meta') || "{'来源': '导入数据'}");
  const status = String(get('status', '验证状态', '状态') || (sim >= 0.8 ? '通过' : '有冲突但保留'));
  return { content, type, similarity: sim, facts, status };
}

function ingestParsed(records, fileName) {
  if (!Array.isArray(records) || records.length === 0) {
    setStatus(`${fileName}：未解析到有效数据`, 'error');
    return 0;
  }
  const normalized = records.map(normalizeRecord);
  // 注入到全局表格数据
  if (typeof verificationData !== 'undefined') {
    verificationData.unshift(...normalized);
    if (typeof renderTable === 'function') renderTable(verificationData);
  }
  return normalized.length;
}

function readAndProcessFile(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const name = file.name.toLowerCase();
      let records = [];
      try {
        if (name.endsWith('.json')) {
          const json = JSON.parse(text);
          records = Array.isArray(json) ? json : (json.data || json.items || json.records || [json]);
        } else if (name.endsWith('.csv')) {
          records = parseCSV(text);
        } else {
          // TXT：每行一条新闻文本
          records = text.split(/\r?\n/).filter(l => l.trim()).map(line => ({ content: line, type: '新闻文本' }));
        }
      } catch (err) {
        setStatus(`${file.name} 解析失败：${err.message}`, 'error');
        resolve(0);
        return;
      }
      resolve(ingestParsed(records, file.name));
    };
    reader.onerror = () => { setStatus(`${file.name} 读取失败`, 'error'); resolve(0); };
    reader.readAsText(file, 'utf-8');
  });
}

async function handleIncomingFiles(files) {
  const arr = Array.from(files);
  if (arr.length === 0) return;
  setStatus(`正在解析 ${arr.length} 个文件...`);
  let total = 0;
  for (const file of arr) {
    if (!uploadedFiles.find(f => f.name === file.name && f.size === file.size)) {
      uploadedFiles.push(file);
    }
    total += await readAndProcessFile(file);
  }
  renderFileList();
  if (total > 0) {
    setStatus(`成功导入 ${total} 条数据，已加入"事实验证"表格`, 'success');
    // 自动跳到验证页便于查看
    setTimeout(() => {
      if (typeof showPage === 'function') showPage('verification');
    }, 800);
  }
}

dropZone.addEventListener('dragover', function(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', function(e) {
  e.preventDefault();
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', function(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('dragover');
  handleIncomingFiles(e.dataTransfer.files);
});

dropZone.addEventListener('click', function(e) {
  if (e.target.closest('.remove-file') || e.target.classList.contains('drop-browse')) return;
  fileInput.click();
});

fileInput.addEventListener('change', function() {
  handleIncomingFiles(this.files);
  this.value = '';
});

// 阻止整页面默认拖放（避免浏览器打开文件）
['dragover', 'drop'].forEach(ev => {
  window.addEventListener(ev, e => { if (!e.target.closest('#fileDropZone')) e.preventDefault(); });
});

// ==================== Chart Configuration ====================
Chart.defaults.font.family = "'Noto Sans SC', sans-serif";
Chart.defaults.color = '#6b7280';
Chart.defaults.borderColor = '#e5e7eb';

// Gradients for charts
function createGradient(ctx, colorStart, colorEnd) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
}

// ==================== Entity Type Distribution Chart ====================
const entityCtx = document.getElementById('entityChart').getContext('2d');
const entityGradient = createGradient(entityCtx, '#667eea', '#764ba2');

new Chart(entityCtx, {
  type: 'doughnut',
  data: {
    labels: ['组织机构', '地理位置', '时间', '事件术语'],
    datasets: [{
      data: [31, 20, 25, 24],
      backgroundColor: [
        'rgba(102, 126, 234, 0.9)',
        'rgba(240, 147, 251, 0.9)',
        'rgba(79, 172, 254, 0.9)',
        'rgba(67, 233, 123, 0.9)'
      ],
      borderColor: [
        '#667eea',
        '#f093fb',
        '#4facfe',
        '#43e97b'
      ],
      borderWidth: 3,
      hoverOffset: 15,
      hoverBorderColor: '#fff',
      hoverBorderWidth: 4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 13,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 27, 75, 0.95)',
        titleFont: {
          size: 14,
          weight: '700'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart'
    }
  }
});

// ==================== Material Type Distribution Chart ====================
const materialCtx = document.getElementById('materialChart').getContext('2d');
const materialGradient = createGradient(materialCtx, '#f093fb', '#f5576c');

new Chart(materialCtx, {
  type: 'doughnut',
  data: {
    labels: ['新闻文本', '统计数据', '知识条目'],
    datasets: [{
      data: [67, 24, 9],
      backgroundColor: [
        'rgba(102, 126, 234, 0.9)',
        'rgba(240, 147, 251, 0.9)',
        'rgba(79, 172, 254, 0.9)'
      ],
      borderColor: [
        '#667eea',
        '#f093fb',
        '#4facfe'
      ],
      borderWidth: 3,
      hoverOffset: 15,
      hoverBorderColor: '#fff',
      hoverBorderWidth: 4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 13,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 27, 75, 0.95)',
        titleFont: {
          size: 14,
          weight: '700'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart'
    }
  }
});

// ==================== Similarity Distribution Chart ====================
const similarityCtx = document.getElementById('similarityChart').getContext('2d');
const similarityGradient = createGradient(similarityCtx, '#4facfe', '#00f2fe');

new Chart(similarityCtx, {
  type: 'bar',
  data: {
    labels: ['0.75-0.80', '0.80-0.85', '0.85-0.90', '0.90-0.95', '0.95-1.00'],
    datasets: [{
      label: '素材数量',
      data: [6, 9, 5, 9, 16],
      backgroundColor: [
        'rgba(240, 147, 251, 0.8)',
        'rgba(250, 112, 154, 0.8)',
        'rgba(79, 172, 254, 0.8)',
        'rgba(67, 233, 123, 0.8)',
        'rgba(102, 126, 234, 0.8)'
      ],
      borderColor: [
        '#f093fb',
        '#fa709a',
        '#4facfe',
        '#43e97b',
        '#667eea'
      ],
      borderWidth: 2,
      borderRadius: 8,
      hoverBackgroundColor: [
        'rgba(240, 147, 251, 1)',
        'rgba(250, 112, 154, 1)',
        'rgba(79, 172, 254, 1)',
        'rgba(67, 233, 123, 1)',
        'rgba(102, 126, 234, 1)'
      ]
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(30, 27, 75, 0.95)',
        titleFont: {
          size: 14,
          weight: '700'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: function(context) {
            return `相似度: ${context[0].label}`;
          },
          label: function(context) {
            return `素材数量: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    }
  }
});

// ==================== Verification Results Chart ====================
const verificationCtx = document.getElementById('verificationChart').getContext('2d');
const verificationGradient = createGradient(verificationCtx, '#43e97b', '#38f9d7');

new Chart(verificationCtx, {
  type: 'pie',
  data: {
    labels: ['验证通过', '有冲突但保留'],
    datasets: [{
      data: [38, 7],
      backgroundColor: [
        'rgba(67, 233, 123, 0.9)',
        'rgba(245, 158, 11, 0.9)'
      ],
      borderColor: [
        '#43e97b',
        '#f59e0b'
      ],
      borderWidth: 3,
      hoverOffset: 15,
      hoverBorderColor: '#fff',
      hoverBorderWidth: 4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 13,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 27, 75, 0.95)',
        titleFont: {
          size: 14,
          weight: '700'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutQuart'
    }
  }
});

// ==================== Data Trend Chart ====================
const trendCtx = document.getElementById('trendChart').getContext('2d');
const trendGradient = trendCtx.createLinearGradient(0, 0, 0, 300);
trendGradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
trendGradient.addColorStop(1, 'rgba(102, 126, 234, 0)');

new Chart(trendCtx, {
  type: 'line',
  data: {
    labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
    datasets: [{
      label: '素材处理量',
      data: [120, 190, 150, 250, 220, 310],
      borderColor: '#667eea',
      backgroundColor: trendGradient,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#667eea',
      pointBorderColor: '#fff',
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: '#764ba2',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 3
    }, {
      label: '验证通过数',
      data: [100, 165, 130, 220, 195, 275],
      borderColor: '#43e97b',
      backgroundColor: 'rgba(67, 233, 123, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#43e97b',
      pointBorderColor: '#fff',
      pointBorderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: '#38f9d7',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 3
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 13,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 27, 75, 0.95)',
        titleFont: {
          size: 14,
          weight: '700'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    }
  }
});

// ==================== Module Performance Chart ====================
const performanceCtx = document.getElementById('performanceChart').getContext('2d');
const performanceGradient = createGradient(performanceCtx, '#f093fb', '#f5576c');

new Chart(performanceCtx, {
  type: 'bar',
  data: {
    labels: ['实体识别', '素材匹配', '事实验证', '稿件生成'],
    datasets: [{
      label: '平均耗时 (ms)',
      data: [125, 280, 195, 85],
      backgroundColor: [
        'rgba(102, 126, 234, 0.8)',
        'rgba(240, 147, 251, 0.8)',
        'rgba(79, 172, 254, 0.8)',
        'rgba(67, 233, 123, 0.8)'
      ],
      borderColor: [
        '#667eea',
        '#f093fb',
        '#4facfe',
        '#43e97b'
      ],
      borderWidth: 2,
      borderRadius: 8,
      barPercentage: 0.6,
      hoverBackgroundColor: [
        'rgba(102, 126, 234, 1)',
        'rgba(240, 147, 251, 1)',
        'rgba(79, 172, 254, 1)',
        'rgba(67, 233, 123, 1)'
      ]
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(30, 27, 75, 0.95)',
        titleFont: {
          size: 14,
          weight: '700'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `平均耗时: ${context.raw}ms`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          callback: function(value) {
            return value + 'ms';
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 13,
            weight: '500'
          }
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    }
  }
});

// ==================== Verification Table ====================
const verificationData = [
  { content: "可再生能源政策落地实施一周年，取得显著成效与社会反响", type: "新闻文本", similarity: 0.8719, facts: "{'动作': '召开', '数量': '878亿元'}", status: "通过" },
  { content: "深度解读可再生能源政策核心内容，全面覆盖政策要点与实施路径", type: "新闻文本", similarity: 0.9539, facts: "{'动作': '召开', '数量': '637亿元'}", status: "通过" },
  { content: "市发改委正式发布，引发行业广泛关注，相关部门表示将全力推进落实", type: "新闻文本", similarity: 0.8266, facts: "{'动作': '启动', '数量': '630亿元'}", status: "通过" },
  { content: "新能源政策正式发布，引发行业广泛关注，相关部门表示将全力推进落实", type: "新闻文本", similarity: 0.8853, facts: "{'动作': '启动', '数量': '54亿元'}", status: "通过" },
  { content: "关于新能源规划的最新进展，权威数据显示整体效果超出预期", type: "新闻文本", similarity: 0.7723, facts: "{'动作': '发布', '数量': '416亿元'}", status: "通过" },
  { content: "可再生能源政策专题会议顺利召开，多方代表共同探讨未来发展方向", type: "新闻文本", similarity: 0.9575, facts: "{'动作': '启动', '数量': '213亿元'}", status: "通过" },
  { content: "新能源政策专题会议顺利召开，多方代表共同探讨未来发展方向", type: "新闻文本", similarity: 0.8722, facts: "{'动作': '完成', '数量': '322亿元'}", status: "通过" },
  { content: "北京市专题会议顺利召开，多方代表共同探讨未来发展方向", type: "新闻文本", similarity: 0.9523, facts: "{'地点': '杭州市', '动作': '召开', '数量': '395亿元'}", status: "通过" },
  { content: "新能源政策覆盖人群：713万人", type: "统计数据", similarity: 0.9395, facts: "{'动作': '实施', '数量': '946亿元'}", status: "通过" },
  { content: "市发改委经济效益：3083亿元", type: "统计数据", similarity: 0.8944, facts: "{'动作': '召开', '数量': '145亿元'}", status: "通过" },
  { content: "新能源政策增长率：22.72%", type: "统计数据", similarity: 0.805, facts: "{'动作': '启动', '数量': '27亿元'}", status: "通过" },
  { content: "上半年增长率：11.52%", type: "统计数据", similarity: 0.9795, facts: "{'时间': '全年', '动作': '完成', '数量': '75亿元'}", status: "有冲突但保留" },
  { content: "新能源规划覆盖人群：352万人", type: "统计数据", similarity: 0.8134, facts: "{'动作': '启动', '数量': '508亿元'}", status: "通过" },
  { content: "新能源政策经济效益：2644亿元", type: "统计数据", similarity: 0.7841, facts: "{'动作': '启动', '数量': '755亿元'}", status: "通过" },
  { content: "新能源政策投资额：372亿元", type: "统计数据", similarity: 0.827, facts: "{'动作': '发布', '数量': '212亿元'}", status: "通过" },
  { content: "上半年投资额：527亿元", type: "统计数据", similarity: 0.932, facts: "{'时间': '全年', '动作': '实施', '数量': '190亿元'}", status: "通过" },
  { content: "新能源政策投资额：537亿元", type: "统计数据", similarity: 0.8041, facts: "{'动作': '召开', '数量': '865亿元'}", status: "通过" },
  { content: "上半年覆盖人群：385万人", type: "统计数据", similarity: 0.817, facts: "{'时间': '全年', '动作': '启动', '数量': '229亿元'}", status: "通过" },
  { content: "新能源政策增长率：23.28%", type: "统计数据", similarity: 0.8434, facts: "{'动作': '完成', '数量': '777亿元'}", status: "有冲突但保留" },
  { content: "绿色能源方案增长率：8.41%", type: "统计数据", similarity: 0.9729, facts: "{'动作': '实施', '数量': '906亿元'}", status: "有冲突但保留" },
  { content: "新能源政策经济效益：1754亿元", type: "统计数据", similarity: 0.9027, facts: "{'动作': '召开', '数量': '48亿元'}", status: "通过" },
  { content: "(工信局, 负责, 可再生能源政策)", type: "知识条目", similarity: 0.9764, facts: "{'动作': '实施', '数量': '414亿元'}", status: "有冲突但保留" },
  { content: "(市发改委, 实施, 新能源规划)", type: "知识条目", similarity: 0.9779, facts: "{'动作': '实施', '数量': '252亿元'}", status: "有冲突但保留" },
  { content: "(科技厅, 实施, 新能源规划)", type: "知识条目", similarity: 0.8152, facts: "{'动作': '启动', '数量': '971亿元'}", status: "通过" },
  { content: "(省统计局, 发布, 上半年)", type: "知识条目", similarity: 0.9487, facts: "{'时间': '2024年', '动作': '召开', '数量': '884亿元'}", status: "通过" },
  { content: "(工信局, 负责, 新能源规划)", type: "知识条目", similarity: 0.7585, facts: "{'动作': '召开', '数量': '679亿元'}", status: "通过" },
  { content: "(市发改委, 发布, 北京市)", type: "知识条目", similarity: 0.7717, facts: "{'地点': '北京市', '动作': '发布', '数量': '905亿元'}", status: "有冲突但保留" },
  { content: "(国家能源局, 制定, 绿色能源方案)", type: "知识条目", similarity: 0.8419, facts: "{'动作': '完成', '数量': '835亿元'}", status: "有冲突但保留" },
  { content: "(工信局, 启动, 上半年)", type: "知识条目", similarity: 0.8198, facts: "{'时间': '第一季度', '动作': '完成', '数量': '859亿元'}", status: "通过" },
  { content: "(省统计局, 制定, 可再生能源政策)", type: "知识条目", similarity: 0.9178, facts: "{'动作': '发布', '数量': '901亿元'}", status: "通过" },
  { content: "(工信局, 制定, 上半年)", type: "知识条目", similarity: 0.8053, facts: "{'时间': '上半年', '动作': '完成', '数量': '877亿元'}", status: "有冲突但保留" },
  { content: "(省统计局, 负责, 上半年)", type: "知识条目", similarity: 0.8536, facts: "{'时间': '第一季度', '动作': '启动', '数量': '797亿元'}", status: "通过" },
  { content: "(省统计局, 发布, 市发改委)", type: "知识条目", similarity: 0.8564, facts: "{'动作': '实施', '数量': '951亿元'}", status: "有冲突但保留" },
  { content: "(国家能源局, 实施, 新能源规划)", type: "知识条目", similarity: 0.8324, facts: "{'动作': '发布', '数量': '627亿元'}", status: "有冲突但保留" },
  { content: "(工信局, 制定, 绿色能源方案)", type: "知识条目", similarity: 0.8585, facts: "{'动作': '召开', '数量': '381亿元'}", status: "有冲突但保留" },
  { content: "(工信局, 启动, 可再生能源政策)", type: "知识条目", similarity: 0.905, facts: "{'动作': '完成', '数量': '210亿元'}", status: "通过" },
  { content: "(工信局, 发布, 可再生能源政策)", type: "知识条目", similarity: 0.9108, facts: "{'动作': '完成', '数量': '699亿元'}", status: "通过" },
  { content: "(市发改委, 实施, 北京市)", type: "知识条目", similarity: 0.9628, facts: "{'地点': '广州市', '动作': '实施', '数量': '574亿元'}", status: "通过" },
  { content: "(市发改委, 负责, 上半年)", type: "知识条目", similarity: 0.9755, facts: "{'时间': '全年', '动作': '发布', '数量': '791亿元'}", status: "通过" },
  { content: "(国家能源局, 实施, 市发改委)", type: "知识条目", similarity: 0.7663, facts: "{'动作': '发布', '数量': '15亿元'}", status: "通过" }
];

function renderTable(data) {
  const tableBody = document.getElementById('verificationTable');
  tableBody.innerHTML = '';

  data.forEach((item, index) => {
    const row = document.createElement('tr');
    row.style.animationDelay = `${index * 50}ms`;
    row.className = 'table-animate';

    const content = item.content.length > 40 ? item.content.substring(0, 40) + '...' : item.content;
    const similarityPercent = (item.similarity * 100).toFixed(1);
    const statusClass = item.status === '通过' ? 'badge-verified' : 'badge-warning';
    const facts = item.facts.length > 30 ? item.facts.substring(0, 30) + '...' : item.facts;

    row.innerHTML = `
      <td title="${item.content}">${content}</td>
      <td><span class="data-label">${item.type}</span></td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="progress" style="width: 80px; height: 6px; background: #e5e7eb; border-radius: 3px;">
            <div class="progress-bar" style="width: ${similarityPercent}%; background: ${item.similarity >= 0.9 ? '#43e97b' : item.similarity >= 0.8 ? '#4facfe' : '#f093fb'}; border-radius: 3px;"></div>
          </div>
          <span>${similarityPercent}%</span>
        </div>
      </td>
      <td title="${item.facts}">${facts}</td>
      <td><span class="${statusClass}">${item.status}</span></td>
    `;

    tableBody.appendChild(row);
  });
}

// Initial render
renderTable(verificationData);

// Filter functionality
document.getElementById('filterType').addEventListener('change', function() {
  filterTable();
});

document.getElementById('filterStatus').addEventListener('change', function() {
  filterTable();
});

function filterTable() {
  const typeFilter = document.getElementById('filterType').value;
  const statusFilter = document.getElementById('filterStatus').value;

  let filteredData = verificationData;

  if (typeFilter !== 'all') {
    filteredData = filteredData.filter(item => item.type === typeFilter);
  }

  if (statusFilter !== 'all') {
    filteredData = filteredData.filter(item => item.status === statusFilter);
  }

  renderTable(filteredData);
}

// ==================== Counter Animation ====================
function animateCounter(element, target, duration) {
  let start = 0;
  const increment = target / (duration / 16);

  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

// Intersection Observer for counter animation
const observerOptions = {
  threshold: 0.5
};

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counter = entry.target;
      const target = parseInt(counter.textContent);
      animateCounter(counter, target, 2000);
      counterObserver.unobserve(counter);
    }
  });
}, observerOptions);

// Observe all stat numbers
document.querySelectorAll('.stat-number, .stat-info h3').forEach(counter => {
  counterObserver.observe(counter);
});

// ==================== Loading Complete ====================
window.addEventListener('load', function() {
  // Hide preloader if exists
  const preloader = document.getElementById('js-preloader');
  if (preloader) {
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  }
});

console.log('AIGC News System initialized successfully!');