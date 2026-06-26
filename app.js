const state = { episodes: [] };

const $ = (selector) => document.querySelector(selector);

function formatDate(dateString) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${dateString}T08:00:00+08:00`)).replaceAll("/", ".");
}

function renderMarket(items, updatedAt) {
  $("#market-time").textContent = updatedAt;
  $("#market-ticker").innerHTML = items.map((item) => `
    <div class="ticker-item">
      <small>${item.name}</small>
      <strong>${item.value}<em class="${item.direction === "up" ? "up" : ""}">${item.change}</em></strong>
    </div>
  `).join("");
}

function renderStories(stories) {
  $("#story-grid").innerHTML = stories.map((story) => `
    <article class="story-card">
      <span class="story-tag">${story.category}</span>
      <h3>${story.title}</h3>
      <p>${story.summary}</p>
      <a class="story-source" href="${story.sourceUrl}" target="_blank" rel="noreferrer">
        <span>${story.source}</span><span>阅读来源 ↗</span>
      </a>
    </article>
  `).join("");
}

function renderEpisode(episode) {
  $("#issue-number").textContent = `${episode.label} · ${episode.number}`;
  $("#episode-date").textContent = formatDate(episode.date);
  $("#episode-title").textContent = episode.title;
  $("#episode-deck").textContent = episode.deck;
  $("#episode-duration").textContent = episode.duration;
  const player = $("#audio-player");
  if (episode.audioUrl) {
    player.hidden = false;
    player.style.display = "";
    player.src = episode.audioUrl;
  } else {
    player.hidden = true;
    player.style.display = "none";
    player.pause();
    player.removeAttribute("src");
    player.load();
  }

  const transcriptSection = $("#transcript-section");
  const transcript = $("#episode-transcript");
  if (episode.transcript) {
    transcriptSection.hidden = false;
    transcript.innerHTML = episode.transcript.split("\n\n").map((paragraph) => `<p>${paragraph}</p>`).join("");
  } else {
    transcriptSection.hidden = true;
    transcript.innerHTML = "";
  }

  renderMarket(episode.market.items, episode.market.updatedAt);
  renderStories(episode.stories);

  $("#deep-dive-title").textContent = episode.deepDive.title;
  $("#deep-dive-lead").textContent = episode.deepDive.lead;
  $("#impact-list").innerHTML = episode.deepDive.impacts.map((impact) => `
    <div class="impact-item"><strong>${impact.title}</strong><p>${impact.text}</p></div>
  `).join("");

  $("#watchlist").innerHTML = episode.watchlist.map((item, index) => `
    <li><span class="watch-number">0${index + 1}</span><strong>${item.title}</strong><time>${item.time}</time></li>
  `).join("");
}

function renderArchive(episodes) {
  $("#archive-list").innerHTML = episodes.map((episode) => `
    <a class="archive-item" href="${episode.audioUrl || "#today"}">
      <time>${formatDate(episode.date)}</time>
      <strong>${episode.title}</strong>
      <span>${episode.audioUrl ? "↗" : "读"}</span>
    </a>
  `).join("");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

async function shareCurrentEpisode() {
  const episode = state.episodes[0];
  const payload = { title: `全球商业早咖啡｜${episode.title}`, text: episode.deck, url: window.location.href };
  if (navigator.share) {
    try { await navigator.share(payload); } catch (error) { if (error.name !== "AbortError") showToast("暂时无法分享"); }
  } else {
    await navigator.clipboard.writeText(window.location.href);
    showToast("网页链接已复制");
  }
}

async function init() {
  try {
    const response = await fetch("data/episodes.json", { cache: "no-store" });
    if (!response.ok) throw new Error("节目数据加载失败");
    const data = await response.json();
    state.episodes = data.episodes;
    renderEpisode(data.episodes[0]);
    renderArchive(data.episodes);
  } catch (error) {
    $("#episode-title").textContent = "今日节目正在路上";
    $("#episode-deck").textContent = "请稍后刷新页面。";
  }
}

$("#share-button").addEventListener("click", shareCurrentEpisode);
$("#current-year").textContent = new Date().getFullYear();
init();
