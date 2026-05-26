function toggleAnswer(element) {
    const answer = element.nextElementSibling;
    const symbol = element.querySelector('.symbol');
  
    if (answer.style.display === "block") {
      answer.style.display = "none";
      symbol.textContent = '+';
    } else {
      answer.style.display = "block";
      symbol.textContent = '-';
    }
  
    element.classList.toggle('active');
  }