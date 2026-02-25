// ------------------
// Video hover
// ------------------
const video = document.getElementById("poster");
const paragraphs = document.querySelectorAll(".center p");

paragraphs.forEach(p => {

  p.addEventListener("mouseenter", () => {
    const videoSrc = p.dataset.video;
    const startTime = parseFloat(p.dataset.start) || 0;

    if(videoSrc){
      video.src = videoSrc;
      video.style.display = "block";


      video.addEventListener("loadedmetadata", function setStart(){
        video.currentTime = startTime;
        video.play();
              document.getElementById("info").style.color = "white";
      document.getElementById("info").style.mixBlendMode = "difference";
        video.removeEventListener("loadedmetadata", setStart);
      });
    }
  });

  p.addEventListener("mouseleave", () => {
    video.pause();
    video.style.display = "none";
  });

  p.addEventListener("click", () => {
    const popupUrl = p.dataset.popup;
    if(!popupUrl) return;

    const width = 900;
    const height = 600;

    // 현재 화면 기준 중앙 계산
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    window.open(
      popupUrl,
      "_blank",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  });

});