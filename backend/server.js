const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const DATA_FILE = "./students.json"; 

app.use(cors());
app.use(bodyParser.json());

/* ---------------------------
   Utility Functions
---------------------------- */
function readStudents() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
}

function saveStudents(students) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
}

/* ---------------------------
   Routes
---------------------------- */

//  GET /students (with search/filter)
app.get("/students", (req, res) => {
  let students = readStudents();

  const { name, program, gender } = req.query;

  if (name) {
    students = students.filter((s) =>
      s.fullName.toLowerCase().includes(name.toLowerCase())
    );
  }
  if (program) {
    students = students.filter((s) =>
      s.program.toLowerCase().includes(program.toLowerCase())
    );
  }
  if (gender) {
    students = students.filter(
      (s) => s.gender.toLowerCase() === gender.toLowerCase()
    );
  }

  res.json(students);
});

//  POST /students (add a new student)
app.post("/students", (req, res) => {
  const students = readStudents();
  const newStudent = req.body;

  // Basic validation
  if (
    !newStudent.studentID ||
    !newStudent.fullName ||
    !newStudent.gender ||
    !newStudent.gmail
  ) {
    return res.status(400).json({ message: "Missing required fields!" });
  }

  newStudent.id = Date.now(); // unique ID
  students.push(newStudent);
  saveStudents(students);
  res.json({ message: " Student added successfully!", student: newStudent });
});

//  DELETE /students/:id (optional)
app.delete("/students/:id", (req, res) => {
  let students = readStudents();
  const { id } = req.params;
  const originalLength = students.length;
  students = students.filter((s) => s.id != id);

  if (students.length === originalLength) {
    return res.status(404).json({ message: "Student not found!" });
  }

  saveStudents(students);
  res.json({ message: " Student deleted successfully!" });
});

/* ---------------------------
   Server Start
---------------------------- */
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
