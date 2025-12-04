function addMessage(text, sender) {
  const box = document.getElementById("chatbox");
  const msg = document.createElement("div");
  msg.className = "msg " + sender;
  msg.textContent = text;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

document.getElementById("sendBtn").onclick = sendMessage;
document.getElementById("userInput").onkeydown = (e) => {
  if (e.key === "Enter") sendMessage();
};

function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  // simple bot response
  setTimeout(() => {
    addMessage("You said: " + text, "bot");
  }, 400);
}
