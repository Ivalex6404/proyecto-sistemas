const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(session({
  secret: 'secretKey',
  resave: false,
  saveUninitialized: false,
}));

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(__dirname + '/public/index.html');
  } else {
    res.redirect('/login.html');
  }
});

app.use(express.static('public'));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1V2l3X123!',
  database: 'mediciones'
});

db.connect(err => {
  if (err) {
    console.error('Error de conexión a MySQL:', err);
  } else {
    console.log('Conectado a MySQL');
  }
});

app.post('/registro.html', async (req, res) => {
  const { nombre, correo, password } = req.body;

  db.query('SELECT * FROM doctores WHERE correo = ?', [correo], async (err, results) => {
    if (err) return res.status(500).send('Error en base de datos');
    if (results.length > 0) return res.status(400).send('Correo ya registrado');

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO doctores (nombre, correo, password) VALUES (?, ?, ?)',
      [nombre, correo, hashedPassword],
      (err) => {
        console.error('Error al registrar:', err);
        if (err) return res.status(500).send('Error al registrar');
        res.redirect('/login.html');
      }
    );
  });
});

app.post('/login.html', (req, res) => {
  const { correo, password } = req.body;

  db.query('SELECT * FROM doctores WHERE correo = ?', [correo], async (err, results) => {
    if (err) return res.status(500).send('Error en base de datos');
    if (results.length === 0) return res.status(401).send('Correo no encontrado');

    const doctor = results[0];
    const match = await bcrypt.compare(password, doctor.password);

    if (match) {
      req.session.userId = doctor.id;
      res.redirect('/');
    } else {
      res.status(401).send('Contraseña incorrecta');
    }
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

app.post('/api/pacientes', (req, res) => {
  const { nombre, edad, fecha_consul, sexo, temperatura, pulso } = req.body;
  const doctor_id = req.session.userId || 1;

  const query = `
    INSERT INTO pacientes (nombre, sexo, edad, fecha_consul, doctor_id, temperatura, pulso)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [nombre, sexo, edad, fecha_consul, doctor_id, temperatura, pulso], (err) => {
    if (err) {
      console.error("Error al guardar paciente:", err);
      return res.status(500).json({ message: "Error al guardar paciente." });
    }
    res.status(200).json({ message: "Paciente guardado exitosamente." });
  });
});

let medicionActiva = false;

io.on('connection', (socket) => {
  console.log('Nuevo dispositivo conectado.');

  socket.on('data', (data) => {
    console.log(`Datos del ESP32: ${data}`);
  });

  socket.on('desde_cliente', (data) => {
    console.log(`Desde página: ${data}`);
    if (data === "iniciar_medicion") {
      medicionActiva = true;
    } else if (data === "detener_medicion") {
      medicionActiva = false;
    }
    io.sockets.emit("desde_servidor_comando", data);
  });

  socket.on('desde_esp32', (data) => {
    console.log("ESP32:", data);
    if (medicionActiva) {
      io.sockets.emit("retransmision_esp32", data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Dispositivo desconectado.');
  });
});

server.listen(3000, () => {
  console.log('Servidor escuchando en puerto 3000');
});
