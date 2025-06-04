var socket = io.connect();

// Emitir comandos al servidor desde botones en HTML
const startBtn = document.getElementById("startMeasurement");
const stopBtn = document.getElementById("stopMeasurement");

if (startBtn) {
  startBtn.addEventListener("click", () => {
    socket.emit("desde_cliente", "START");
  });
}

if (stopBtn) {
  stopBtn.addEventListener("click", () => {
    socket.emit("desde_cliente", "STOP");
  });
}

// Recibir datos desde el ESP32 (JSON con temperatura y pulso)
socket.on('retransmision_esp32', function(data){
  let parsed;
  try {
    parsed = typeof data === "string" ? JSON.parse(data) : data;
  } catch (err) {
    console.error("Error al parsear JSON:", data);
    return;
  }

  // Mostrar en los spans de la interfaz principal
  document.getElementById("temp").innerText = parsed.temperatura.toFixed(2);
  document.getElementById("dist").innerText = parsed.pulso.toFixed(2);
});

// Recibir y mostrar comando recibido
socket.on('desde_servidor_comando', function(data){
  var cadena = `<div> <strong> &#128187; Comando:  <font color="green">${data}</font> </strong> </div>`;
  document.getElementById("div_comando").innerHTML = cadena;
});
