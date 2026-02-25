const video = document.getElementById("poster");

// URL에서 startTime 가져오기 (선택사항)
const params = new URLSearchParams(window.location.search);
const startTime = parseFloat(params.get("start")) || 0;

// 자동 재생
video.addEventListener("loadedmetadata", () => {
  video.currentTime = startTime;
  // muted false + play() 호출 → 클릭 이벤트 직후라면 브라우저가 허용
  video.muted = false;
  video.play().catch(err => console.log("자동재생 오류:", err));
});