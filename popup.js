// 元素引用
const dropZone = document.getElementById('drop-zone');
const placeholder = document.getElementById('placeholder');
const resultBox = document.getElementById('result');
const configBtn = document.getElementById('config-btn');
const pasteView = document.getElementById('paste-view');
const configView = document.getElementById('config-view');

// 切换到配置页
configBtn.addEventListener('click', () => {
  pasteView.style.display = 'none';
  configView.style.display = 'block';

  chrome.storage.local.get(["username", "repo", "branch", "token"], (cfg) => {
    document.getElementById('username').value = cfg.username || '';
    document.getElementById('repo').value = cfg.repo || '';
    document.getElementById('branch').value = cfg.branch || 'master';
    document.getElementById('token').value = cfg.token || '';
  });
});

// 保存配置并返回
document.getElementById('save-config').addEventListener('click', () => {
  const config = {
    username: document.getElementById('username').value,
    repo: document.getElementById('repo').value,
    branch: document.getElementById('branch').value,
    token: document.getElementById('token').value
  };
  chrome.storage.local.set(config, () => {
    configView.style.display = 'none';
    pasteView.style.display = 'block';
  });
});

// 返回不保存
document.getElementById('cancel-config').addEventListener('click', () => {
  configView.style.display = 'none';
  pasteView.style.display = 'block';
});

// 粘贴处理
dropZone.addEventListener('paste', async (event) => {
  const items = event.clipboardData.items;
  for (let item of items) {
    if (item.type.indexOf("image") !== -1) {
      placeholder.style.display = "none";
      const file = item.getAsFile();
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const fileName = `img_${Date.now()}.png`;

      chrome.storage.local.get(["username", "repo", "branch", "token"], async (cfg) => {
        const { username, repo, branch, token } = cfg;
        const path = `images/${fileName}`;
        const url = `https://gitee.com/api/v5/repos/${username}/${repo}/contents/${path}?access_token=${token}`;
        resultBox.textContent = "上传中...";

        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: "上传图片",
              content: base64,
              branch: branch || "master"
            })
          });

          const resJson = await response.json();
          if (response.ok) {
            const rawUrl = `https://gitee.com/${username}/${repo}/raw/${branch}/${path}`;
            resultBox.textContent = "已复制链接：\n" + rawUrl;
            await navigator.clipboard.writeText(rawUrl);
          } else {
            resultBox.textContent = "上传失败: " + JSON.stringify(resJson);
          }
        } catch (e) {
          resultBox.textContent = "上传异常：" + e.message;
        }
      });
    }
  }
});
