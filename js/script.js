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
let sharePreviewObjectUrl = "";

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
  $("checkPhoto").src = photoData || "assets/logo.svg";
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
  if (sharePreviewObjectUrl) {
    URL.revokeObjectURL(sharePreviewObjectUrl);
    sharePreviewObjectUrl = "";
  }
  const image = $("shareImagePreview");
  const video = $("shareVideoPreview");
  const audio = $("shareAudioPreview");

  [image, video, audio].forEach((el) => {
    el.pause?.();
    el.removeAttribute("src");
    el.load?.();
    el.style.display = "none";
  });
  prompt.style.display = "grid";
  if (!file) return;

  const url = URL.createObjectURL(file);
  sharePreviewObjectUrl = url;
  const previewType = inferFileType(file, "application/octet-stream");
  prompt.style.display = "none";
  if (previewType.startsWith("image/")) {
    image.onload = () => { image.style.display = "block"; };
    image.onerror = () => {
      image.style.display = "none";
      prompt.style.display = "grid";
      prompt.querySelector("strong").textContent = "Could not preview this image";
    };
    image.src = url;
  } else if (previewType.startsWith("video/")) {
    video.src = url;
    video.style.display = "block";
    video.load();
  } else if (previewType.startsWith("audio/")) {
    audio.src = url;
    audio.style.display = "block";
    audio.load();
  } else {
    prompt.style.display = "grid";
    prompt.querySelector("strong").textContent = "Unsupported file type";
  }
});

// The upload area advertises drag-and-drop; accept only the first dropped file
// so one upload action always creates one post.
const uploadBox = $("uploadBox");
if (uploadBox) {
  uploadBox.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadBox.classList.add("drag-over");
  });
  uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("drag-over"));
  uploadBox.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadBox.classList.remove("drag-over");
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    try {
      const transfer = new DataTransfer();
      transfer.items.add(file);
      $("talentFile").files = transfer.files;
      $("talentFile").dispatchEvent(new Event("change", { bubbles: true }));
    } catch (error) {
      console.error("[Talent Hunter] Could not read the dropped file:", error);
      $("shareMessage").textContent = "This browser could not read the dropped file. Please use Choose file.";
    }
  });
}

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


const MIME_BY_EXTENSION = {
  mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", aac: "audio/aac",
  ogg: "audio/ogg", opus: "audio/ogg", flac: "audio/flac",
  mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm", ogv: "video/ogg",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif", svg: "image/svg+xml", bmp: "image/bmp"
};

function inferFileType(source, unknownFallback = "image/unknown") {
  const declared = String(source?.type || source?.file_type || source?.fileType || "")
    .toLowerCase().split(";")[0].trim();
  if (declared && declared !== "application/octet-stream") return declared;

  const filename = String(source?.name || source?.media_url || source?.mediaUrl || "");
  const cleanName = filename.split(/[?#]/)[0];
  const extension = cleanName.includes(".") ? cleanName.split(".").pop().toLowerCase() : "";
  return MIME_BY_EXTENSION[extension] || unknownFallback;
}

function getTalentCategory(talent) {
  return String(talent?.type || talent?.category || "Other");
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
        contentType: inferFileType(file, "application/octet-stream"),
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
    // Keep both fields: this database requires category, while older app code uses type.
    category: talentType,
    type: talentType,
    description: description || "",
    file_type: inferFileType(file),
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

  // Read the feed in pages so older posts are not silently dropped when the
  // table grows beyond Supabase's default result window. This is READ ONLY.
  const pageSize = 1000;
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabaseClient
      .from("talents")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const page = data || [];
    rows.push(...page);

    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

let publishInProgress = false;

async function publishTalent() {
  if (publishInProgress) return;

  const file = $("talentFile").files?.[0];
  const description = $("shareDescription").value.trim();

  $("shareMessage").textContent = "";
  if (!file) return $("shareMessage").textContent = "Choose a photo, video or audio recording first.";
  if (file.size > 50 * 1024 * 1024) return $("shareMessage").textContent = "Please choose a file 50 MB or smaller.";
  const resolvedFileType = inferFileType(file, "application/octet-stream");
  const audioFile = resolvedFileType.startsWith("audio/");
  const imageFile = resolvedFileType.startsWith("image/");
  const videoFile = resolvedFileType.startsWith("video/");
  if (!imageFile && !videoFile && !audioFile) {
    return $("shareMessage").textContent = "Please choose an image, video or audio file (MP3, WAV, M4A, AAC, OGG or FLAC).";
  }

  publishInProgress = true;
  setUploadProgress(0, "Preparing upload…");
  $("shareMessage").style.color = "";
  $("shareMessage").textContent = file.size > 6 * 1024 * 1024
    ? `Large ${audioFile ? "audio" : videoFile ? "video" : "image"} file detected — using resumable upload.`
    : "Uploading to Supabase…";

  try {
    if (!supabaseClient) throw new Error("Supabase connection failed.");
    if (!supabaseReady && !(await initCloud())) throw new Error("Supabase connection failed.");

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
  if (/tus|resumable|network|failed to fetch|timeout|load failed/i.test(message)) return "The media upload was interrupted. Check your connection and try again.";
  if (/bucket|storage/i.test(message)) return "Storage bucket 'talent-media' needs to be created or configured.";
  if (/row-level security|permission|not authorized|jwt|unauthorized|forbidden/i.test(message)) return "Supabase permissions (RLS/Storage policies) need to be configured.";
  if (/relation .*talents|does not exist|schema cache/i.test(message)) return "The Supabase 'talents' table is missing or has different columns.";
  return "Could not publish. Open F12 → Console to see the exact Supabase error.";
}

function resetShare() {
  if (sharePreviewObjectUrl) {
    URL.revokeObjectURL(sharePreviewObjectUrl);
    sharePreviewObjectUrl = "";
  }
  $("talentFile").value = "";
  $("shareDescription").value = "";
  $("shareImagePreview").src = "";
  $("shareVideoPreview").pause();
  $("shareAudioPreview").pause();
  $("shareVideoPreview").removeAttribute("src");
  $("shareAudioPreview").removeAttribute("src");
  $("shareVideoPreview").load();
  $("shareAudioPreview").load();
  $("shareVideoPreview").style.display = "none";
  $("shareAudioPreview").style.display = "none";
  $("shareImagePreview").style.display = "none";
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
  const feed = $("feed");
  const empty = $("feedEmpty");
  if (!feed || !empty) return;

  // Stop old players before rebuilding the feed. The old nodes are then removed.
  pauseAllMedia();
  feed.querySelectorAll(".feed-item").forEach((item) => item.remove());

  const hasPosts = Array.isArray(feedTalents) && feedTalents.length > 0;
  empty.style.display = hasPosts ? "none" : "grid";
  if (!hasPosts) {
    empty.querySelector("h3").textContent = messageOverride || "No talents to show yet";
    empty.querySelector("p").textContent = messageOverride
      ? "Check the browser console for the exact Supabase error."
      : "Publish a talent to see it here.";
    return;
  }

  currentFeedIndex = Math.max(0, Math.min(currentFeedIndex, feedTalents.length - 1));

  feedTalents.forEach((talent, index) => {
    const item = document.createElement("article");
    item.className = "feed-item";
    item.dataset.index = String(index);
    item.setAttribute("aria-label", `Post ${index + 1} of ${feedTalents.length}`);

    const mediaUrl = String(talent.media_url || talent.mediaUrl || "");
    const fileType = inferFileType({
      file_type: talent.file_type || talent.fileType || "",
      media_url: mediaUrl
    });
    const category = getTalentCategory(talent);
    let media;

    if (fileType.startsWith("video/")) {
      media = document.createElement("video");
      media.className = "feed-media";
      media.loop = true;
      media.muted = true;
      media.defaultMuted = true;
      media.playsInline = true;
      media.preload = index === currentFeedIndex ? "auto" : "metadata";
      media.setAttribute("playsinline", "");
      media.setAttribute("webkit-playsinline", "");
      media.setAttribute("aria-label", `Video by ${talent.name || "Talent"}`);
      media.addEventListener("loadedmetadata", () => {
        media.classList.toggle("feed-fit-contain", media.videoWidth / Math.max(1, media.videoHeight) > 0.8);
      }, { once: true });
      media.addEventListener("canplay", () => {
        if (item.classList.contains("active") && media.paused) {
          startFeedVideo(media, false);
        }
      });
      media.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;
        if (media.paused) startFeedVideo(media, true);
        else if (media.muted) {
          media.muted = false;
          media.defaultMuted = false;
          media.volume = 1;
        } else media.pause();
      });
      media.addEventListener("error", () => {
        console.error("[Talent Hunter] Video failed to load:", mediaUrl);
        item.classList.add("media-load-error");
      }, { once: true });
      if (mediaUrl) media.src = mediaUrl;
      else item.classList.add("media-load-error");
    } else if (fileType.startsWith("audio/")) {
      media = document.createElement("div");
      media.className = "feed-media feed-audio-card";

      const artwork = document.createElement("div");
      artwork.className = "audio-art";
      artwork.textContent = "♫";
      const title = document.createElement("div");
      title.className = "audio-title";
      title.textContent = "Audio recording";
      const subtitle = document.createElement("div");
      subtitle.className = "audio-subtitle";
      subtitle.textContent = talent.name || "Talent";
      const player = document.createElement("audio");
      player.controls = true;
      player.preload = "metadata";
      if (mediaUrl) player.src = mediaUrl;
      else item.classList.add("media-load-error");
      player.addEventListener("error", () => item.classList.add("media-load-error"), { once: true });
      media.append(artwork, title, subtitle, player);
    } else {
      media = document.createElement("img");
      media.className = "feed-media";
      media.alt = `${talent.name || "Talent"} — ${category}`;
      media.decoding = "async";
      media.loading = index <= currentFeedIndex + 1 ? "eager" : "lazy";
      media.addEventListener("load", () => {
        media.classList.toggle("feed-fit-contain", media.naturalWidth / Math.max(1, media.naturalHeight) > 0.8);
      }, { once: true });
      media.addEventListener("error", () => {
        console.error("[Talent Hunter] Image failed to load:", mediaUrl);
        item.classList.add("media-load-error");
      }, { once: true });
      if (mediaUrl) media.src = mediaUrl;
      else item.classList.add("media-load-error");
    }

    const shade = document.createElement("div");
    shade.className = "feed-shade";

    const info = document.createElement("div");
    info.className = "feed-info";
    const name = document.createElement("div");
    name.className = "feed-name";
    name.textContent = `@${talent.name || "Talent"}`;
    const type = document.createElement("div");
    type.className = "feed-type";
    type.textContent = category;
    const description = document.createElement("div");
    description.className = "feed-desc";
    description.textContent = talent.description || "";
    info.append(name, type, description);

    item.append(media, shade, info);
    feed.appendChild(item);
  });

  updateFeed({ autoplay: true, startFromBeginning: true, userInitiated: false });
}

function pauseAllMedia(except = null, reset = false) {
  document.querySelectorAll("video, audio").forEach((player) => {
    if (player === except) return;
    player.pause();
    if (reset) {
      try { player.currentTime = 0; } catch (_) { /* Some streams are not seekable. */ }
    }
  });
}

function startFeedVideo(video, userInitiated = false) {
  if (!video || !video.isConnected || !video.closest(".feed-item.active")) return;

  // Try audible autoplay after an actual swipe/touch. If the browser blocks it,
  // retry muted, which is the autoplay mode accepted by mobile browsers.
  video.muted = !userInitiated;
  video.defaultMuted = !userInitiated;
  video.volume = 1;
  video.playsInline = true;

  const attempt = video.play();
  if (attempt && typeof attempt.catch === "function") {
    attempt.catch((error) => {
      if (!video.isConnected || !video.closest(".feed-item.active")) return;
      video.muted = true;
      video.defaultMuted = true;
      video.play().catch((fallbackError) => {
        if (fallbackError?.name !== "AbortError") {
          console.warn("[Talent Hunter] Video autoplay was blocked:", error || fallbackError);
        }
      });
    });
  }
}

function updateFeed(options = {}) {
  const {
    autoplay = true,
    startFromBeginning = false,
    userInitiated = false
  } = options;
  const items = Array.from(document.querySelectorAll(".feed-item"));

  items.forEach((item, index) => {
    const isActive = index === currentFeedIndex;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-hidden", isActive ? "false" : "true");
    item.style.transform = `translate3d(0, ${(index - currentFeedIndex) * 100}%, 0)`;

    item.querySelectorAll("video, audio").forEach((player) => {
      if (!isActive) {
        player.pause();
        try { player.currentTime = 0; } catch (_) { /* Live media may not be seekable. */ }
      }
    });
  });

  const current = items[currentFeedIndex];
  const video = current?.querySelector("video");
  if (video && autoplay) {
    if (startFromBeginning) {
      try { video.currentTime = 0; } catch (_) { /* Wait until metadata is available. */ }
    }
    video.preload = "auto";
    if (video.paused || startFromBeginning) startFeedVideo(video, userInitiated);
  }
}

function selectCategory(category, button) {
  selectedCategory = category;
  document.querySelectorAll(".category").forEach((item) => {
    item.classList.toggle("active", item === button || item.textContent.trim() === category);
  });
  filterTalents();
}

function filterTalents() {
  const query = ($("talentSearch")?.value || "").trim().toLowerCase();
  feedTalents = allTalents.filter((talent) => {
    const category = getTalentCategory(talent);
    const matchesCategory = selectedCategory === "All" || category === selectedCategory;
    const haystack = [talent.name, category, talent.description].filter(Boolean).join(" ").toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });
  currentFeedIndex = 0;
  renderFeed();
}

function clearSearch() {
  const search = $("talentSearch");
  if (search) search.value = "";
  filterTalents();
}

let feedTransitionLocked = false;
let feedTransitionTimer = null;

function goToTalentIndex(index, options = {}) {
  if (!feedTalents.length || feedTransitionLocked) return false;
  const nextIndex = Math.max(0, Math.min(feedTalents.length - 1, index));
  if (nextIndex === currentFeedIndex) return false;

  const { userInitiated = false } = options;
  feedTransitionLocked = true;
  window.clearTimeout(feedTransitionTimer);
  currentFeedIndex = nextIndex;
  updateFeed({ autoplay: true, startFromBeginning: true, userInitiated });

  // One completed gesture can move exactly one item. Ignore additional input
  // until the slide transition has settled.
  feedTransitionTimer = window.setTimeout(() => {
    feedTransitionLocked = false;
  }, 520);
  return true;
}

function nextTalent(userInitiated = false) {
  return goToTalentIndex(currentFeedIndex + 1, { userInitiated });
}

function previousTalent(userInitiated = false) {
  return goToTalentIndex(currentFeedIndex - 1, { userInitiated });
}

function closeFeed() {
  pauseAllMedia(null, true);
  showScreen(4);
}

// One swipe or one wheel gesture advances exactly one full-screen post.
const feedStage = $("feed");
let touchGesture = null;
let wheelLocked = false;
let wheelGestureTriggered = false;
let wheelDeltaTotal = 0;
let wheelUnlockTimer = null;

function isFeedControlTarget(target) {
  return Boolean(target?.closest(
    "button, input, textarea, audio, a, .feed-toolbar, .th-profile-overlay, .th-profile-open"
  ));
}

feedStage.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 1 || isFeedControlTarget(event.target)) {
    touchGesture = null;
    return;
  }
  const touch = event.touches[0];
  touchGesture = {
    startX: touch.clientX,
    startY: touch.clientY,
    lastX: touch.clientX,
    lastY: touch.clientY,
    isVertical: false
  };
}, { passive: true });

feedStage.addEventListener("touchmove", (event) => {
  if (!touchGesture || event.touches.length !== 1) return;
  const touch = event.touches[0];
  const dx = touch.clientX - touchGesture.startX;
  const dy = touch.clientY - touchGesture.startY;
  touchGesture.lastX = touch.clientX;
  touchGesture.lastY = touch.clientY;

  if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
    touchGesture.isVertical = true;
    event.preventDefault();
  }
}, { passive: false });

feedStage.addEventListener("touchend", (event) => {
  if (!touchGesture) return;
  const touch = event.changedTouches[0];
  const deltaY = touchGesture.startY - (touch?.clientY ?? touchGesture.lastY);
  const deltaX = Math.abs(touchGesture.startX - (touch?.clientX ?? touchGesture.lastX));
  const isVertical = touchGesture.isVertical || Math.abs(deltaY) > Math.abs(deltaX) * 1.15;
  touchGesture = null;

  if (!isVertical || Math.abs(deltaY) < 48 || feedTransitionLocked) return;
  if (deltaY > 0) nextTalent(true);
  else previousTalent(true);
}, { passive: true });

feedStage.addEventListener("touchcancel", () => { touchGesture = null; }, { passive: true });

document.addEventListener("keydown", (event) => {
  if (!$("screen6")?.classList.contains("active") || isFeedControlTarget(event.target)) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    nextTalent(true);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    previousTalent(true);
  }
});

feedStage.addEventListener("wheel", (event) => {
  const delta = event.deltaMode === 1 ? event.deltaY * 16
    : event.deltaMode === 2 ? event.deltaY * window.innerHeight
    : event.deltaY;
  if (Math.abs(delta) < 1) return;
  event.preventDefault();

  if (!wheelLocked) {
    wheelLocked = true;
    wheelGestureTriggered = false;
    wheelDeltaTotal = 0;
  }
  wheelDeltaTotal += delta;
  window.clearTimeout(wheelUnlockTimer);
  wheelUnlockTimer = window.setTimeout(() => {
    wheelLocked = false;
    wheelGestureTriggered = false;
    wheelDeltaTotal = 0;
  }, 220);

  if (!wheelGestureTriggered && Math.abs(wheelDeltaTotal) >= 42) {
    wheelGestureTriggered = true;
    if (!feedTransitionLocked) {
      if (wheelDeltaTotal > 0) nextTalent(true);
      else previousTalent(true);
    }
  }
}, { passive: false });

// Native media controls and profile previews share the same single-playback rule.
document.addEventListener("play", (event) => {
  const currentPlayer = event.target;
  if (!(currentPlayer instanceof HTMLMediaElement)) return;
  pauseAllMedia(currentPlayer, false);
}, true);

// ---- STARTUP -------------------------------------------------------------
buildTalentButtons();

(async function startApp() {
  const restored = restoreSavedAccount();
  if (restored) showScreen(4);
  else showScreen(1);

  await initCloud();
})();


/* ============================================================
   TALENT HUNTER — SAFE ENHANCEMENTS
   No Supabase SQL/table/RLS/Storage settings are changed.
   Existing page design/layout is preserved.
   ============================================================ */

(function () {
  /* ---------- Animations: behavior only ---------- */
  if (!document.getElementById("th-safe-enhancements-style")) {
    const style = document.createElement("style");
    style.id = "th-safe-enhancements-style";
    style.textContent = `
      .screen.th-enter{animation:thScreenEnter .42s cubic-bezier(.22,.8,.25,1) both}
      @keyframes thScreenEnter{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

      .th-profile-overlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(4,7,18,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .th-profile-overlay.open{display:flex}
      .th-profile-card{width:min(920px,100%);max-height:min(88vh,900px);overflow:auto;border-radius:28px;padding:22px;background:rgba(20,24,42,.88);border:1px solid rgba(255,255,255,.13);box-shadow:0 30px 90px rgba(0,0,0,.45)}
      .th-profile-head{display:flex;align-items:center;gap:14px;margin-bottom:18px}
      .th-profile-avatar{width:64px;height:64px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06)}
      .th-profile-meta{min-width:0;flex:1}
      .th-profile-name{margin:0;font-size:1.35rem;font-weight:800;word-break:break-word}
      .th-profile-type{margin-top:4px;opacity:.72;font-size:.92rem}
      .th-profile-close{border:0;background:rgba(255,255,255,.08);color:inherit;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:1.35rem}
      .th-profile-data{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}
      .th-profile-data>div{padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07)}
      .th-profile-data span{display:block;font-size:.72rem;opacity:.55;margin-bottom:4px}
      .th-profile-data strong{display:block;word-break:break-word}
      .th-profile-files{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}
      .th-profile-file{overflow:hidden;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08)}
      .th-profile-file-media{display:block;width:100%;height:220px;object-fit:cover;background:#080b18}
      .th-profile-file-caption{padding:10px 12px 12px;font-size:.82rem;line-height:1.45}
      .th-profile-file-caption small{display:block;opacity:.55;margin-top:5px}
      .th-profile-open{position:absolute;right:14px;bottom:max(16px,env(safe-area-inset-bottom));z-index:4;border:1px solid rgba(255,255,255,.2);background:rgba(8,11,24,.72);color:inherit;border-radius:999px;padding:9px 13px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      @media(max-width:620px){.th-profile-overlay{padding:10px}.th-profile-card{padding:16px;border-radius:22px}.th-profile-data{grid-template-columns:1fr}.th-profile-files{grid-template-columns:1fr}.th-profile-file-media{height:250px}}
    `;
    document.head.appendChild(style);
  }

  const originalShowScreen = window.showScreen;
  if (originalShowScreen && !window.__thShowScreenPatched) {
    window.__thShowScreenPatched = true;
    window.showScreen = function (number) {
      originalShowScreen(number);
      const target = document.getElementById("screen" + number);
      if (!target) return;
      target.classList.remove("th-enter");
      void target.offsetWidth;
      target.classList.add("th-enter");
    };
  }

  /* Profile video sound is controlled by the browser's native media controls.
     Feed playback itself is managed by the one-active-post controller above. */
  function enableVideoSound(video) {
    if (!video) return;
    video.muted = false;
    video.volume = 1;
  }

  /* ---------- Talent profiles ---------- */
  function identity(row) {
    const phone = String(row && row.phone || "").trim();
    const name = String(row && row.name || "").trim().toLowerCase();
    return phone ? "phone:" + phone : "name:" + name;
  }

  function rowsForProfile(row) {
    const key = identity(row);
    return (allTalents || []).filter(item => identity(item) === key);
  }

  function profilePhoto(rows) {
    const image = rows.find(row => inferFileType(row).startsWith("image/"));
    return (image && image.media_url) || "assets/logo.svg";
  }

  function fileCard(row) {
    const type = inferFileType(row);
    const url = row && (row.media_url || row.mediaUrl);
    if (!url) return "";

    const caption = escapeHtml((row && row.description) || "");
    const date = row && row.created_at
      ? new Date(row.created_at).toLocaleString() : "";
    let media = "";

    if (type.startsWith("video/")) {
      media = `<video class="th-profile-file-media" src="${escapeHtml(url)}" controls playsinline preload="metadata"></video>`;
    } else if (type.startsWith("audio/")) {
      media = `<div style="padding:24px 14px"><audio style="width:100%" src="${escapeHtml(url)}" controls preload="metadata"></audio></div>`;
    } else if (type.startsWith("image/")) {
      media = `<img class="th-profile-file-media" src="${escapeHtml(url)}" alt="Talent media" loading="lazy">`;
    } else {
      media = `<a class="th-profile-file-media" href="${escapeHtml(url)}" target="_blank" rel="noopener" style="display:grid;place-items:center;text-decoration:none">Open file</a>`;
    }

    return `<article class="th-profile-file">${media}<div class="th-profile-file-caption">${caption || "Talent file"}${date ? `<small>${escapeHtml(date)}</small>` : ""}</div></article>`;
  }

  window.openTalentProfile = function (selectedRow) {
    pauseAllMedia();
    const rows = rowsForProfile(selectedRow);
    if (!rows.length) return;

    let overlay = document.getElementById("thProfileOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "thProfileOverlay";
      overlay.className = "th-profile-overlay";
      overlay.innerHTML = `<div class="th-profile-card" role="dialog" aria-modal="true"><div id="thProfileContent"></div></div>`;
      overlay.addEventListener("click", e => {
        if (e.target === overlay) window.closeTalentProfile();
      });
      document.body.appendChild(overlay);
    }

    const name = selectedRow && selectedRow.name || "Talent";
    const type = selectedRow && (selectedRow.type || selectedRow.category) || "Other";
    const phone = selectedRow && selectedRow.phone || "—";
    const description = selectedRow && selectedRow.description || "—";
    const avatar = profilePhoto(rows);

    document.getElementById("thProfileContent").innerHTML = `
      <div class="th-profile-head">
        <img class="th-profile-avatar" src="${escapeHtml(avatar)}" alt="Profile photo">
        <div class="th-profile-meta">
          <h2 class="th-profile-name">@${escapeHtml(name)}</h2>
          <div class="th-profile-type">${escapeHtml(type)} • ${rows.length} file${rows.length === 1 ? "" : "s"}</div>
        </div>
        <button class="th-profile-close" type="button" onclick="closeTalentProfile()" aria-label="Close">×</button>
      </div>
      <div class="th-profile-data">
        <div><span>Name</span><strong>${escapeHtml(name)}</strong></div>
        <div><span>Phone</span><strong>${escapeHtml(phone)}</strong></div>
        <div><span>Talent</span><strong>${escapeHtml(type)}</strong></div>
        <div><span>Latest caption</span><strong>${escapeHtml(description)}</strong></div>
      </div>
      <div class="th-profile-files">${rows.map(fileCard).join("")}</div>
    `;

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    overlay.querySelectorAll("video").forEach(video => {
      video.addEventListener("play", () => enableVideoSound(video), { once: true });
    });
  };

  window.closeTalentProfile = function () {
    const overlay = document.getElementById("thProfileOverlay");
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.querySelectorAll("video, audio").forEach(player => player.pause());
    document.body.style.overflow = "";
    if (document.getElementById("screen6")?.classList.contains("active")) {
      updateFeed({ autoplay: true, startFromBeginning: false, userInitiated: false });
    }
  };

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") window.closeTalentProfile();
  });

  /* Add a profile button to every feed item after the original renderer runs. */
  const originalRenderFeed = window.renderFeed;
  if (originalRenderFeed && !window.__thFeedPatched) {
    window.__thFeedPatched = true;
    window.renderFeed = function (messageOverride = "") {
      originalRenderFeed(messageOverride);

      document.querySelectorAll(".feed-item").forEach((item, index) => {
        const row = feedTalents[index];
        if (!row || item.querySelector(".th-profile-open")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "th-profile-open";
        button.textContent = "View profile";
        button.setAttribute("aria-label", `View ${row.name || "talent"} profile`);
        button.addEventListener("click", e => {
          e.stopPropagation();
          window.openTalentProfile(row);
        });

        item.appendChild(button);
      });

      /* Media defaults are configured when each feed item is created.
         Do not reset mute state here: that would override user interaction. */
    };
  }
})();
