const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("ALTER TABLE purchases ADD COLUMN status TEXT DEFAULT 'completed'", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('La columna "status" ya existe.');
      } else {
        console.error('Error al agregar columna:', err.message);
      }
    } else {
      console.log('Columna "status" agregada con éxito.');
    }
  });
});

db.close();
