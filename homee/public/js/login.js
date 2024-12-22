const inputs = document.querySelectorAll(".input");

function focusFunx() {
  let parent = this.parentNode.parentNode;
  parent.classList.add("focus");
}

inputs.forEach((input) => {
  input.addEventListener("focus", focusFunx);
});

const form = document.querySelector('form');
form.addEventListener('submit', function (event) {
  const password = document.querySelector('input[name="password"]').value;
  const confirmPassword = document.querySelector('input[name="confirm_password"]').value;

  if (password !== confirmPassword) {
    event.preventDefault(); // Prevent form submission
    alert('Passwords do not match!');
  }
});
