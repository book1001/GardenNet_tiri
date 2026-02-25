const video = document.getElementById("poster");

// startTime (optional)
const params = new URLSearchParams(window.location.search);
const startTime = parseFloat(params.get("start")) || 0;

// autoplay
video.addEventListener("loadedmetadata", () => {
  video.currentTime = startTime;

  video.muted = false;
  video.play().catch(err => console.log("자동재생 오류:", err));
});