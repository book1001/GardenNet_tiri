let bodyParts = {};
let channel = new BroadcastChannel("body-channel");

// ------------------
// 각 부위별 팝업 크기
// ------------------
const partSizes = {
  head: {width:200, height:233},
  torso: {width:275, height:400},
  leftArm: {width:435, height:130},
  rightArm: {width:435, height:130},
  leftArmExt: {width:435, height:130},
  rightArmExt: {width:435, height:130},
  legs: {width:559, height:230} 
};

// ------------------
// 팝업 생성
// 순서: arms/legs → torso → head
// ------------------
function openBody(){

  const order = [
    "leftArmExt","rightArmExt",
    "leftArm","rightArm",
    "torso",
    "legs",
    "head"
  ];

  order.forEach(part=>{
    const size = partSizes[part];

    // 현재 브라우저 화면 기준 중앙 계산
    const left = window.screenX + (window.innerWidth - size.width) / 2;
    const top = window.screenY + (window.innerHeight - size.height) / 2;

    bodyParts[part] = window.open(
      "tiri.html?part=" + part,
      "_blank",
      `width=${size.width},height=${size.height},left=${left},top=${top}`
    );
  });

}

// ------------------
// MediaPipe Hands
// ------------------
const videoElement = document.getElementById('video');

const hands = new Hands({
  locateFile: file =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// ------------------------
hands.onResults(results => {

  if(results.multiHandLandmarks.length === 2){

    // ------------------------
    // 왼손 / 오른손 판별
    // ------------------------
    let leftHand, rightHand;
    results.multiHandedness.forEach((hand, i)=>{
      if(hand.label === "Left") leftHand = results.multiHandLandmarks[i];
      if(hand.label === "Right") rightHand = results.multiHandLandmarks[i];
    });

    if(!leftHand || !rightHand) return;

    const xLeft = leftHand[9].x * window.innerWidth;
    const yLeft = leftHand[9].y * window.innerHeight;
    const xRight = rightHand[9].x * window.innerWidth;
    const yRight = rightHand[9].y * window.innerHeight;

    const centerX = (xLeft + xRight)/2;
    const centerY = (yLeft + yRight)/2;

    const dx = xRight - xLeft;
    const distance = Math.abs(dx);
    const dy = yRight - yLeft;

    // 머리 각도
    const angle = Math.atan2(dy, dx);
    const swing = Math.abs(yLeft - yRight);

    // ------------------------
    // 조건 만족 시 버튼 텍스트 변경
    // ------------------------
    if(angle > 0.5 || distance > 800){
      document.getElementById("tiri").innerText = "Participate";
      document.getElementById("tiri").style.fontSize = "375px";
    } else {
      document.getElementById("tiri").innerText = "GO";
      document.getElementById("tiri").style.fontSize = "930px";
    }

    // ------------------------
    // TORSO 기준
    // ------------------------
    if(bodyParts.torso){
      const s = partSizes.torso;
      bodyParts.torso.moveTo(centerX - s.width/2, centerY - s.height/2);
    }
    const torsoTop = centerY - partSizes.torso.height/2;
    const torsoBottom = centerY + partSizes.torso.height/2;

    // ------------------------
    // HEAD
    // ------------------------
    if(bodyParts.head){
      const s = partSizes.head;
      const neckLift = 30;
      bodyParts.head.moveTo(centerX - s.width/2, torsoTop - s.height - neckLift);
    }

    // ------------------------
    // ARMS
    // ------------------------
    const armYInfluence = 0.3;
    if(bodyParts.leftArm){
      const s = partSizes.leftArm;
      const offsetY = (yLeft - centerY) * armYInfluence;
      bodyParts.leftArm.moveTo(xLeft - s.width/2, torsoTop + offsetY);
    }
    if(bodyParts.rightArm){
      const s = partSizes.rightArm;
      const offsetY = (yRight - centerY) * armYInfluence;
      bodyParts.rightArm.moveTo(xRight - s.width/2, torsoTop + offsetY);
    }

    // ------------------------
    // ARM EXTENSIONS (가로축을 torso 쪽으로 이동)
    // ------------------------
    if(bodyParts.leftArmExt){
      const s = partSizes.leftArmExt;
      const midX = (centerX - partSizes.torso.width/2) * 0.7 + xLeft * 0.3;
      bodyParts.leftArmExt.moveTo(midX - s.width/2, torsoTop - 10);
    }

    if(bodyParts.rightArmExt){
      const s = partSizes.rightArmExt;
      const midX = (centerX + partSizes.torso.width/2) * 0.7 + xRight * 0.3;
      bodyParts.rightArmExt.moveTo(midX - s.width/2, torsoTop - 10);
    }

    // ------------------------
    // LEGS
    // ------------------------
    if(bodyParts.legs){
      const s = partSizes.legs;
      bodyParts.legs.moveTo(centerX - s.width/2, torsoBottom - 10);
    }

    // ------------------------
    // 화면 끝 감지
    // ------------------------
    const threshold = 50; // 완화: 50px 안쪽이면 끝에 닿은 것으로 판단
    let atEdges = false;

    if(xLeft < threshold || xRight > window.innerWidth - threshold){
      atEdges = true;
    }

    // index.html 글자 표시 & 배경색
    if(atEdges){
      document.getElementById("info").style.display = "block";
      document.getElementById("scroll").style.display = "block";
      document.body.style.background = "white";
      document.getElementById("tiri").innerText = "GO";
      document.getElementById("tiri").style.fontSize = "930px";
      document.getElementById("tiri").style.pointerEvents = "none";

      // 모든 팝업에도 메시지 전송
      Object.values(bodyParts).forEach(popup=>{
        if(popup && !popup.closed) popup.postMessage({changeBG:true},"*");
      });

    } 

    // 상태 전달 (팝업 이미지용)
    channel.postMessage({
      headAngle: angle,
      armSpread: distance,
      armSwing: swing
    });
  }
});

// ------------------
const camera = new Camera(videoElement,{
  onFrame: async()=>{
    await hands.send({image:videoElement});
  },
  width:640,
  height:480
});

camera.start();



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