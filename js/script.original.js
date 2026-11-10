const TALENTS = [
  "Singing", "Acting", "Writing", "Art", "Dancing", "Handicrafts",
  "Public Speaking", "Sports", "Engineering", "Gardening", "Automotive", "Other"
];

// Supabase project already used by the Talent Hunter setup.
const SUPABASE_URL = "https://ullionsrtnnyuseloegn.supabase.co";
const SUPABASE_KEY = "sb_publishable_aHWljokoQGj3jZ3rxutWJA_AEU526tH";

const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);

let supabaseReady = false;
let accountType = "";
let selectedTalent = "";
let photoData = "";
let allTalents = [];
let feedTalents = [];
let currentFeedIndex = 0;
let selectedCategory = "All";

const $ = (id) => document.getElementById(id);

function setCloudStatus(text, state = "neutral") {
  const el = $("cloudStatus");
  if (!el) return;
  el.textContent = text;
  el.dataset.state = state;
}

function showScreen(number) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  const target = $("screen" + number);
  if (target) target.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHome() {
  showScreen(hasSavedAccount() ? 4 : 1);
}

function selectAccount(type) {
  accountType = type;
  $("talentedBtn").classList.toggle("selected", type === "Talented");
  $("hunterBtn").classList.toggle("selected", type === "Hunter");
}

function normalizePhone(value) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  let v = String(value || "").trim();
  v = [...v].map((ch) => {
    let i = arabic.indexOf(ch);
    if (i >= 0) return String(i);
    i = persian.indexOf(ch);
    return i >= 0 ? String(i) : ch;
  }).join("");
  v = v.replace(/[\s().-]/g, "");
  if (v.startsWith("+20")) v = "0" + v.slice(3);
  else if (v.startsWith("20") && v.length === 12) v = "0" + v.slice(2);
  return v;
}

function isValidPhone(value) {
  return /^01[0125]\d{8}$/.test(normalizePhone(value));
}

function saveProfile() {
  localStorage.setItem("accountType", accountType || "");
  localStorage.setItem("userName", $("nameInput").value.trim());
  localStorage.setItem("phone", normalizePhone($("phoneInput").value));
  localStorage.setItem("userPhoto", photoData || "");
}

function hasSavedAccount() {
  return Boolean(
    localStorage.getItem("userName") &&
    localStorage.getItem("accountType") &&
    localStorage.getItem("phone")
  );
}

function restoreSavedAccount() {
  if (!hasSavedAccount()) return false;

  accountType = localStorage.getItem("accountType") || "";
  selectedTalent = localStorage.getItem("selectedTalent") || "";
  photoData = localStorage.getItem("userPhoto") || "";

  $("nameInput").value = localStorage.getItem("userName") || "";
  $("phoneInput").value = localStorage.getItem("phone") || "";
  if (photoData) {
    $("photoPreview").src = photoData;
    $("checkPhoto").src = photoData;
  }
  selectAccount(accountType);
  return true;
}

function goToTalent() {
  const name = $("nameInput").value.trim();
  const rawPhone = $("phoneInput").value.trim();

  $("message1").textContent = "";
  if (!accountType) return $("message1").textContent = "Choose an account type first.";
  if (!name) return $("message1").textContent = "Enter your name.";
  if (!rawPhone) return $("message1").textContent = "Enter your phone number.";
  if (!isValidPhone(rawPhone)) {
    return $("message1").textContent = "Enter a valid Egyptian mobile number, e.g. 01012345678.";
  }

  saveProfile();
  $("phoneInput").value = normalizePhone(rawPhone);
  showScreen(2);
}

const TALENT_ICONS = {
  Singing: "♫", Acting: "◉", Writing: "✎", Art: "◈", Dancing: "✦",
  Handicrafts: "◇", "Public Speaking": "◌", Sports: "◈", Engineering: "⚙",
  Gardening: "❧", Automotive: "⌁", Other: "✧"
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function jsSafe(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function buildTalentButtons() {
  $("talentGrid").innerHTML = TALENTS.map((talent) => `
    <button class="talent-btn ${selectedTalent === talent ? "selected" : ""}"
      type="button" data-talent="${escapeHtml(talent)}"
      onclick="selectTalent('${jsSafe(talent)}')">
      <div class="talent-icon">${TALENT_ICONS[talent] || "✦"}</div>
      <span>${escapeHtml(talent)}</span>
    </button>
  `).join("");

  $("categories").innerHTML = ["All", ...TALENTS].map((talent) => `
    <button type="button" class="category ${talent === selectedCategory ? "active" : ""}"
      onclick="selectCategory('${jsSafe(talent)}', this)">${escapeHtml(talent)}</button>
  `).join("");
}

function selectTalent(talent) {
  selectedTalent = talent;
  localStorage.setItem("selectedTalent", talent);
  document.querySelectorAll(".talent-btn").forEach((button) => {
    button.classList.toggle("selected", button.dataset.talent === talent);
  });
}

function goToCheck() {
  $("message2").textContent = "";
  if (!selectedTalent) return $("message2").textContent = "Choose one talent category first.";

  localStorage.setItem("selectedTalent", selectedTalent);
  $("checkAccount").textContent = accountType || "—";
  $("checkName").textContent = $("nameInput").value.trim() || "—";
  $("checkTalent").textContent = selectedTalent;
  $("checkPhone").textContent = normalizePhone($("phoneInput").value) || "—";
  $("checkPhoto").src = photoData || "assets/logo.png";
  showScreen(3);
}

function confirmData() {
  saveProfile();
  showScreen(4);
}

function shareTalent() {
  $("shareTalentType").textContent = localStorage.getItem("selectedTalent") || selectedTalent || "Other";
  showScreen(5);
}

$("photoInput").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    photoData = String(reader.result || "");
    $("photoPreview").src = photoData;
    $("checkPhoto").src = photoData;
  };
  reader.readAsDataURL(file);
});

$("talentFile").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  const prompt = $("uploadPrompt");
  const image = $("shareImagePreview");
  const video = $("shareVideoPreview");

  image.style.display = "none";
  video.style.display = "none";
  prompt.style.display = "grid";

  if (!file) return;

  const url = URL.createObjectURL(file);
  prompt.style.display = "none";
  if (file.type.startsWith("image/")) {
    image.src = url;
    image.style.display = "block";
  } else if (file.type.startsWith("video/")) {
    video.src = url;
    video.style.display = "block";
  }
});

// ---- SUPABASE ------------------------------------------------------------
async function initCloud() {
  if (!supabaseClient) {
    setCloudStatus("SUPABASE SDK ERROR", "error");
    console.error("[Talent Hunter] Supabase SDK is not loaded.");
    return false;
  }

  setCloudStatus("CONNECTING…", "loading");

  try {
    const { error } = await supabaseClient.from("talents").select("id").limit(1);

    if (error) {
      supabaseReady = false;
      setCloudStatus("SUPABASE ERROR", "error");
      console.error("[Talent Hunter] Supabase connection failed:", error);
      return false;
    }

    supabaseReady = true;
    setCloudStatus("SUPABASE CONNECTED", "connected");
    console.log("[Talent Hunter] Supabase Connected");
    return true;
  } catch (error) {
    supabaseReady = false;
    setCloudStatus("SUPABASE ERROR", "error");
    console.error("[Talent Hunter] Supabase connection exception:", error);
    return false;
  }
}

function setUploadProgress(percent, text = "Uploading…") {
  const box = $("uploadProgress");
  const fill = $("uploadProgressFill");
  const label = $("uploadProgressText");
  const value = $("uploadProgressPercent");
  if (!box || !fill || !label || !value) return;

  box.hidden = false;
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  fill.style.width = `${safePercent}%`;
  value.textContent = `${Math.round(safePercent)}%`;
  label.textContent = text;
}

function resetUploadProgress() {
  const box = $("uploadProgress");
  const fill = $("uploadProgressFill");
  const label = $("uploadProgressText");
  const value = $("uploadProgressPercent");
  if (!box || !fill || !label || !value) return;
  box.hidden = true;
  fill.style.width = "0%";
  label.textContent = "Preparing upload…";
  value.textContent = "0%";
}

function getSupabaseProjectRef() {
  try {
    return new URL(SUPABASE_URL).hostname.split(".")[0];
  } catch {
    return "";
  }
}

async function uploadTalentMedia(file) {
  if (!supabaseClient) throw new Error("Supabase SDK is not loaded.");
  if (typeof tus === "undefined" || !tus.Upload) {
    throw new Error("Resumable upload library failed to load.");
  }

  const safeName = String(file.name || "media").replace(/[^a-zA-Z0-9._-]/g, "_");
  const randomId = typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const objectPath = `talents/${Date.now()}_${randomId}_${safeName}`;
  const projectRef = getSupabaseProjectRef();
  if (!projectRef) throw new Error("Invalid Supabase project URL.");

  let accessToken = SUPABASE_KEY;
  try {
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session?.access_token) accessToken = data.session.access_token;
  } catch (_) {
    // Anonymous/public projects can upload with the publishable key when Storage policies allow it.
  }

  setUploadProgress(0, file.size > 6 * 1024 * 1024 ? "Starting resumable upload…" : "Uploading…");

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_KEY,
        "x-upsert": "true"
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: "talent-media",
        objectName: objectPath,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600"
      },
      onError(error) {
        console.error("[Talent Hunter] TUS upload error:", error);
        reject(error);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percent = bytesTotal ? (bytesUploaded / bytesTotal) * 100 : 0;
        setUploadProgress(percent, percent >= 100 ? "Finalizing upload…" : "Uploading to Supabase…");
      },
      onSuccess() {
        const { data } = supabaseClient.storage.from("talent-media").getPublicUrl(objectPath);
        setUploadProgress(100, "Upload complete. Saving post…");
        resolve({ url: data.publicUrl, path: objectPath });
      }
    });

    upload.findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0]);
        upload.start();
      })
      .catch((error) => reject(error));
  });
}

async function saveTalentToCloud(file, description) {
  if (!supabaseClient) throw new Error("Supabase is not connected.");

  const media = await uploadTalentMedia(file);
  const talentType = localStorage.getItem("selectedTalent") || selectedTalent || "Other";

  const row = {
    name: localStorage.getItem("userName") || "Talent",
    phone: localStorage.getItem("phone") || "",
    category: talentType,
    type: talentType,
    description: description || "",
    file_type: file.type,
    media_url: media.url,
    storage_path: media.path
  };

  // Insert only. Do not chain .select().single() because that also requires
  // a SELECT RLS policy on the new row and can make a successful upload
  // look like a failed publish at 100%.
  const { error } = await supabaseClient.from("talents").insert(row);
  if (error) {
    // The media is already uploaded; try to clean it up if the insert fails.
    await supabaseClient.storage.from("talent-media").remove([media.path]).catch(() => {});
    throw error;
  }
  return row;
}

async function getTalents() {
  if (!supabaseReady) throw new Error("Supabase is not connected.");

  const { data, error } = await supabaseClient
    .from("talents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

let publishInProgress = false;

async function publishTalent() {
  if (publishInProgress) return;

  const file = $("talentFile").files?.[0];
  const description = $("shareDescription").value.trim();

  $("shareMessage").textContent = "";
  if (!file) return $("shareMessage").textContent = "Choose a photo or video first.";
  if (file.size > 50 * 1024 * 1024) return $("shareMessage").textContent = "Please choose a file 50 MB or smaller.";
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return $("shareMessage").textContent = "Please choose an image or video file.";
  }

  publishInProgress = true;
  setUploadProgress(0, "Preparing upload…");
  $("shareMessage").style.color = "";
  $("shareMessage").textContent = file.size > 6 * 1024 * 1024
    ? "Large video detected — using resumable upload."
    : "Uploading to Supabase…";

  try {
    if (!supabaseClient) throw new Error("Supabase connection failed.");
    if (!supabaseReady) initCloud(); // refresh the top status badge only; publishing does not depend on it

    await saveTalentToCloud(file, description);
    setUploadProgress(100, "Published successfully.");
    $("shareMessage").style.color = "var(--green)";
    $("shareMessage").textContent = "Published successfully to Supabase.";

    setTimeout(() => {
      resetShare();
      showScreen(4);
    }, 900);
  } catch (error) {
    console.error("[Talent Hunter] Publish error:", error);
    setUploadProgress(0, "Upload stopped.");
    $("shareMessage").style.color = "#ff9bbd";
    $("shareMessage").textContent = friendlySupabaseError(error);
    // Keep the exact Supabase error in the console so diagnosis is possible
    // without guessing from a generic message.
    console.error("[Talent Hunter] Supabase error detail:", {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
  } finally {
    publishInProgress = false;
  }
}

function friendlySupabaseError(error) {
  const message = String(error?.message || error || "Unknown error");
  if (/tus|resumable|network|failed to fetch|timeout|load failed/i.test(message)) return "The video upload was interrupted. Check your connection and try again.";
  if (/bucket|storage/i.test(message)) return "Storage bucket 'talent-media' needs to be created or configured.";
  if (/row-level security|permission|not authorized|jwt|unauthorized|forbidden/i.test(message)) return "Supabase permissions (RLS/Storage policies) need to be configured.";
  if (/relation .*talents|does not exist|schema cache/i.test(message)) return "The Supabase 'talents' table is missing or has different columns.";
  return "Could not publish. Open F12 → Console to see the exact Supabase error.";
}

function resetShare() {
  $("talentFile").value = "";
  $("shareDescription").value = "";
  $("shareImagePreview").src = "";
  $("shareVideoPreview").src = "";
  $("shareImagePreview").style.display = "none";
  $("shareVideoPreview").style.display = "none";
  $("uploadPrompt").style.display = "grid";
  resetUploadProgress();
  $("shareMessage").textContent = "";
}

// ---- DISCOVER ------------------------------------------------------------
async function watchTalents() {
  selectedCategory = "All";
  $("talentSearch").value = "";
  buildTalentButtons();

  try {
    if (!supabaseReady && !(await initCloud())) throw new Error("Supabase connection failed.");
    allTalents = await getTalents();
    feedTalents = [...allTalents];
    currentFeedIndex = 0;
    showScreen(6);
    renderFeed();
  } catch (error) {
    console.error("[Talent Hunter] Discover error:", error);
    allTalents = [];
    feedTalents = [];
    currentFeedIndex = 0;
    showScreen(6);
    renderFeed("Could not load talents from Supabase.");
  }
}

function renderFeed(messageOverride = "") {
  document.querySelectorAll(".feed-item").forEach((item) => item.remove());

  const empty = $("feedEmpty");
  const feed = $("feed");
  const hasPosts = feedTalents.length > 0;

  empty.style.display = hasPosts ? "none" : "grid";
  if (!hasPosts) {
    empty.querySelector("h3").textContent = messageOverride || "No talents to show yet";
    empty.querySelector("p").textContent = messageOverride
      ? "Check the F12 Console for the exact Supabase error."
      : "Publish a talent to see it here.";
    updateCounter();
    return;
  }

  feedTalents.forEach((talent, index) => {
    const item = document.createElement("article");
    item.className = `feed-item ${index === currentFeedIndex ? "active" : ""}`;

    let media;
    const fileType = talent.file_type || talent.fileType || "";
    if (fileType.startsWith("video/")) {
      media = document.createElement("video");
      media.controls = false;
      media.loop = true;
      media.muted = true;
      media.playsInline = true;
    } else {
      media = document.createElement("img");
      media.alt = `${talent.name || "Talent"} — ${talent.type || "Other"}`;
    }
    media.className = "feed-media";
    media.src = talent.media_url || talent.mediaUrl || "";

    const shade = document.createElement("div");
    shade.className = "feed-shade";

    const info = document.createElement("div");
    info.className = "feed-info";
    info.innerHTML = `
      <div class="feed-name">@${escapeHtml(talent.name || "Talent")}</div>
      <div class="feed-type">${escapeHtml(talent.type || "Other")}</div>
      <div class="feed-desc">${escapeHtml(talent.description || "")}</div>
    `;

    item.append(media, shade, info);
    feed.appendChild(item);
  });

  updateFeed();
}

function updateFeed() {
  const items = document.querySelectorAll(".feed-item");
  items.forEach((item, index) => {
    item.classList.toggle("active", index === currentFeedIndex);
    const video = item.querySelector("video");
    if (video) video.pause();
  });

  const current = items[currentFeedIndex];
  const video = current?.querySelector("video");
  if (video) {
    video.currentTime = 0;
    video.play().catch(() => {});
  }
  updateCounter();
}

function updateCounter() {
  $("feedCounter").textContent = feedTalents.length ? `${currentFeedIndex + 1} / ${feedTalents.length}` : "0 / 0";
}

function selectCategory(category, button) {
  selectedCategory = category;
  document.querySelectorAll(".category").forEach((item) => item.classList.remove("active"));
  button?.classList.add("active");
  filterTalents();
}

function filterTalents() {
  const query = ($("talentSearch").value || "").trim().toLowerCase();
  feedTalents = allTalents.filter((talent) => {
    const matchesCategory = selectedCategory === "All" || talent.type === selectedCategory;
    const haystack = [talent.name, talent.type, talent.description].filter(Boolean).join(" ").toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });
  currentFeedIndex = 0;
  renderFeed();
}

function clearSearch() {
  $("talentSearch").value = "";
  filterTalents();
}

function nextTalent() {
  if (currentFeedIndex < feedTalents.length - 1) {
    currentFeedIndex++;
    updateFeed();
  }
}

function previousTalent() {
  if (currentFeedIndex > 0) {
    currentFeedIndex--;
    updateFeed();
  }
}

function closeFeed() {
  document.querySelectorAll("video").forEach((video) => video.pause());
  showScreen(4);
}

let touchStartY = 0;
$("feed").addEventListener("touchstart", (event) => {
  touchStartY = event.touches[0].clientY;
}, { passive: true });

$("feed").addEventListener("touchend", (event) => {
  const delta = touchStartY - event.changedTouches[0].clientY;
  if (Math.abs(delta) > 50) delta > 0 ? nextTalent() : previousTalent();
}, { passive: true });

$("feed").addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) < 20) return;
  event.deltaY > 0 ? nextTalent() : previousTalent();
}, { passive: true });

// ---- STARTUP -------------------------------------------------------------
buildTalentButtons();

(async function startApp() {
  const restored = restoreSavedAccount();
  if (restored) showScreen(4);
  else showScreen(1);

  await initCloud();
})();
