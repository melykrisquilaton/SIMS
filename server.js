require("dotenv").config();

const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { Groq } = require("groq-sdk");

//console.log("GROQ KEY:", process.env.GROQ_API_KEY);

const app = express();
const PORT = 3000;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const DATA_FILE = "./students.json"; 

app.use(cors());
app.use(express.json());


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

//  DELETE /students/:id 
app.delete("/students/:id", (req, res) => {
  let students = readStudents();
  const { id } = req.params;
  const originalLength = students.length;
  students = students.filter((s) => String(s.id) !== id);

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

// ===============================
// LLM /ask-llm ROUTE
// ===============================

app.post("/ask-llm", async (req, res) => {
  try {
    const { question } = req.body;
    const students = readStudents();
    const q = question.toLowerCase();

    // ===============================
    // PRE-COMPUTED DATA (CUSTOM DATA)
    // ===============================
    const total = students.length;
    const male = students.filter(s => s.gender.toLowerCase() === "male").length;
    const female = students.filter(s => s.gender.toLowerCase() === "female").length;

    const programs = [...new Set(students.map(s => s.program))];
    const years = [...new Set(students.map(s => s.yearLevel))];

    // ===============================
    // RULE-BASED ANSWERS (NO LLM ❌)
    // ===============================
    if (q.includes("female")) {
      return res.json({ answer: `There are ${female} female students enrolled.` });
    }

    if (q.includes("male")) {
      return res.json({ answer: `There are ${male} male students enrolled.` });
    }

    if (q.includes("total")) {
      return res.json({ answer: `There are ${total} students in total.` });
    }

    if (q.includes("program")) {
      return res.json({ answer: `Available programs are: ${programs.join(", ")}.` });
    }

    if (q.includes("year")) {
      return res.json({ answer: `Year levels present are: ${years.join(", ")}.` });
    }

    // ===============================
    // SMALL SUMMARY ONLY (LLM SAFE)
    // ===============================
    const summary = `
    Total students: ${total}
    Male: ${male}
    Female: ${female}
    Programs: ${programs.join(", ")}
    Year Levels: ${years.join(", ")}
    `;

    // ===============================
    // LLM ONLY FOR COMPLEX QUESTIONS
    // ===============================
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You answer questions strictly based on the provided student summary."
        },
        {
          role: "user",
          content: `Question: ${question}\n\nStudent Summary:\n${summary}`
        }
      ],
      max_tokens: 120
    });

    res.json({
      answer: completion.choices[0].message.content
    });

  } catch (err) {
    console.error("LLM ERROR:", err.message);

    res.json({
      answer: "AI service is currently unavailable. Showing system-based result instead."
    });
  }
});


