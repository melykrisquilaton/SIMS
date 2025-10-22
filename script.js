const API_URL = "http://localhost:3000/students";

const form = document.getElementById("studentForm");
const tableBody = document.getElementById("studentTableBody");
const searchName = document.getElementById("searchName");
const searchProgram = document.getElementById("searchProgram");
const searchGender = document.getElementById("searchGender");
const totalCount = document.getElementById("totalCount");

/* ---------------------------
   Load & Display Students
---------------------------- */
async function loadStudents(filters = {}) {
  let url = API_URL;
  const params = new URLSearchParams(filters);
  if (params.toString()) url += "?" + params.toString();

  const res = await fetch(url);
  const students = await res.json();

  tableBody.innerHTML = "";
  students.forEach((s) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${s.studentID}</td>
      <td>${s.fullName}</td>
      <td>${s.gender}</td>
      <td>${s.gmail}</td>
      <td>${s.program}</td>
      <td>${s.yearLevel}</td>
      <td>${s.university}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id})">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });

  totalCount.textContent = students.length;
}

/* ---------------------------
   Add New Student
---------------------------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newStudent = {
    studentID: document.getElementById("studentID").value,
    fullName: document.getElementById("fullName").value,
    gender: document.getElementById("gender").value,
    gmail: document.getElementById("gmail").value,
    program: document.getElementById("program").value,
    yearLevel: document.getElementById("yearLevel").value,
    university: document.getElementById("university").value,
  };

  // Basic validation
  if (!newStudent.studentID || !newStudent.fullName || !newStudent.gmail) {
    alert("Please fill in all required fields.");
    return;
  }

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newStudent),
  });

  form.reset();
  loadStudents();
});

/* ---------------------------
   Delete Student
---------------------------- */
async function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student?")) return;
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  loadStudents();
}

/* ---------------------------
   Search Filters
---------------------------- */
document.getElementById("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const filters = {
    name: searchName.value.trim(),
    program: searchProgram.value.trim(),
    gender: searchGender.value.trim(),
  };
  loadStudents(filters);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  searchName.value = "";
  searchProgram.value = "";
  searchGender.value = "";
  loadStudents();
});

// Initial load
loadStudents();
