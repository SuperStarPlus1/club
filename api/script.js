// script.js

document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  // ניקוי שגיאות קודמות
  document.querySelectorAll(".error-msg").forEach(el => el.textContent = "");

  const data = {
    first_name: document.getElementById("first_name").value,
    last_name: document.getElementById("last_name").value,
    city: document.getElementById("city").value,
    birthdate: document.getElementById("birthdate").value,
    phone: document.getElementById("phone").value,
    id_number: document.getElementById("id_number").value,
    email: document.getElementById("email").value,
    agree: document.getElementById("agree").checked,
  };

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (res.ok && result.success) {
    alert("נרשמת בהצלחה!");
    document.getElementById("registerForm").reset();
  } else {
    const errorField = result.field || "general";
    const errorMessage = result.error || "שגיאה לא ידועה";
    const errorElement = document.querySelector(`.error-msg[data-field="${errorField}"]`);
    if (errorElement) errorElement.textContent = errorMessage;
    else alert(errorMessage);
  }
});
